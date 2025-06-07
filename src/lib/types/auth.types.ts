export type Role = 'Mahasiswa' | 'Dosen_Wali' | 'Kepala_Program_Studi';
export type ProgramStudi = 'Teknik_Informatika' | 'Sistem_Teknologi_Informasi';

export interface User {
	id: string;
	username: string;
	role: Role;
	fullName: string;
	nim?: string | null;
	DosenId?: string | null; // Advisor ID for students
	programStudi?: ProgramStudi | null;
	
	// RSA key pair for encryption/decryption (excluded in API responses)
	publicKey?: string | null;
	privateKey?: string | null;
	
	createdAt: Date;
}

export interface AuthSession {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
}

export interface LoginCredentials {
	username: string;
	password: string;
}

export interface AuthResult {
	success: boolean;
	user?: Omit<User, 'privateKey'>; // Never expose private key
	token?: string;
	message: string;
}

export interface AccessPermission {
	userId: string;
	role: Role;
	
	// Direct access permissions
	canViewOwnTranscript: boolean;
	canViewAdviseeTranscripts: boolean; // For advisors
	canViewAllTranscripts: boolean;     // For heads
	
	// Group access permissions
	canParticipateInGroupDecryption: boolean; // For advisors
	canInitiateGroupDecryption: boolean;      // For advisors
	
	// Administrative permissions
	canCreateRecords: boolean;    // For advisors
	canSignRecords: boolean;      // For heads
	canManageKeys: boolean;       // For heads (admin view)
}

export interface UserContext {
	user: Omit<User, 'privateKey'>; // Never expose private key in context
	permissions: AccessPermission;
	isAuthenticated: boolean;
}

// Simple types for API
export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	success: boolean;
	user?: {
		id: string;
		username: string;
		role: Role;
		fullName: string;
		nim?: string | null;
		programStudi?: ProgramStudi | null;
	};
	message: string;
}

export interface LogoutResponse {
	success: boolean;
	message: string;
}

// Helper types
export type PublicUserInfo = Pick<User, 'id' | 'username' | 'fullName' | 'role' | 'programStudi'>;
export type SafeUser = Omit<User, 'password' | 'privateKey'>;