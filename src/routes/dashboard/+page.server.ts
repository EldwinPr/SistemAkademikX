import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { CryptoService } from '$lib/services/crypto.service';
import { SignatureService } from '$lib/services/signature.service';
import { PDFService } from '$lib/services/pdf.service';
import type { AcademicRecord, Course} from '$lib/types/academic.types';
import type { DigitalSignature } from '$lib/types/crypto.types';
import { VerificationStatus } from '$lib/types/academic.types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth/login');

	const user = locals.user.user;
	let students: any[] = [],
		allRecords: any[] = [],
		allAdvisors: any[] = [],
		programRecords: any[] = [];

	if (user.role === 'Dosen_Wali') {
		students = await db.user.findMany({ where: { role: 'Mahasiswa', DosenId: user.id }, select: { id: true, nim: true, fullName: true }, orderBy: { fullName: 'asc' } });
		allRecords = await db.transkrip.findMany({ select: { id: true, student: { select: { nim: true, fullName: true } } }, orderBy: { createdAt: 'desc' } });
		allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
		programRecords = allRecords;
	} else if (user.role === 'Kepala_Program_Studi') {
		programRecords = await db.transkrip.findMany({
			where: { student: { programStudi: user.programStudi } },
			select: { id: true, createdAt: true, student: { select: { nim: true, fullName: true } }, digitalSignature: true },
			orderBy: { createdAt: 'desc' }
		});
	} else if (user.role === 'Mahasiswa') {
		programRecords = await db.transkrip.findMany({
			where: { studentId: user.id },
			select: { id: true, createdAt: true, student: { select: { nim: true, fullName: true } }, digitalSignature: true }
		});
	}

	return { userContext: locals.user, students, allRecords, allAdvisors, programRecords };
};

export const actions: Actions = {
	inputRecord: async ({ request, locals }) => {
		const advisor = locals.user?.user;
		if (!advisor || advisor.role !== 'Dosen_Wali' || !advisor.publicKey) return fail(403, { error: 'Akses ditolak.' });
		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;
			const aesKey = formData.get('aesKey') as string;
			const ipk = parseFloat(formData.get('ipk') as string);
			if (!studentId || !aesKey) return fail(400, { error: 'ID Mahasiswa dan Kunci AES tidak boleh kosong.' });
			const courses: Course[] = [];
			for (let i = 0; i < 10; i++) {
				const code = formData.get(`course_${i}_code`) as string;
				const name = formData.get(`course_${i}_name`) as string;
				const credits = parseInt(formData.get(`course_${i}_credits`) as string, 10);
				const grade = formData.get(`course_${i}_grade`) as string;
				if (!code || !name || isNaN(credits) || !grade) return fail(400, { error: `Data tidak lengkap untuk mata kuliah #${i + 1}` });
				courses.push({ code, name, credits, grade });
			}
			const student = await db.user.findUnique({ where: { id: studentId } });
			if (!student || !student.publicKey || !student.programStudi) return fail(404, { error: 'Data mahasiswa tidak ditemukan.' });
			const headOfProgram = await db.user.findFirst({ where: { role: 'Kepala_Program_Studi', programStudi: student.programStudi } });
			if (!headOfProgram || !headOfProgram.privateKey || !headOfProgram.publicKey) return fail(404, { error: 'Data Kaprodi tidak lengkap.' });
			const allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' } });
			const allAdvisorIds = allAdvisors.map((a) => a.id);
			const academicRecord = { nim: student.nim!, name: student.fullName, courses, ipk };
			const { encryptedData } = CryptoService.encryptAcademicRecord(academicRecord, aesKey);
			const signature = SignatureService.signAcademicRecord(academicRecord, headOfProgram.privateKey, headOfProgram.id);
			const shamirResult = CryptoService.shareKeyAmongAdvisors(aesKey, allAdvisorIds, 3);
			const directAccessUsers = { [student.id]: student.publicKey, [advisor.id]: advisor.publicKey, [headOfProgram.id]: headOfProgram.publicKey };
			const directAccessKeys = CryptoService.createDirectAccessKeys(aesKey, Object.keys(directAccessUsers), directAccessUsers);
			await db.$transaction(async (prisma) => {
				const newRecord = await prisma.transkrip.create({
					data: { studentId: student.id, encryptedData, digitalSignature: signature.signature, keyId: shamirResult.keyId, createdBy: advisor.id }
				});
				await prisma.secretShare.createMany({
					data: shamirResult.shares.map((share) => ({ recordId: newRecord.id, advisorId: share.advisorId, shareX: share.shareX, shareY: share.shareY, prime: shamirResult.prime }))
				});
				await prisma.directKey.createMany({
					data: directAccessKeys.map((key) => ({ recordId: newRecord.id, userId: key.userId, encryptedAESKey: key.encryptedAESKey }))
				});
			});
			return { success: true, message: 'Data akademik berhasil disimpan.' };
		} catch (error: any) {
			return fail(500, { error: `An internal error occurred: ${error.message}` });
		}
	},
	groupDecrypt: async ({ request }) => {
		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			const sharesData = [
				{ advisorId: formData.get('advisorId1') as string, shareY: formData.get('shareY1') as string },
				{ advisorId: formData.get('advisorId2') as string, shareY: formData.get('shareY2') as string },
				{ advisorId: formData.get('advisorId3') as string, shareY: formData.get('shareY3') as string }
			];
			if (!recordId || sharesData.some((s) => !s.advisorId || !s.shareY)) return fail(400, { error: 'Harap pilih record dan isi 3 bagian kunci.' });
			const record = await db.transkrip.findUnique({ where: { id: recordId } });
			const dbShares = await db.secretShare.findMany({ where: { recordId: recordId } });
			if (!record || dbShares.length === 0) return fail(404, { error: 'Record atau secret shares tidak ditemukan.' });
			const participatingShares = sharesData.map((inputShare) => {
				const dbShare = dbShares.find((s) => s.advisorId === inputShare.advisorId);
				if (!dbShare) return null;
				return { shareX: dbShare.shareX, shareY: inputShare.shareY };
			}).filter(Boolean) as { shareX: number; shareY: string }[];
			if (participatingShares.length < 3) return fail(400, { error: 'Data Dosen Wali yang diinput tidak cocok atau kurang dari 3.' });
			const prime = dbShares[0].prime;
			const reconstructedKey = CryptoService.reconstructKeyFromShares(participatingShares, prime);
			const decryptedRecord: AcademicRecord = CryptoService.decryptAcademicRecord(record.encryptedData, reconstructedKey);
			const student = await db.user.findUnique({ where: { id: record.studentId } });
			const headOfProgram = await db.user.findFirst({ where: { role: 'Kepala_Program_Studi', programStudi: student?.programStudi } });
			if (!headOfProgram?.publicKey) return fail(500, { error: 'Kunci publik Kepala Program Studi tidak ditemukan.' });
			const verification = SignatureService.verifyAcademicRecord(decryptedRecord, { signature: record.digitalSignature, algorithm: 'RSA-SHA3', keyId: '', timestamp: new Date(), dataHash: '' }, headOfProgram.publicKey);
			return {
				groupDecryptSuccess: true,
				decryptedData: decryptedRecord,
				verificationStatus: verification.isValid ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
				verificationMessage: verification.message
			};
		} catch (error: any) {
			return fail(500, { error: `Proses dekripsi gagal: ${error.message}` });
		}
	},
	viewRecord: async ({ request, locals }) => {
		const kaprodi = await db.user.findUnique({ where: { id: locals.user?.user.id } });
		if (!kaprodi || kaprodi.role !== 'Kepala_Program_Studi' || !kaprodi.privateKey || !kaprodi.publicKey) return fail(403, { error: 'Akses ditolak.' });
		const formData = await request.formData();
		const recordId = formData.get('recordId') as string;
		if (!recordId) return fail(400, { error: 'ID Record tidak valid.' });
		try {
			const record = await db.transkrip.findUnique({ where: { id: recordId } });
			const directKey = await db.directKey.findUnique({ where: { recordId_userId: { recordId, userId: kaprodi.id } } });
			if (!record || !directKey) return fail(404, { error: 'Anda tidak memiliki kunci akses langsung.' });
			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, kaprodi.privateKey);
			const decryptedRecord: AcademicRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);
			const verification = SignatureService.verifyAcademicRecord(decryptedRecord, { signature: record.digitalSignature, algorithm: 'RSA-SHA3', keyId: '', timestamp: new Date(), dataHash: '' }, kaprodi.publicKey);
			return {
				viewSuccess: true,
				viewedRecord: { ...decryptedRecord, verificationStatus: verification.isValid ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED, verificationMessage: verification.message }
			};
		} catch (error: any) {
			return fail(500, { error: `Gagal melihat detail: ${error.message}` });
		}
	},
	signRecord: async ({ request, locals }) => {
		const kaprodi = await db.user.findUnique({ where: { id: locals.user?.user.id } });
		if (!kaprodi || kaprodi.role !== 'Kepala_Program_Studi' || !kaprodi.privateKey) return fail(403, { error: 'Akses ditolak.' });
		const formData = await request.formData();
		const recordId = formData.get('recordId') as string;
		if (!recordId) return fail(400, { error: 'ID Record tidak valid.' });
		try {
			const record = await db.transkrip.findUnique({ where: { id: recordId } });
			const directKey = await db.directKey.findUnique({ where: { recordId_userId: { recordId, userId: kaprodi.id } } });
			if (!record || !directKey) return fail(404, { error: 'Kunci akses langsung tidak ditemukan.' });
			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, kaprodi.privateKey);
			const decryptedRecord: AcademicRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);
			const newSignature = SignatureService.signAcademicRecord(decryptedRecord, kaprodi.privateKey, kaprodi.id);
			await db.transkrip.update({
				where: { id: recordId },
				data: { digitalSignature: newSignature.signature }
			});
			return { signSuccess: true, message: `Record untuk NIM ${decryptedRecord.nim} berhasil ditandatangani ulang.` };
		} catch (error: any) {
			return fail(500, { error: `Gagal menandatangani: ${error.message}` });
		}
	},
	generatePdf: async ({ request, locals }) => {
		const user = await db.user.findUnique({ where: { id: locals.user?.user.id } });
		if (!user || !user.privateKey) return fail(403, { error: 'Akses ditolak.' });
		const formData = await request.formData();
		const recordId = formData.get('recordId') as string;
		const shouldEncrypt = formData.get('encrypt') === 'on';
		const rc4Key = formData.get('rc4Key') as string;
		if (shouldEncrypt && !rc4Key) return fail(400, { error: 'Kunci RC4 diperlukan untuk enkripsi.' });
		if (!recordId) return fail(400, { error: 'Record harus dipilih.' });
		try {
			const record = await db.transkrip.findUnique({ where: { id: recordId }, include: { student: true } });
			if (!record) return fail(404, { error: 'Record tidak ditemukan.' });
			const directKey = await db.directKey.findFirst({ where: { recordId, userId: user.id } });
			if (!directKey) return fail(403, { error: 'Anda tidak punya akses untuk mencetak transkrip ini.' });
			const headOfProgram = await db.user.findFirst({ where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi } });
			if (!headOfProgram || !headOfProgram.fullName) return fail(404, { error: 'Data Kaprodi tidak ditemukan.' });
			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, user.privateKey);
			const decryptedRecord: AcademicRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);
			const signature: DigitalSignature = { signature: record.digitalSignature, algorithm: 'RSA-SHA3', keyId: headOfProgram.id, timestamp: new Date(), dataHash: '' };
			const generatedPdf = PDFService.generateTranscript(decryptedRecord, signature, {
				includeSignature: true,
				includeWatermark: true,
				headerText: `Program Studi ${headOfProgram.programStudi?.replace(/_/g, ' ')}\nSekolah Teknik Elektro dan Informatika\nInstitut Teknologi Bandung`,
				footerText: headOfProgram.fullName
			});
			let fileData = generatedPdf.fileData!;
			let fileName = generatedPdf.fileName;
			if (shouldEncrypt) {
				const encryptedResult = PDFService.encryptPDF(fileData, fileName, rc4Key);
				fileData = encryptedResult.encryptedData;
				fileName = encryptedResult.fileName;
			}
			return new Response(fileData, {
				headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"` }
			});
		} catch (error: any) {
			return fail(500, { error: `Gagal membuat PDF: ${error.message}` });
		}
	},
	viewMyTranscript: async ({ locals }) => {
		const student = await db.user.findUnique({ where: { id: locals.user?.user.id } });
		if (!student || student.role !== 'Mahasiswa' || !student.privateKey || !student.publicKey) return fail(403, { error: 'Akses ditolak.' });
		try {
			const record = await db.transkrip.findFirst({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' } });
			if (!record) return fail(404, { error: 'Transkrip Anda belum dibuat.' });
			const directKey = await db.directKey.findUnique({ where: { recordId_userId: { recordId: record.id, userId: student.id } } });
			if (!directKey) return fail(404, { error: 'Kunci akses langsung tidak ditemukan.' });
			const headOfProgram = await db.user.findFirst({ where: { role: 'Kepala_Program_Studi', programStudi: student.programStudi }});
			if (!headOfProgram?.publicKey) return fail(500, { error: 'Kunci publik Kaprodi tidak ditemukan.' });
			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, student.privateKey);
			const decryptedRecord: AcademicRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);
			const verification = SignatureService.verifyAcademicRecord(decryptedRecord, { signature: record.digitalSignature, algorithm: 'RSA-SHA3', keyId: '', timestamp: new Date(), dataHash: '' }, headOfProgram.publicKey);
			return {
				myTranscriptSuccess: true,
				myTranscript: { ...decryptedRecord, verificationStatus: verification.isValid ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED, verificationMessage: verification.message }
			};
		} catch (error: any) {
			return fail(500, { error: `Gagal mengambil transkrip: ${error.message}` });
		}
	}
};