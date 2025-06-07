// src/hooks.server.ts
import type { Handle, HandleServerError } from '@sveltejs/kit';
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
		// Validate session and get user
		const user = await validateSession(sessionToken);
		
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
		const hasAccess = await checkRoutePermissions(url.pathname, userContext);
		
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
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
	return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
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
 * Validate session token and return user
 */
async function validateSession(sessionToken: string): Promise<User | null> {
	try {
		// This would be implemented in your database layer
		// For now, it's a placeholder that you'll implement in API routes
		const response = await fetch('/api/auth/validate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: sessionToken })
		});
		
		if (response.ok) {
			const data = await response.json();
			return data.user;
		}
		
		return null;
	} catch {
		return null;
	}
}

/**
 * Check route-specific permissions using AuthService
 */
async function checkRoutePermissions(pathname: string, userContext: UserContext): Promise<boolean> {
	const { user, permissions } = userContext;

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

/**
 * Optional: Handle errors
 */
export const handleError: HandleServerError = ({ error, event }) => {
	console.error('SvelteKit error:', error);
	
	const e = new Error('Something went wrong');
	(e as any).code = 'INTERNAL_ERROR';
	return e;
};

// Type declaration for event.locals
declare global {
	namespace App {
		interface Locals {
			user?: UserContext;
		}
	}
}