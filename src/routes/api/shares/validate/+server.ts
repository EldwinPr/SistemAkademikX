// src/routes/api/shares/validate/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';


interface ValidateSharesRequest {
    recordId: string;
    shares: {
        advisorId: string;
        shareX: number;
        shareY: string;
    }[];
}
//Menangani permintaan POST untuk memvalidasi satu set secret shares sebelum melakukan rekonstruksi kunci.
export const POST: RequestHandler = async ({ locals, request }) => {
    const user = locals.user?.user;
    if (!user) {
        throw error(401, 'Unauthorized: Anda harus login.');
    }
    if (user.role !== 'Dosen_Wali') {
        throw error(403, 'Forbidden: Hanya Dosen Wali yang dapat melakukan validasi share.');
    }

    try {
        const body: ValidateSharesRequest = await request.json();
        const { recordId, shares } = body;

        if (!recordId || !shares || !Array.isArray(shares) || shares.length < 3) {
            throw error(400, 'Bad Request: Diperlukan recordId dan minimal 3 shares untuk validasi.');
        }

        const dbShares = await db.secretShare.findMany({
            where: {
                recordId: recordId,
                advisorId: { in: shares.map(s => s.advisorId) }
            }
        });

        const dbSharesMap = new Map(dbShares.map(s => [s.advisorId, s]));

        for (const submittedShare of shares) {
            const dbShare = dbSharesMap.get(submittedShare.advisorId);
 
            if (!dbShare || dbShare.shareX !== submittedShare.shareX || dbShare.shareY !== submittedShare.shareY) {
                return json({
                    success: false,
                    message: `Share yang dikirim untuk Dosen Wali ID ${submittedShare.advisorId} tidak valid.`
                }, { status: 400 });
            }
        }

        return json({
            success: true,
            message: 'Semua shares yang dikirim valid.'
        });

    } catch (err: any) {
        console.error(`Error validating shares: ${err.message}`);
        if (err.status) throw err;
        throw error(500, 'Internal Server Error: Gagal memvalidasi data shares.');
    }
};