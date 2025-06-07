export enum VerificationStatus {
	VERIFIED = 'VERIFIED',
	UNVERIFIED = 'UNVERIFIED',
	INVALID = 'INVALID'
}

export interface Course {
	code: string;
	name: string;
	credits: number;
	grade: string;
}

export interface AcademicRecord {
	nim: string;
	name: string;
	courses: Course[];
	ipk: number;
}

export interface EncryptedAcademicRecord {
	id: string;
	studentId: string;
	encryptedData: string;
	digitalSignature: string;
	keyId: string;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
}

export interface DecryptedAcademicDisplay {
	record: AcademicRecord;
	verificationStatus: VerificationStatus;
	accessedBy: string;
	accessedAt: Date;
}

export interface TranscriptRequest {
	studentId: string;
	requestedBy: string;
	includeSignature: boolean;
	encryptPDF?: boolean;
	requestedAt: Date;
}

export interface GeneratedTranscript {
	id: string;
	studentId: string;
	fileName: string;
	isEncrypted: boolean;
	fileData?: Uint8Array;
	generatedAt: Date;
	generatedBy: string;
}

export interface PDFTranscriptConfig {
	includeSignature: boolean;
	includeWatermark: boolean;
	headerText?: string;
	footerText?: string;
}

export interface DirectKey {
	id: string;
	recordId: string;
	userId: string;
	encryptedAESKey: string;
	createdAt: Date;
}

export interface SecretShare {
	id: string;
	recordId: string;
	advisorId: string;
	shareX: number;
	shareY: string;
	prime: string;
	createdAt: Date;
}

export interface AccessRequest {
	recordId: string;
	userId: string;
}

export interface AccessResponse {
	success: boolean;
	accessType: 'DIRECT' | 'GROUP_REQUIRED' | 'DENIED';
	data?: AcademicRecord;
	verificationStatus?: VerificationStatus;
	message: string;
	
	// For group access
	availableShares?: SecretShare[];
	requiredShareCount?: number;
}

export interface GroupDecryptionRequest {
	recordId: string;
	participatingShares: Array<{
		advisorId: string;
		shareX: number;
		shareY: string;
	}>;
	prime: string;
	requestedBy: string;
}

// Utility types
export type CreateAcademicRecordData = Omit<EncryptedAcademicRecord, 'id' | 'createdAt' | 'updatedAt'>;