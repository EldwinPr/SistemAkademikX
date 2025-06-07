// src/routes/api/auth/login/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SHA3 } from '$lib/cryptography/SHA3';
import { AuthService } from '$lib/services/auth.service';
import db from '$lib/server/database';
import type { LoginRequest, LoginResponse } from '$lib/types/auth.types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Parse request body
		const body: LoginRequest = await request.json();
		const { username, password } = body;

		// Validate input
		if (!username || !password) {
			return json({
				success: false,
				message: 'Username and password are required'
			} as LoginResponse, { status: 400 });
		}

		// Find user by username
		const user = await db.user.findUnique({
			where: { username },
			select: {
				id: true,
				username: true,
				password: true,
				role: true,
				fullName: true,
				nim: true,
				DosenId: true,
				programStudi: true,
				publicKey: true,
				createdAt: true
			}
		});

		if (!user) {
			return json({
				success: false,
				message: 'Invalid username or password'
			} as LoginResponse, { status: 401 });
		}

		// Hash provided password using SHA-3
		const passwordHash = SHA3.sha256(password);
		const providedPasswordHex = Array.from(passwordHash)
			.map(b => b.toString(16).padStart(2, '0'))
			.join('');

		// Verify password
		if (providedPasswordHex !== user.password) {
			return json({
				success: false,
				message: 'Invalid username or password'
			} as LoginResponse, { status: 401 });
		}

		// Generate session token
		const sessionToken = AuthService.generateSessionToken();
		const expiresAt = AuthService.getSessionExpiry(24 * 7);

		// Create session in database
		await db.session.create({
			data: {
				userId: user.id,
				token: sessionToken,
				expiresAt
			}
		});

		// Set secure HTTP-only cookie
		cookies.set('session', sessionToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7,
			path: '/'
		});

		// Remove password from response
		const { password: _, ...safeUser } = user;

		return json({
			success: true,
			user: safeUser,
			message: 'Login successful'
		} as LoginResponse);

	} catch (error) {
		console.error('Login error:', error);
		return json({
			success: false,
			message: 'Internal server error'
		} as LoginResponse, { status: 500 });
	}
};