export enum CryptoAlgorithm {
	AES = 'AES',
	RSA = 'RSA',
	RC4 = 'RC4',
	SHA3 = 'SHA3',
	BBS = 'BBS',
	SHAMIR = 'SHAMIR'
}

export interface DigitalSignature {
	signature: string; // Hex-encoded
	algorithm: 'RSA-SHA3';
	keyId: string;
	timestamp: Date;
	dataHash: string; // SHA-3
}

export interface SignatureVerification {
	isValid: boolean;
	message: string;
	verifiedAt: Date;
	keyId?: string;
}

// Shamir's Secret Sharing types
export interface SecretShare {
	x: number;
	y: string;
}

export interface KeyShare {
	id: string;
	keyId: string;
	advisorId: string;
	shareX: number;
	shareY: string;
	createdAt: Date;
}

export interface ShamirSharingResult {
	keyId: string;
	shares: Array<{
		advisorId: string;
		shareX: number;
		shareY: string;
	}>;
	prime: string;
}

export interface KeyReconstructionRequest {
	keyId: string;
	advisorShares: Array<{
		advisorId: string;
		shareX: number;
		shareY: string;
	}>;
	prime: string;
	requestedBy: string;
	requestedAt: Date;
}

// Encryption/Decryption results
export interface EncryptionResult {
	encryptedData: string;
	keyUsed: string;
}

export interface DecryptionResult {
	success: boolean;
	decryptedData?: any;
	message: string;
}

// PDF encryption types
export interface PDFEncryptionResult {
	encryptedData: Uint8Array;
	encryptionKey: string;
	fileName: string;
	originalSize: number;
	encryptedSize: number;
}

export interface PDFDecryptionResult {
	success: boolean;
	decryptedData?: Uint8Array;
	fileName: string;
	message: string;
}

// Head key management (for admin functionality)
export interface HeadKeyPair {
	keyId: string;
	publicKey: string;
	privateKey: string;
	keySize: number;
	createdAt: Date;
	programStudi: 'Teknik_Informatika' | 'Sistem_Teknologi_Informasi';
}

// Dual access system types
export interface DirectAccessKey {
	recordId: string;
	userId: string;
	encryptedAESKey: string; // AES key encrypted with user's RSA public key
	createdAt: Date;
}

export interface GroupAccessShare {
	recordId: string;
	advisorId: string;
	shareX: number;
	shareY: string;
	prime: string;
	createdAt: Date;
}

// Key management for admin (head) view
export interface KeyDistributionView {
	recordId: string;
	studentId: string;
	studentName: string;
	
	// Direct access holders
	directAccessUsers: Array<{
		userId: string;
		userName: string;
		role: string;
		hasAccessed: boolean;
		lastAccessed?: Date;
	}>;
	
	// Shamir share holders
	shareHolders: Array<{
		advisorId: string;
		advisorName: string;
		hasShare: boolean;
		shareX?: number;
	}>;
	
	// Metadata
	createdAt: Date;
	createdBy: string;
	totalAccessAttempts: number;
	lastAccessAttempt?: Date;
}

// Crypto operation contexts
export interface CryptoOperation {
	operation: 'ENCRYPT' | 'DECRYPT' | 'SIGN' | 'VERIFY' | 'SHARE' | 'RECONSTRUCT';
	algorithm: CryptoAlgorithm;
	userId: string;
	recordId?: string;
	timestamp: Date;
	success: boolean;
	errorMessage?: string;
}

// System-level crypto configuration
export interface CryptoConfig {
	defaultKeySize: number;
	shamirThreshold: number;
	sessionTimeout: number;
	maxReconstructionAttempts: number;
	enableAuditLogging: boolean;
}