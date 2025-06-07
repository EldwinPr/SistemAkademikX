import type { Handle } from '@sveltejs/kit';
import db from '$lib/server/database';
import { AuthService } from '$lib/services/auth.service';
import type { User, UserContext } from '$lib/types/auth.types';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
	'/dashboard',
	'/academic',
	'/records',
	'/api/academic',
	'/api/records'
];

// Public routes that don't need authentication
const PUBLIC_ROUTES = [
	'/auth/login',
	'/auth/register',
	'/api/auth/login',
	'/api/auth/register',
	'/' // Landing page
];

/**
 * Main authentication hook
 */
export const handle: Handle = async ({ event, resolve }) => {
	const { url, cookies } = event;
	
	// Skip authentication for public routes
	if (isPublicRoute(url.pathname)) {
		return resolve(event);
	}

	// Get session token from cookie
	const sessionToken = cookies.get('session');
	
	if (!sessionToken) {
		return redirectToLogin(url);
	}

	try {
		// Validate session directly with database
		const user = await validateSessionDirectly(sessionToken);
		
		if (!user) {
			// Invalid session, clear cookie and redirect
			cookies.delete('session', { path: '/' });
			return redirectToLogin(url);
		}

		// Create user context using AuthService
		const userContext = AuthService.createUserContext(user);
		
		// Attach user context to locals for use in routes
		event.locals.user = userContext;
		
		// Check route-specific permissions
		const hasAccess = checkRoutePermissions(url.pathname, userContext);
		
		if (!hasAccess) {
			return new Response('Forbidden', { status: 403 });
		}

		// Continue with the request
		return resolve(event);
		
	} catch (error) {
		console.error('Authentication error:', error);
		cookies.delete('session', { path: '/' });
		return redirectToLogin(url);
	}
};

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTES.some(route => {
		if (route === '/') return pathname === '/';
		return pathname.startsWith(route);
	});
}

/**
 * Redirect to login page
 */
function redirectToLogin(url: URL): Response {
	const redirectUrl = `/auth/login?redirect=${encodeURIComponent(url.pathname)}`;
	return new Response(null, {
		status: 302,
		headers: { Location: redirectUrl }
	});
}

/**
 * Validate session token directly with database
 */
async function validateSessionDirectly(sessionToken: string): Promise<User | null> {
	try {
		const session = await db.session.findUnique({
			where: { token: sessionToken }
		});

		if (!session || session.expiresAt < new Date()) {
			// Clean up expired session
			if (session) {
				await db.session.delete({
					where: { id: session.id }
				});
			}
			return null;
		}

		// Separate query for user
		const user = await db.user.findUnique({
			where: { id: session.userId },
			select: {
				id: true,
				username: true,
				role: true,
				fullName: true,
				nim: true,
				DosenId: true,
				programStudi: true,
				publicKey: true,
				createdAt: true
			}
		});

		return user as User;
	} catch (error) {
		console.error('Session validation error:', error);
		return null;
	}
}

/**
 * Check route-specific permissions using AuthService
 */
function checkRoutePermissions(pathname: string, userContext: UserContext): boolean {
	const { permissions } = userContext;

	// Dashboard access
	if (pathname.startsWith('/dashboard')) {
		return true; // All authenticated users can access dashboard
	}

	// Academic records routes
	if (pathname.startsWith('/academic') || pathname.startsWith('/records')) {
		return permissions.canViewOwnTranscript || 
			   permissions.canViewAdviseeTranscripts || 
			   permissions.canViewAllTranscripts;
	}

	// API routes for academic operations
	if (pathname.startsWith('/api/academic')) {
		// Check specific API permissions
		if (pathname.includes('/create')) {
			return permissions.canCreateRecords;
		}
		if (pathname.includes('/sign')) {
			return permissions.canSignRecords;
		}
		return permissions.canViewOwnTranscript || 
			   permissions.canViewAdviseeTranscripts || 
			   permissions.canViewAllTranscripts;
	}

	// Admin routes (for heads)
	if (pathname.startsWith('/admin')) {
		return permissions.canManageKeys;
	}

	// Default: allow access
	return true;
}

// Type declaration for event.locals
declare global {
	namespace App {
		interface Locals {
			user?: UserContext;
		}
	}
}