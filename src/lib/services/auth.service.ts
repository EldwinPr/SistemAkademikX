import type {
	User,
	AccessPermission,
	UserContext
} from '../types/auth.types';

export class AuthService {
	/**
	 * Get user permissions based on role (RBAC)
	 */
	static getUserPermissions(user: User): AccessPermission {
		const base: AccessPermission = {
			userId: user.id,
			role: user.role,
			canViewOwnTranscript: false,
			canViewAdviseeTranscripts: false,
			canViewAllTranscripts: false,
			canParticipateInGroupDecryption: false,
			canInitiateGroupDecryption: false,
			canCreateRecords: false,
			canSignRecords: false,
			canManageKeys: false
		};

		switch (user.role) {
			case 'Mahasiswa':
				return { ...base, canViewOwnTranscript: true };

			case 'Dosen_Wali':
				return {
					...base,
					canViewAdviseeTranscripts: true,
					canParticipateInGroupDecryption: true,
					canInitiateGroupDecryption: true,
					canCreateRecords: true
				};

			case 'Kepala_Program_Studi':
				return {
					...base,
					canViewAllTranscripts: true,
					canSignRecords: true,
					canManageKeys: true
				};

			default:
				return base;
		}
	}

	/**
	 * Create user context for authenticated user
	 */
	static createUserContext(user: User): UserContext {
		return {
			user,
			permissions: this.getUserPermissions(user),
			isAuthenticated: true
		};
	}

	/**
	 * Check if user can access specific record
	 */
	static canAccessRecord(user: User, recordStudentId: string, hasDirectKey: boolean): 'DIRECT' | 'GROUP_REQUIRED' | 'DENIED' {
		// Student can access own record
		if (user.role === 'Mahasiswa' && user.id === recordStudentId) {
			return 'DIRECT';
		}

		// If user has direct key
		if (hasDirectKey) {
			return 'DIRECT';
		}

		// Head can access all records from their program
		if (user.role === 'Kepala_Program_Studi') {
			return 'DIRECT';
		}

		// Advisor can request group access
		if (user.role === 'Dosen_Wali') {
			return 'GROUP_REQUIRED';
		}

		return 'DENIED';
	}

	/**
	 * Check if user can perform action
	 */
	static canPerformAction(user: User, action: string): boolean {
		const permissions = this.getUserPermissions(user);

		switch (action) {
			case 'CREATE_RECORD':
				return permissions.canCreateRecords;
			case 'SIGN_RECORD':
				return permissions.canSignRecords;
			case 'MANAGE_KEYS':
				return permissions.canManageKeys;
			case 'GROUP_DECRYPT':
				return permissions.canParticipateInGroupDecryption;
			default:
				return false;
		}
	}
    
	/**
	 * Helper: Validate study program
	 */
	static isValidProgramStudi(program: string): program is 'Teknik_Informatika' | 'Sistem_Teknologi_Informasi' {
		return program === 'Teknik_Informatika' || program === 'Sistem_Teknologi_Informasi';
	}

	/**
	 * Helper: Check if advisor of student
	 */
	static isAdvisorOfStudent(advisorId: string, studentAdvisorId: string | null | undefined): boolean {
		return advisorId === studentAdvisorId;
	}

	/**
	 * Helper: Generate session token
	 */
	static generateSessionToken(): string {
		return crypto.randomUUID();
	}

	/**
	 * Helper: Calculate session expiry
	 */
	static getSessionExpiry(hours: number = 24): Date {
		const expiry = new Date();
		expiry.setHours(expiry.getHours() + hours);
		return expiry;
	}
}