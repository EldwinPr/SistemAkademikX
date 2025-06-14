// src/routes/api/users/me/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';


//Menangani permintaan GET untuk mendapatkan data pengguna yang sedang login.

export const GET: RequestHandler = async ({ locals }) => {
    const userContext = locals.user;

    if (userContext) {
        return json({
            success: true,
            user: userContext.user,
            permissions: userContext.permissions
        });
    }

    throw error(401, 'Unauthorized: Tidak ada sesi pengguna yang valid.');
};