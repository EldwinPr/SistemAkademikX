// src/routes/dashboard/+page.server.ts
import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadDashboardData, type DashboardData } from './loaders/dashboard.loader';
import { studentActions } from './actions/student.actions';
import { advisorActions } from './actions/advisor.actions';
import { headActions } from './actions/head.actions';

/**
 * Dashboard page server-side data loader
 * Validates authentication and loads role-specific data
 */
export const load: PageServerLoad = async ({ locals }): Promise<DashboardData> => {
	// Authentication check - redirect if not logged in
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	try {
		// Load dashboard data based on user role and permissions
		const dashboardData = await loadDashboardData(locals.user);
		return dashboardData;
	} catch (error) {
		// Log error for debugging but don't expose sensitive details to client
		console.error('Dashboard load failed:', error);
		
		// Return minimal data structure with error indicator
		return {
			userContext: locals.user,
			myRecords: [],
			myTranscriptsWithDetails: [],
			adviseeStudents: [],
			allRecords: [],
			allAdvisors: [],
			allStudents: [],
			programRecords: [],
			headKeys: null,
			allStudentsWithTranscripts: [],
			error: 'Failed to load dashboard data. Please refresh the page or contact support.'
		};
	}
};

/**
 * Server actions grouped by user role for better organization
 * Each action validates permissions before execution
 */
export const actions: Actions = {
	// ==================== Mahasiswa ACTIONS ====================

	viewMyTranscript: studentActions.viewMyTranscript,

	// ==================== Doswal ACTIONS ====================

	inputRecord: advisorActions.inputRecord,
	viewRecord: advisorActions.viewRecord,
	groupDecrypt: advisorActions.groupDecrypt,

	// ==================== Kaprodi ACTIONS ====================
	signRecord: headActions.signRecord,
	removeSignature: headActions.removeSignature,
	deleteTranscript: headActions.deleteTranscript,
	assignAdvisor: headActions.assignAdvisor,
	registerUser: headActions.registerUser,
	deleteUser: headActions.deleteUser
};