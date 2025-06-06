import { AES, AESUtils } from '../cryptography/AES';
import { BBSUtils } from '../cryptography/BBS';
import { ShamirUtils, type SecretShare } from '../cryptography/SSS';
import type { 
	AcademicRecord,
	EncryptedAcademicRecord
} from '../types/academic.types';
import type {
	EncryptionResult,
	DecryptionResult,
	ShamirSharingResult,
	KeyReconstructionRequest
} from '../types/crypto.types';

export class CryptoService {
	/**
	 * Generate a cryptographically secure AES key using BBS
	 */
	static generateSecureAESKey(keySize: 128 | 192 | 256 = 256): string {
		return BBSUtils.generateSecureAESKey(keySize);
	}

	/**
	 * Encrypt academic record data for storage
	 */
	static encryptAcademicRecord(record: AcademicRecord, aesKey?: string): EncryptionResult {
		const key = aesKey || this.generateSecureAESKey(256);
		
		try {
			const encryptedData = AESUtils.encryptAcademicRecord(record, key);
			
			return {
				encryptedData,
				keyUsed: key
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to encrypt academic record: ${errorMessage}`);
		}
	}

	/**
	 * Decrypt academic record data
	 */
	static decryptAcademicRecord(encryptedData: string, aesKey: string): AcademicRecord {
		try {
			return AESUtils.decryptAcademicRecord(encryptedData, aesKey);
		} catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to decrypt academic record: ${errorMessage}`);
		}
	}

	/**
	 * Share AES key among advisors using Shamir's Secret Sharing
	 */
	static shareKeyAmongAdvisors(
		aesKey: string,
		advisorIds: string[],
		threshold: number = 3
	): ShamirSharingResult {
		if (advisorIds.length < threshold) {
			throw new Error(`Need at least ${threshold} advisors for secret sharing`);
		}

		try {
			const { shares, prime } = ShamirUtils.shareAESKey(aesKey, threshold, advisorIds.length);
			const keyId = this.generateKeyId();

			const advisorShares = shares.map((share, index) => ({
				advisorId: advisorIds[index],
				shareX: share.x,
				shareY: share.y
			}));

			return {
				keyId,
				shares: advisorShares,
				prime
			};
		} catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to share key among advisors: ${errorMessage}`);
		}
	}

	/**
	 * Reconstruct AES key from advisor shares
	 */
	static reconstructKeyFromShares(request: KeyReconstructionRequest): string {
		if (request.advisorShares.length < 3) {
			throw new Error('Need at least 3 shares to reconstruct key');
		}

		try {
			const shares: SecretShare[] = request.advisorShares.map(share => ({
				x: share.shareX,
				y: share.shareY
			}));

			return ShamirUtils.reconstructAESKey(shares.slice(0, 3), request.prime, 64);
		} catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to reconstruct key from shares: ${errorMessage}`);
		}
	}

	/**
	 * Complete workflow: Encrypt record and share key
	 */
	static encryptAndShareRecord(
		record: AcademicRecord,
		advisorIds: string[],
		threshold: number = 3
	): {
		encryptedRecord: string;
		keySharing: ShamirSharingResult;
	} {
		const aesKey = this.generateSecureAESKey(256);
		const { encryptedData } = this.encryptAcademicRecord(record, aesKey);
		const keySharing = this.shareKeyAmongAdvisors(aesKey, advisorIds, threshold);

		return {
			encryptedRecord: encryptedData,
			keySharing
		};
	}

	/**
	 * Complete workflow: Reconstruct key and decrypt record
	 */
	static reconstructAndDecrypt(
		encryptedData: string,
		request: KeyReconstructionRequest
	): AcademicRecord {
		const aesKey = this.reconstructKeyFromShares(request);
		return this.decryptAcademicRecord(encryptedData, aesKey);
	}

	/**
	 * Validate if advisor shares are sufficient for decryption
	 */
	static validateDecryptionRequest(request: KeyReconstructionRequest): {
		isValid: boolean;
		message: string;
	} {
		if (!request.advisorShares || request.advisorShares.length < 3) {
			return {
				isValid: false,
				message: 'Need at least 3 advisor shares for decryption'
			};
		}

		const uniqueAdvisors = new Set(request.advisorShares.map(s => s.advisorId));
		if (uniqueAdvisors.size !== request.advisorShares.length) {
			return {
				isValid: false,
				message: 'Duplicate shares from the same advisor not allowed'
			};
		}

		for (const share of request.advisorShares) {
			if (!share.advisorId || typeof share.shareX !== 'number' || !share.shareY) {
				return {
					isValid: false,
					message: 'Invalid share format'
				};
			}
		}

		return {
			isValid: true,
			message: 'Decryption request is valid'
		};
	}

	/**
	 * Encrypt arbitrary data
	 */
	static encryptData(data: any, key?: string): EncryptionResult {
		const aesKey = key || this.generateSecureAESKey(256);
		const aes = new AES(aesKey);
		
		const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
		const encrypted = aes.encryptToHex(jsonData);
		
		return {
			encryptedData: encrypted,
			keyUsed: aesKey
		};
	}

	/**
	 * Decrypt arbitrary data
	 */
	static decryptData(encryptedData: string, key: string): DecryptionResult {
		try {
			const aes = new AES(key);
			const decrypted = aes.decryptFromHex(encryptedData);
			
			let parsedData;
			try {
				parsedData = JSON.parse(decrypted);
			} catch {
				parsedData = decrypted;
			}

			return {
				success: true,
				decryptedData: parsedData,
				message: 'Decryption successful'
			};
		} catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
			return {
				success: false,
				message: `Decryption failed: ${errorMessage}`
			};
		}
	}

	/**
	 * Generate unique key identifier
	 */
	private static generateKeyId(): string {
		const timestamp = Date.now().toString(36);
		const randomPart = BBSUtils.generateSecureHex(8);
		return `key_${timestamp}_${randomPart}`;
	}

	/**
	 * Generate secure random data
	 */
	static generateSecureRandom(byteLength: number): string {
		return BBSUtils.generateSecureHex(byteLength);
	}
}