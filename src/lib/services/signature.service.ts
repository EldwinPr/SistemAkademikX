import { RSA, RSAUtils } from '../cryptography/RSA';
import { SHA3, SHA3Utils } from '../cryptography/SHA3';
import { BBSUtils } from '../cryptography/BBS';
import type { AcademicRecord } from '../types/academic.types';
import type { DigitalSignature, SignatureVerification, HeadKeyPair } from '../types/crypto.types';

export class SignatureService {
	/**
	 * Generate HEAD key pair for signing (updated for study program)
	 */
	static generateHeadKeyPair(programStudi: 'Teknik_Informatika' | 'Sistem_Teknologi_Informasi'): HeadKeyPair {
		const keyPair = RSA.generateKeyPair(2048);
		const keyId = `${programStudi.toLowerCase()}_head_${Date.now()}`;
		
		return {
			keyId,
			publicKey: RSAUtils.publicKeyToHex(keyPair.publicKey),
			privateKey: RSAUtils.privateKeyToHex(keyPair.privateKey),
			keySize: 2048,
			createdAt: new Date(),
			programStudi
		};
	}

	/**
	 * Sign academic record with HEAD's private key
	 */
	static signAcademicRecord(
		record: AcademicRecord,
		privateKeyHex: string,
		keyId: string
	): DigitalSignature {
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
			
			// Check if record was modified
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
			return {
				isValid: false,
				message: `Verification failed: ${error}`,
				verifiedAt: new Date()
			};
		}
	}

	/**
	 * Sign any data (for other use cases)
	 */
	static signData(data: string | Uint8Array, privateKeyHex: string, keyId: string): DigitalSignature {
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
			return {
				isValid: false,
				message: `Verification failed: ${error}`,
				verifiedAt: new Date()
			};
		}
	}
}