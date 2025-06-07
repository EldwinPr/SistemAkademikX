import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// Check if session cookie exists
	const sessionToken = cookies.get('session');
	
	if (sessionToken) {
		// Has session, redirect to dashboard
		throw redirect(302, '/dashboard');
	} else {
		// No session, redirect to login
		throw redirect(302, '/auth/login');
	}
};