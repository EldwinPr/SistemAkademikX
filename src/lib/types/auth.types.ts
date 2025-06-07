export enum Role {
	STUDENT = 'Mahasiswa',
	ADVISOR = 'Dosen_Wali', 
	HEAD = 'Kepala_Program_Studi'
}

export enum ProgramStudi {
	TEKNIK_INFORMATIKA = 'Teknik_Informatika',
	SISTEM_TEKNOLOGI_INFORMASI = 'Sistem_Teknologi_Informasi'
}

export interface User {
	id: string;
	username: string;
	role: Role;
	fullName: string;
	nim?: string;
	DosenId?: string; // Advisor ID for students
	
	// Study program field - matches schema exactly
	programStudi?: ProgramStudi;
	
	// RSA key pair for encryption/decryption
	publicKey?: string;
	privateKey?: string;
	
	createdAt: Date;
	updatedAt?: Date;
}

export interface AuthSession {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
}

export interface LoginCredentials {
	username: string;
	password: string;
}

export interface AuthResult {
	success: boolean;
	user?: User;
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

// Simplified group decryption session
export interface GroupDecryptionSession {
	id: string;
	recordId: string;
	initiatedBy: string;
	participatingAdvisors: string[];
	requiredShares: number;
	currentShares: number;
	status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
	createdAt: Date;
	completedAt?: Date;
}

// User management types - no password for security
export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type PublicUserInfo = Pick<User, 'id' | 'username' | 'fullName' | 'role' | 'programStudi'>;

// Access control helpers
export interface UserContext {
	user: User;
	permissions: AccessPermission;
	isAuthenticated: boolean;
}

export interface AccessCheck {
	recordId: string;
	requestingUserId: string;
	targetStudentId: string;
	action: 'VIEW' | 'CREATE' | 'SIGN' | 'GROUP_DECRYPT';
}

export interface AccessResult {
	allowed: boolean;
	accessType: 'DIRECT' | 'GROUP_REQUIRED' | 'DENIED';
	reason: string;
}