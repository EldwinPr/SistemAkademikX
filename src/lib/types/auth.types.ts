export enum Role {
	STUDENT = 'STUDENT',
	ADVISOR = 'ADVISOR',
	HEAD = 'HEAD'
}

export enum StudyProgram {
	INFORMATICS = 'INFORMATICS',
	INFORMATION_SYSTEMS = 'INFORMATION_SYSTEMS'
}

export interface User {
	id: string;
	username: string;
	email: string;
	role: Role;
	studyProgram?: StudyProgram;
	fullName: string;
	nim?: string;
	advisorId?: string;
	createdAt: Date;
	updatedAt: Date;
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
	canViewOwnTranscript: boolean;
	canViewOtherTranscripts: boolean;
	canDecryptFullRecord: boolean;
	canCreateRecords: boolean;
	canSignRecords: boolean;
}

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

// Utility types
export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type PublicUserInfo = Pick<User, 'id' | 'username' | 'fullName' | 'role' | 'studyProgram'>;