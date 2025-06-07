import { RSA, RSAUtils } from '../cryptography/RSA';
import { SHA3, SHA3Utils } from '../cryptography/SHA3';
import { BBSUtils } from '../cryptography/BBS';
import type { AcademicRecord } from '../types/academic.types';
import type { DigitalSignature, SignatureVerification, HeadKeyPair } from '../types/crypto.types';

export class SignatureService {
	/**
	 * Generate HEAD key pair
	 */
	static generateHeadKeyPair(studyProgram: 'INFORMATICS' | 'INFORMATION_SYSTEMS'): HeadKeyPair {
		try {
			const keyPair = RSA.generateKeyPair(2048);
			const keyId = this.generateKeyId(studyProgram);
			
			return {
				keyId,
				publicKey: RSAUtils.publicKeyToHex(keyPair.publicKey),
				privateKey: RSAUtils.privateKeyToHex(keyPair.privateKey),
				keySize: 2048,
				createdAt: new Date(),
				studyProgram
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to generate key pair: ${errorMessage}`);
		}
	}

	/**
	 * Sign academic record
	 */
	static signAcademicRecord(
		record: AcademicRecord,
		privateKeyHex: string,
		keyId: string
	): DigitalSignature {
		try {
			const dataHash = SHA3Utils.hashAcademicRecord(record);
			const privateKey = RSAUtils.privateKeyFromHex(privateKeyHex);
			const signature = RSAUtils.signBytes(dataHash, privateKey);
			
			return {
				signature: signature.toString(16),
				algorithm: 'RSA-SHA3',
				keyId,
				timestamp: new Date(),
				dataHash: SHA3Utils.toHex(dataHash)
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to sign record: ${errorMessage}`);
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
			
			// Check hash integrity
			if (currentHashHex !== digitalSignature.dataHash) {
				return {
					isValid: false,
					message: 'Record has been modified',
					verifiedAt: new Date()
				};
			}
			
			// Verify signature
			const publicKey = RSAUtils.publicKeyFromHex(publicKeyHex);
			const signature = BigInt('0x' + digitalSignature.signature);
			const isValid = RSAUtils.verifyBytes(currentHash, signature, publicKey);
			
			return {
				isValid,
				message: isValid ? 'Signature verified' : 'Invalid signature',
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
	 * Sign any data
	 */
	static signData(data: string | Uint8Array, privateKeyHex: string, keyId: string): DigitalSignature {
		try {
			const dataHash = SHA3.sha256(data);
			const privateKey = RSAUtils.privateKeyFromHex(privateKeyHex);
			const signature = RSAUtils.signBytes(dataHash, privateKey);
			
			return {
				signature: signature.toString(16),
				algorithm: 'RSA-SHA3',
				keyId,
				timestamp: new Date(),
				dataHash: SHA3Utils.toHex(dataHash)
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to sign data: ${errorMessage}`);
		}
	}

	/**
	 * Verify any data signature
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
					message: 'Data has been modified',
					verifiedAt: new Date()
				};
			}
			
			const publicKey = RSAUtils.publicKeyFromHex(publicKeyHex);
			const signature = BigInt('0x' + digitalSignature.signature);
			const isValid = RSAUtils.verifyBytes(currentHash, signature, publicKey);
			
			return {
				isValid,
				message: isValid ? 'Signature verified' : 'Invalid signature',
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

	private static generateKeyId(studyProgram: string): string {
		const prefix = studyProgram === 'INFORMATICS' ? 'inf' : 'sis';
		const timestamp = Date.now().toString(36);
		const random = BBSUtils.generateSecureHex(4);
		return `${prefix}_head_${timestamp}_${random}`;
	}
}