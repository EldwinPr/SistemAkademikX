// src/routes/api/shares/[recordId]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

//Menangani permintaan GET untuk mengambil secret share milik Dosen Wali untuk sebuah record spesifik.
export const GET: RequestHandler = async ({ locals, params }) => {
    const user = locals.user?.user;
    if (!user) {
        throw error(401, 'Unauthorized: Anda harus login untuk mengakses sumber daya ini.');
    }
    if (user.role !== 'Dosen_Wali') {
        throw error(403, 'Forbidden: Hanya Dosen Wali yang dapat mengambil secret share.');
    }

    const { recordId } = params;
    if (!recordId) {
        throw error(400, 'Bad Request: Record ID tidak ditemukan.');
    }

    try {
        const secretShare = await db.secretShare.findUnique({
            where: {
                // Menggunakan composite key yang ada di skema prisma
                recordId_advisorId: {
                    recordId: recordId,
                    advisorId: user.id
                }
            },
            select: {
                shareX: true,
                shareY: true,
                prime: true
            }
        });

        if (!secretShare) {
            throw error(404, 'Not Found: Secret share untuk record ini tidak ditemukan untuk Anda.');
        }

        return json({
            success: true,
            share: secretShare
        });

    } catch (err: any) { {
        console.error(`Error fetching secret share: ${err.message}`);
        if (err.status) throw err;
        throw error(500, 'Internal Server Error: Gagal mengambil data secret share.');
    }};
}