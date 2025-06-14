// src/routes/api/users/advisors/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

// Menangani permintaan GET untuk mendapatkan daftar semua Dosen Wali.
export const GET: RequestHandler = async ({ locals }) => {
    const user = locals.user?.user;
    if (!user) {
        throw error(401, 'Unauthorized: Anda harus login untuk mengakses daftar ini.');
    }

    if (user.role !== 'Kepala_Program_Studi' && user.role !== 'Dosen_Wali') {
        throw error(403, 'Forbidden: Anda tidak memiliki izin untuk melihat daftar dosen wali.');
    }

    try {
        const advisors = await db.user.findMany({
            where: {
                role: 'Dosen_Wali'
            },
            select: {
                id: true,
                fullName: true,
                username: true
            },
            orderBy: {
                fullName: 'asc'
            }
        });

        return json({
            success: true,
            advisors: advisors
        });

    } catch (err: any) {
        console.error('Error fetching advisors:', err);
        throw error(500, 'Internal Server Error: Gagal mengambil data dosen wali.');
    }
};