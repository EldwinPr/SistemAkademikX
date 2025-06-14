import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { AcademicService } from '$lib/services/academic.service';
import { CryptoService } from '$lib/services/crypto.service';
import { PDFService } from '$lib/services/pdf.service';
import { SignatureService } from '$lib/services/signature.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';
import type { AcademicRecord, Course } from '$lib/types/academic.types';
import type { User } from '$lib/types/auth.types';
import { RSA, RSAUtils } from '$lib/cryptography/RSA';
import { SHA3 } from '$lib/cryptography/SHA3';
import type { Role } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth/login');

	const { user, permissions } = locals.user;
	const { role, programStudi, id: userId } = user;

	const dashboardData = {
		userContext: locals.user,
		myRecords: [] as any[],
		adviseeStudents: [] as User[],
		allRecords: [] as any[],
		allAdvisors: [] as User[],
		allStudents: [] as User[],
		programRecords: [] as any[],
		headKeys: null as any
	};

	try {
		if (role === 'Mahasiswa') {
			dashboardData.myRecords = await db.transkrip.findMany({
				where: { studentId: userId },
				orderBy: { createdAt: 'desc' }
			});
		} else if (role === 'Dosen_Wali') {
			dashboardData.adviseeStudents = await db.user.findMany({
				where: { DosenId: userId, role: 'Mahasiswa' }
			});

			dashboardData.allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' } });
			
			dashboardData.allRecords = await db.transkrip.findMany({
				orderBy: { createdAt: 'desc' },
				include: { student: { select: { fullName: true, nim: true } } }
			});
		} else if (role === 'Kepala_Program_Studi') {
 
			dashboardData.programRecords = await db.transkrip.findMany({
				where: { student: { programStudi } },
				orderBy: { createdAt: 'desc' },
				include: { student: { select: { fullName: true, nim: true } } }
			});

			dashboardData.allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' } });
			dashboardData.allStudents = await db.user.findMany({ where: { role: 'Mahasiswa', programStudi } });

			dashboardData.headKeys = {
				publicKey: user.publicKey
			};
		}

		return dashboardData;
	} catch (error) {
		console.error('Dashboard load error:', error);
		return {
			...dashboardData,
			error: 'Failed to load dashboard data.'
		};
	}
};

export const actions: Actions = {
	inputRecord: async ({ request, locals }) => {
		if (locals.user?.permissions.canCreateRecords !== true) {
			return fail(403, { error: 'Forbidden: You do not have permission to create records.' });
		}

		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;
			const aesKey = formData.get('aesKey') as string; // Key provided by the user. 

			// Validate input
			if (!studentId || !aesKey) {
				return fail(400, { error: 'Student ID and AES Key are required.' });
			}
			if (aesKey.length !== 64) {
				// AES-256 key should be 64 hex characters
				return fail(400, { error: 'Invalid AES key format. Must be a 256-bit hex string (64 characters).' });
			}
			
			const student = await db.user.findUnique({ where: { id: studentId } });
			if (!student) {
				return fail(404, { error: 'Student not found.' });
			}

			const head = await db.user.findFirst({
				where: { role: 'Kepala_Program_Studi', programStudi: student.programStudi }
			});
			if (!head || !head.publicKey || !head.privateKey) {
				return fail(500, { error: 'Program head or their keys are not configured.' });
			}

			const courses: Course[] = [];
			for (let i = 0; i < 10; i++) {
				courses.push({
					code: formData.get(`courses[${i}][code]`) as string,
					name: formData.get(`courses[${i}][name]`) as string,
					credits: parseInt(formData.get(`courses[${i}][credits]`) as string, 10),
					grade: formData.get(`courses[${i}][grade]`) as string
				});
			}

			const recordData = { nim: student.nim!, name: student.fullName, courses };

			const allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' } });
			const userIdsForDirectAccess = { studentId: student.id, advisorId: student.DosenId!, headId: head.id };
			
			const usersForKeys = await db.user.findMany({
				where: { id: { in: Object.values(userIdsForDirectAccess) } }
			});

			const publicKeys: Record<string, string> = {};
			usersForKeys.forEach(u => {
				if (u.publicKey) publicKeys[u.id] = u.publicKey;
			});

			publicKeys.headPrivateKey = head.privateKey;

			const { encryptedRecord, directKeys, secretShares } = AcademicService.createRecord(
				recordData,
				locals.user.user.id,
				aesKey,
				allAdvisors.map(a => a.id),
				userIdsForDirectAccess,
				publicKeys
			);
			
			await db.$transaction([
				db.transkrip.create({ data: encryptedRecord }),
				db.directKey.createMany({ data: directKeys }),
				db.secretShare.createMany({ data: secretShares })
			]);

			return { success: true, message: `Academic record for ${student.fullName} created successfully.` };

		} catch (error: any) {
			console.error("Error creating record:", error);
			return fail(500, { error: error.message || 'An internal error occurred.' });
		}
	},

	viewRecord: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/auth/login');
		
		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;

			const userId = locals.user.user.id;
			const fullUser = await db.user.findUnique({ where: { id: userId } });

			if (!fullUser?.privateKey) {
				return fail(500, { error: 'Private key for the current user not found.' });
			}

			const userPrivateKey = fullUser.privateKey;

			if (!recordId || !userPrivateKey) {
				return fail(400, { error: 'Record ID and user credentials are required.' });
			}
			
			const directKey = await db.directKey.findUnique({
				where: { recordId_userId: { recordId, userId } }
			});

			if (!directKey) {
				const record = await db.transkrip.findUnique({ where: { id: recordId } });
				const student = await db.user.findUnique({ where: { id: record?.studentId } });
				
				if (locals.user.user.role === 'Dosen_Wali' && student?.DosenId !== userId) {
					return fail(403, { message: 'Group decryption required to view this record.', groupRequired: true });
				}
				return fail(403, { error: 'Access Denied: You do not have direct access to this record.' });
			}

			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, userPrivateKey);
			
			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: { student: { select: { programStudi: true } } }
			});
			if (!record) return fail(404, { error: 'Record not found.' });

			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			const head = await db.user.findFirst({
				where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi! }
			});
			if (!head?.publicKey) return fail(500, { error: 'Could not find public key to verify signature.' });
			
			const signature = {
				signature: record.digitalSignature,
				algorithm: 'RSA-SHA3' as const,
				keyId: record.keyId,
				timestamp: record.createdAt,
				dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
			};

			const verification = SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);
			
			return { success: true, record: decryptedRecord, verification };

		} catch (error: any) {
			console.error("Error viewing record:", error);
			return fail(500, { error: error.message || 'Failed to view record.' });
		}
	},
	
	groupDecrypt: async ({ request, locals }) => {
		if (locals.user?.permissions.canParticipateInGroupDecryption !== true) {
			return fail(403, { error: 'Forbidden.' });
		}
	
		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			const sharesData = JSON.parse(formData.get('shares') as string);
	
			if (!recordId || !sharesData || sharesData.length < 3) {
				return fail(400, { error: 'Record ID and at least 3 shares are required.' });
			}
	
			const dbShares = await db.secretShare.findMany({
				where: { 
					recordId,
					advisorId: { in: sharesData.map((s: any) => s.advisorId) }
				}
			});
	
			if (dbShares.length < 3) {
				return fail(400, { error: 'Could not find enough matching shares in the database.' });
			}
	
			const sharesForReconstruction = dbShares.map(dbShare => ({
				shareX: dbShare.shareX,
				shareY: dbShare.shareY, 
			}));
			const prime = dbShares[0].prime;
	
			const aesKey = CryptoService.reconstructKeyFromShares(sharesForReconstruction, prime);
	
			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: { student: { select: { programStudi: true } } }
			});
			if (!record) return fail(404, { error: 'Record not found.' });
	
			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);
	
			const head = await db.user.findFirst({
				where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi! }
			});
			if (!head?.publicKey) return fail(500, { error: 'Could not find public key.' });
	
			const signature = {
				signature: record.digitalSignature,
				algorithm: 'RSA-SHA3' as const,
				keyId: record.keyId,
				timestamp: record.createdAt,
				dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
			};
			const verification = SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);
	
			return { success: true, record: decryptedRecord, verification, groupDecrypted: true };
	
		} catch (error: any) {
			console.error("Group decrypt error:", error);
			return fail(500, { error: error.message || 'Group decryption failed.' });
		}
	},
	
	generatePdf: async ({ request }) => {
		try {
			const formData = await request.formData();
			const recordData = JSON.parse(formData.get('recordData') as string) as AcademicRecord;
			const signatureData = JSON.parse(formData.get('signatureData') as string);
			const shouldEncrypt = formData.get('encrypt') === 'true';
			const rc4Key = formData.get('rc4Key') as string | undefined;

			if (shouldEncrypt && !rc4Key) {
				return fail(400, { error: 'RC4 key is required for encryption.' });
			}

	
			let { fileData, fileName } = PDFService.generateTranscript(recordData, signatureData);

			if (shouldEncrypt && rc4Key) {
				const encryptedResult = PDFService.encryptPDF(fileData!, fileName, rc4Key);
				fileData = encryptedResult.encryptedData;
				fileName = encryptedResult.fileName;
			}
			
			return new Response(fileData, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="${fileName}"`,
				},
			});

		} catch (error: any) {
			console.error("Error generating PDF:", error);
			return fail(500, { error: error.message || 'Failed to generate PDF.' });
		}
	},

	decryptPdf: async ({ request }) => {
		try {
			const formData = await request.formData();
			const encryptedFile = formData.get('encryptedPdf') as File;
			const rc4Key = formData.get('rc4Key') as string;

			if (!encryptedFile || !rc4Key) {
				return fail(400, { error: 'Encrypted file and RC4 key are required.' });
			}
			
			const encryptedBytes = new Uint8Array(await encryptedFile.arrayBuffer());

			const result = PDFService.decryptPDF(encryptedBytes, rc4Key, encryptedFile.name);

			if (!result.success || !result.decryptedData) {
				return fail(500, { error: result.message });
			}
			
			return new Response(result.decryptedData, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="${result.fileName}"`,
				},
			});

		} catch (error: any) {
			console.error("Error decrypting PDF:", error);
			return fail(500, { error: error.message || 'Failed to decrypt PDF.' });
		}
	},
	
	signRecord: async ({ request, locals }) => {
		if (locals.user?.permissions.canSignRecords !== true) {
			return fail(403, { error: 'Forbidden: You do not have permission to sign records.' });
		}

		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			const userId = locals.user.user.id;

			const headUser = await db.user.findUnique({ where: { id: userId } });
			if (!headUser?.privateKey) {
				return fail(500, { error: 'Could not retrieve your private key for signing.' });
			}

			const directKey = await db.directKey.findUnique({
				where: { recordId_userId: { recordId, userId } }
			});

			if (!directKey) {
				return fail(403, { error: 'You do not have direct access to decrypt this record for re-signing.' });
			}

			const record = await db.transkrip.findUnique({ where: { id: recordId } });
			if (!record) {
				return fail(404, { error: 'Academic record not found.' });
			}

			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, headUser.privateKey);
			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			const newSignature = SignatureService.signAcademicRecord(
				decryptedRecord,
				headUser.privateKey,
				record.keyId // Use existing keyId
			);

			await db.transkrip.update({
				where: { id: recordId },
				data: {
					digitalSignature: newSignature.signature
				}
			});

			return { success: true, message: 'Record has been successfully re-signed.' };

		} catch (error: any) {
			console.error("Error re-signing record:", error);
			return fail(500, { error: error.message || 'An internal error occurred during re-signing.' });
		}
	},

	assignAdvisor: async ({ request, locals }) => {
		if (locals.user?.user.role !== 'Kepala_Program_Studi') {
			return fail(403, { error: 'Forbidden: Only the Head of Study Program can assign advisors.' });
		}

		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;
			const advisorId = formData.get('advisorId') as string;
			const headProgramStudi = locals.user.user.programStudi;

			if (!studentId || !advisorId) {
				return fail(400, { error: 'Student ID and Advisor ID are required.' });
			}

			const student = await db.user.findUnique({ where: { id: studentId } });
			if (!student || student.programStudi !== headProgramStudi) {
				return fail(404, { error: `Student not found or not in your study program.` });
			}

			await db.user.update({
				where: { id: studentId },
				data: {
					DosenId: advisorId
				}
			});

			return { success: true, message: `Advisor successfully assigned to student ${student.fullName}.` };

		} catch (error: any) {
			console.error("Error assigning advisor:", error);
			return fail(500, { error: error.message || 'An internal error occurred.' });
		}
	},

	registerUser: async ({ request, locals }) => {
		if (locals.user?.user.role !== 'Kepala_Program_Studi') {
			return fail(403, { error: 'Forbidden: Only the Head of Study Program can register new users.' });
		}

		try {
			const formData = await request.formData();
			const username = formData.get('username') as string;
			const password = formData.get('password') as string;
			const fullName = formData.get('fullName') as string;
			const role = formData.get('role') as Role;
			const nim = formData.get('nim') as string | undefined;

			if (!username || !password || !fullName || !role) {
				return fail(400, { error: 'Username, password, full name, and role are required.' });
			}

			if (role === 'Mahasiswa' && !nim) {
				return fail(400, { error: 'NIM is required for new students.' });
			}

			const passwordHash = Array.from(SHA3.sha256(password))
				.map(b => b.toString(16).padStart(2, '0'))
				.join('');

			const keyPair = RSA.generateKeyPair(2048);

			await db.user.create({
				data: {
					username,
					password: passwordHash,
					fullName,
					role,
					nim: role === 'Mahasiswa' ? nim : null,
					programStudi: role === 'Mahasiswa' ? locals.user.user.programStudi : null, // Students get the head's program
					publicKey: RSAUtils.publicKeyToHex(keyPair.publicKey),
					privateKey: RSAUtils.privateKeyToHex(keyPair.privateKey)
				}
			});

			return { success: true, message: `User ${fullName} registered successfully.` };

		} catch (error: any) {
			console.error("Error registering user:", error);

			if (error.code === 'P2002') {
				return fail(409, { error: 'Username already exists.' });
			}
			return fail(500, { error: error.message || 'An internal error occurred during user registration.' });
		}
	}
};