// src/routes/api/records/verify/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { SignatureService } from '$lib/services/signature.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';
import type { AcademicRecord } from '$lib/types/academic.types';

interface VerifyRequest {
    recordId: string;
    recordData: AcademicRecord; 
}
//Menangani permintaan POST untuk memverifikasi ulang tanda tangan digital dari sebuah data transkrip yang sudah didekripsi.
export const POST: RequestHandler = async ({ locals, request }) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized: Anda harus login.');
    }

    try {
        const body: VerifyRequest = await request.json();
        const { recordId, recordData } = body;

        if (!recordId || !recordData) {
            throw error(400, 'Bad Request: Diperlukan recordId dan recordData.');
        }

        const originalRecord = await db.transkrip.findUnique({
            where: { id: recordId },
            include: { student: { select: { programStudi: true } } }
        });

        if (!originalRecord) {
            throw error(404, 'Not Found: Record asli tidak ditemukan di database.');
        }

        const head = await db.user.findFirst({
			where: { role: 'Kepala_Program_Studi', programStudi: originalRecord.student.programStudi! }
		});
		if (!head?.publicKey) {
			throw error(500, 'Server Error: Kunci publik Kepala Program Studi tidak ditemukan.');
		}

        const signature = {
			signature: originalRecord.digitalSignature,
			algorithm: 'RSA-SHA3' as const,
			keyId: originalRecord.keyId,
			timestamp: originalRecord.createdAt,
            // Hash dihitung dari data yang dikirim oleh klien
			dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(recordData)) 
		};
		const verification = SignatureService.verifyAcademicRecord(recordData, signature, head.publicKey);

        return json({
            success: true,
            verification: verification
        });

    } catch (err: any) {
        console.error('Error verifying record:', err);
        if (err.status) throw err;
        throw error(500, 'Internal Server Error: Gagal memverifikasi record.');
    }
};