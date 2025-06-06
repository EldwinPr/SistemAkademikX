import { RSA, RSAUtils } from '../cryptography/RSA';
import { SHA3, SHA3Utils } from '../cryptography/SHA3';
import { BBSUtils } from '../cryptography/BBS';
import type { AcademicRecord } from '../types/academic.types';
import type { 
	DigitalSignature, 
	SignatureVerification,
	HeadKeyPair
} from '../types/crypto.types';

export class SignatureService {
	/**
	 * Generate RSA key pair for HEAD role
	 */
	static generateHeadKeyPair(
		studyProgram: 'INFORMATICS' | 'INFORMATION_SYSTEMS',
		keySize: number = 2048
	): HeadKeyPair {
		try {
			const keyPair = RSA.generateKeyPair(keySize);
			const publicKeyHex = RSAUtils.publicKeyToHex(keyPair.publicKey);
			const privateKeyHex = RSAUtils.privateKeyToHex(keyPair.privateKey);
			const keyId = this.generateKeyId(studyProgram);
			
			return {
				keyId,
				publicKey: publicKeyHex,
				privateKey: privateKeyHex,
				keySize,
				createdAt: new Date(),
				studyProgram
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to generate HEAD key pair: ${errorMessage}`);
		}
	}

	/**
	 * Sign academic record data
	 */
	static signAcademicRecord(
		record: AcademicRecord,
		privateKeyHex: string,
		keyId: string
	): DigitalSignature {
		try {
			const dataHash = SHA3Utils.hashAcademicRecord(record);
			const hashHex = SHA3Utils.toHex(dataHash);
			const privateKey = RSAUtils.privateKeyFromHex(privateKeyHex);
			const signature = RSAUtils.signBytes(dataHash, privateKey);
			
			return {
				signature: signature.toString(16),
				algorithm: 'RSA-SHA3',
				keyId,
				timestamp: new Date(),
				dataHash: hashHex
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to sign academic record: ${errorMessage}`);
		}
	}

	/**
	 * Verify academic record signature
	 */
	static verifyAcademicRecord(
		record: AcademicRecord,
		digitalSignature: DigitalSignature,
		publicKeyHex: string
	): SignatureVerification {
		try {
			const currentHash = SHA3Utils.hashAcademicRecord(record);
			const currentHashHex = SHA3Utils.toHex(currentHash);
			
			if (currentHashHex !== digitalSignature.dataHash) {
				return {
					isValid: false,
					message: 'Record has been modified - hash mismatch',
					verifiedAt: new Date()
				};
			}
			
			const publicKey = RSAUtils.publicKeyFromHex(publicKeyHex);
			const signature = BigInt('0x' + digitalSignature.signature);
			const isValidSignature = RSAUtils.verifyBytes(currentHash, signature, publicKey);
			
			return {
				isValid: isValidSignature,
				message: isValidSignature ? 'Signature verified successfully' : 'Invalid digital signature',
				verifiedAt: new Date(),
				keyId: digitalSignature.keyId
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return {
				isValid: false,
				message: `Verification failed: ${errorMessage}`,
				verifiedAt: new Date()
			};
		}
	}

	/**
	 * Sign arbitrary data
	 */
	static signData(
		data: string | Uint8Array,
		privateKeyHex: string,
		keyId: string
	): DigitalSignature {
		try {
			const dataHash = SHA3.sha256(data);
			const hashHex = SHA3Utils.toHex(dataHash);
			const privateKey = RSAUtils.privateKeyFromHex(privateKeyHex);
			const signature = RSAUtils.signBytes(dataHash, privateKey);
			
			return {
				signature: signature.toString(16),
				algorithm: 'RSA-SHA3',
				keyId,
				timestamp: new Date(),
				dataHash: hashHex
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to sign data: ${errorMessage}`);
		}
	}

	/**
	 * Verify arbitrary data signature
	 */
	static verifyData(
		data: string | Uint8Array,
		digitalSignature: DigitalSignature,
		publicKeyHex: string
	): SignatureVerification {
		try {
			const currentHash = SHA3.sha256(data);
			const currentHashHex = SHA3Utils.toHex(currentHash);
			
			if (currentHashHex !== digitalSignature.dataHash) {
				return {
					isValid: false,
					message: 'Data has been modified - hash mismatch',
					verifiedAt: new Date()
				};
			}
			
			const publicKey = RSAUtils.publicKeyFromHex(publicKeyHex);
			const signature = BigInt('0x' + digitalSignature.signature);
			const isValidSignature = RSAUtils.verifyBytes(currentHash, signature, publicKey);
			
			return {
				isValid: isValidSignature,
				message: isValidSignature ? 'Signature verified successfully' : 'Invalid digital signature',
				verifiedAt: new Date(),
				keyId: digitalSignature.keyId
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return {
				isValid: false,
				message: `Verification failed: ${errorMessage}`,
				verifiedAt: new Date()
			};
		}
	}

	/**
	 * Create complete signed academic record
	 */
	static createSignedRecord(
		record: AcademicRecord,
		privateKeyHex: string,
		keyId: string
	): {
		record: AcademicRecord;
		signature: DigitalSignature;
		signedAt: Date;
	} {
		const signature = this.signAcademicRecord(record, privateKeyHex, keyId);
		
		return {
			record,
			signature,
			signedAt: new Date()
		};
	}

	/**
	 * Validate key pair integrity
	 */
	static validateKeyPair(publicKeyHex: string, privateKeyHex: string): boolean {
		try {
			const publicKey = RSAUtils.publicKeyFromHex(publicKeyHex);
			const privateKey = RSAUtils.privateKeyFromHex(privateKeyHex);
			
			const testMessage = 'key_validation_test';
			const testHash = SHA3.sha256(testMessage);
			
			const signature = RSAUtils.signBytes(testHash, privateKey);
			return RSAUtils.verifyBytes(testHash, signature, publicKey);
		} catch {
			return false;
		}
	}

	/**
	 * Get public key info for display
	 */
	static getPublicKeyInfo(publicKeyHex: string): {
		keySize: number;
		modulus: string;
		exponent: string;
	} {
		try {
			const publicKey = RSAUtils.publicKeyFromHex(publicKeyHex);
			
			return {
				keySize: publicKey.n.toString(2).length,
				modulus: publicKey.n.toString(16).substring(0, 32) + '...',
				exponent: publicKey.e.toString()
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to parse public key: ${errorMessage}`);
		}
	}

	/**
	 * Sign multiple records in batch
	 */
	static signMultipleRecords(
		records: AcademicRecord[],
		privateKeyHex: string,
		keyId: string
	): Array<{
		record: AcademicRecord;
		signature: DigitalSignature;
	}> {
		return records.map(record => ({
			record,
			signature: this.signAcademicRecord(record, privateKeyHex, keyId)
		}));
	}

	/**
	 * Verify multiple signatures in batch
	 */
	static verifyMultipleRecords(
		signedRecords: Array<{
			record: AcademicRecord;
			signature: DigitalSignature;
		}>,
		publicKeyHex: string
	): Array<{
		record: AcademicRecord;
		verification: SignatureVerification;
	}> {
		return signedRecords.map(({ record, signature }) => ({
			record,
			verification: this.verifyAcademicRecord(record, signature, publicKeyHex)
		}));
	}

	/**
	 * Generate secure key ID
	 */
	private static generateKeyId(studyProgram: string): string {
		const timestamp = Date.now().toString(36);
		const randomPart = BBSUtils.generateSecureHex(8);
		const prefix = studyProgram === 'INFORMATICS' ? 'inf' : 'sis';
		return `${prefix}_head_${timestamp}_${randomPart}`;
	}
}