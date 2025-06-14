// src/routes/api/pdf/decrypt/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PDFService } from '$lib/services/pdf.service';

//Menangani permintaan POST untuk mendekripsi file PDF yang dienkripsi dengan RC4.
export const POST: RequestHandler = async ({ locals, request }) => {
    if (!locals.user) {
        throw error(401, 'Unauthorized: Anda harus login untuk melakukan aksi ini.');
    }

    try {
        const formData = await request.formData();
        const encryptedFile = formData.get('encryptedPdf') as File | null;
        const rc4Key = formData.get('rc4Key') as string | null;

        if (!encryptedFile || !rc4Key) {
            throw error(400, 'Bad Request: File terenkripsi dan kunci RC4 diperlukan.');
        }
        if (encryptedFile.size === 0 || rc4Key.trim() === '') {
            throw error(400, 'Bad Request: File dan kunci tidak boleh kosong.');
        }

        const encryptedBytes = new Uint8Array(await encryptedFile.arrayBuffer());
        const result = PDFService.decryptPDF(encryptedBytes, rc4Key, encryptedFile.name);

        if (!result.success || !result.decryptedData) {
            throw error(400, result.message || 'Dekripsi gagal. Kunci mungkin salah atau file rusak.');
        }

        return new Response(result.decryptedData, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                // Header ini akan membuat browser mengunduh file
                'Content-Disposition': `attachment; filename="${result.fileName}"`,
            },
        });

    } catch (err: any) {
        console.error('Error decrypting PDF:', err);
        if (err.status) throw err;
        throw error(500, 'Internal Server Error: Gagal mendekripsi PDF.');
    }
};