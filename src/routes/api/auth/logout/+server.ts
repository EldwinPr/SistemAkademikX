// Lokasi file: src/routes/api/auth/logout/+server.ts

import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import db from '$lib/server/database';

/**
 * Menangani permintaan GET untuk logout pengguna.
 */
export function GET({ cookies }: RequestEvent) {
	const sessionToken = cookies.get('session');

	// Jika ada token sesi, hapus dari database dan cookie
	if (sessionToken) {
		// Hapus sesi dari database
		// Kita gunakan .catch() agar proses tidak berhenti jika token di cookie sudah tidak ada di DB
		db.session
			.delete({
				where: { token: sessionToken }
			})
			.catch((error) => {
				console.warn(`Gagal menghapus sesi dari DB (kemungkinan sesi sudah tidak valid): ${error}`);
			});

		// Hapus cookie 'session' dari browser pengguna
		cookies.delete('session', {
			path: '/'
		});
	}

	// Arahkan (redirect) pengguna kembali ke halaman login
	throw redirect(302, '/auth/login');
}