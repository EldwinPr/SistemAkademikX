//src/routes/api/records/[recordId]/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { CryptoService } from '$lib/services/crypto.service';
import { SignatureService } from '$lib/services/signature.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';

//Menangani permintaan GET untuk mengambil, mendekripsi, dan memverifikasi satu record transkrip akademik.
export const GET: RequestHandler = async ({ locals, params }) => {
	const user = locals.user?.user;
	if (!user) {
		throw error(401, 'Unauthorized: Anda harus login untuk mengakses data.');
	}

	const { recordId } = params;
	if (!recordId) {
		throw error(400, 'Bad Request: Record ID diperlukan.');
	}

	try {
		// Ambil private key pengguna yang sedang login untuk dekripsi
		const fullUser = await db.user.findUnique({ where: { id: user.id } });
		if (!fullUser?.privateKey) {
			throw error(500, 'Server Error: Private key pengguna tidak ditemukan.');
		}

		const directKey = await db.directKey.findUnique({
			where: {
				recordId_userId: { recordId, userId: user.id }
			}
		});

		if (!directKey) {
			if (user.role === 'Dosen_Wali') {
				throw error(403, 'Forbidden: Akses langsung ditolak. Gunakan mekanisme dekripsi grup untuk record ini.');
			}
			throw error(403, 'Forbidden: Anda tidak memiliki izin untuk mengakses record ini.');
		}

		//Dekripsi Kunci AES
		const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, fullUser.privateKey);

		const record = await db.transkrip.findUnique({
			where: { id: recordId },
			include: { student: { select: { programStudi: true } } }
		});
		if (!record) {
			throw error(404, 'Not Found: Record transkrip tidak ditemukan.');
		}

		const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

		const head = await db.user.findFirst({
			where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi! }
		});
		if (!head?.publicKey) {
			throw error(500, 'Server Error: Kunci publik Kepala Program Studi tidak ditemukan untuk verifikasi.');
		}

		const signature = {
			signature: record.digitalSignature,
			algorithm: 'RSA-SHA3' as const,
			keyId: record.keyId,
			timestamp: record.createdAt,
			dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
		};
		const verification = SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);

		return json({
			success: true,
			record: decryptedRecord,
			verification: verification
		});

	} catch (err: any) {
		console.error(`Error fetching record ${recordId}:`, err);
		if (err.status) throw err; // Teruskan error HTTP dari SvelteKit
		throw error(500, 'Internal Server Error: Gagal memproses permintaan Anda.');
	}
};