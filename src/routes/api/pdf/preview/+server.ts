// Lokasi file: src/routes/api/pdf/preview/+server.ts

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { CryptoService } from '$lib/services/crypto.service';
import { SignatureService } from '$lib/services/signature.service';
import { PDFService } from '$lib/services/pdf.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';

interface PreviewRequest {
    recordId: string;
}
//Menangani permintaan POST untuk men-generate dan menampilkan preview PDF dari sebuah transkrip akademik.
export const POST: RequestHandler = async ({ locals, request }) => {
    // 1. Otentikasi & Otorisasi awal
    const user = locals.user?.user;
    if (!user) {
        throw error(401, 'Unauthorized: Anda harus login.');
    }

    try {
        const body: PreviewRequest = await request.json();
        const { recordId } = body;

        if (!recordId) {
            throw error(400, 'Bad Request: Record ID diperlukan.');
        }

        const fullUser = await db.user.findUnique({ where: { id: user.id } });
        if (!fullUser?.privateKey) throw error(500, 'Kunci privat pengguna tidak ditemukan.');

        const directKey = await db.directKey.findUnique({ where: { recordId_userId: { recordId, userId: user.id } } });
        if (!directKey) throw error(403, 'Forbidden: Anda tidak punya akses ke record ini.');

        // 3. Dekripsi record
        const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, fullUser.privateKey);
        const record = await db.transkrip.findUnique({
			where: { id: recordId },
			include: { student: { select: { programStudi: true } } }
		});
        if (!record) throw error(404, 'Record tidak ditemukan.');
        const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

        const head = await db.user.findFirst({ where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi! } });
		if (!head?.publicKey) throw error(500, 'Kunci publik Kaprodi tidak ditemukan.');
        
        const signature = {
			signature: record.digitalSignature,
			algorithm: 'RSA-SHA3' as const,
			keyId: record.keyId,
			timestamp: record.createdAt,
			dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
		};
		const verification = SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);

        const signatureData = {
            signature: record.digitalSignature,
            signedBy: head.fullName,
            status: verification.isValid ? 'TERVERIFIKASI' : 'TIDAK VALID'
        };
        const { fileData, fileName } = PDFService.generateTranscript(decryptedRecord, signatureData);

        if (!fileData) {
            throw error(500, 'Gagal menghasilkan konten PDF.');
        }

        return new Response(fileData, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                // 'inline' memberi tahu browser untuk mencoba menampilkan file, bukan mengunduhnya
                'Content-Disposition': `inline; filename="${fileName}"`
            }
        });

    } catch (err: any) {
        console.error('Error generating PDF preview:', err);
        if (err.status) throw err;
        throw error(500, 'Internal Server Error.');
    }
};