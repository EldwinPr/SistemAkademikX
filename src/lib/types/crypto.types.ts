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

export interface EncryptionResult {
	encryptedData: string;
	keyUsed: string;
}

export interface DecryptionResult {
	success: boolean;
	decryptedData?: any;
	message: string;
}

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

export interface HeadKeyPair {
	keyId: string;
	publicKey: string;
	privateKey: string;
	keySize: number;
	createdAt: Date;
	studyProgram: 'INFORMATICS' | 'INFORMATION_SYSTEMS';
}