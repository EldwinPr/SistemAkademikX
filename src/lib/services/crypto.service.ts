import { AES, AESUtils } from '../cryptography/AES';
import { RSA, RSAUtils } from '../cryptography/RSA';
import { BBSUtils } from '../cryptography/BBS';
import { ShamirUtils, type SecretShare } from '../cryptography/SSS';
import type { 
	AcademicRecord,
	DirectKey,
	SecretShare as DBSecretShare
} from '../types/academic.types';
import type {
	EncryptionResult,
	ShamirSharingResult
} from '../types/crypto.types';

export class CryptoService {
	/**
	 * Generate secure AES key
	 */
	static generateSecureAESKey(): string {
		return BBSUtils.generateSecureAESKey(256);
	}

	/**
	 * Encrypt academic record
	 */
	static encryptAcademicRecord(record: AcademicRecord, aesKey?: string): EncryptionResult {
		const key = aesKey || this.generateSecureAESKey();
		const encryptedData = AESUtils.encryptAcademicRecord(record, key);
		
		return { encryptedData, keyUsed: key };
	}

	/**
	 * Decrypt academic record
	 */
	static decryptAcademicRecord(encryptedData: string, aesKey: string): AcademicRecord {
		return AESUtils.decryptAcademicRecord(encryptedData, aesKey);
	}

	/**
	 * Create direct access keys (for student/advisor/head)
	 */
	static createDirectAccessKeys(
		aesKey: string,
		userIds: string[],
		userPublicKeys: Record<string, string>
	): Array<{ userId: string; encryptedAESKey: string }> {
		return userIds.map(userId => {
			const publicKeyHex = userPublicKeys[userId];
			if (!publicKeyHex) throw new Error(`Public key not found for user ${userId}`);
			
			const publicKey = RSAUtils.publicKeyFromHex(publicKeyHex);
			const aesKeyBytes = new TextEncoder().encode(aesKey);
			const aesKeyBigInt = RSAUtils.bytesToBigInt(aesKeyBytes);
			const encryptedKey = RSA.encrypt(aesKeyBigInt, publicKey);
			
			return {
				userId,
				encryptedAESKey: encryptedKey.toString(16)
			};
		});
	}

	/**
	 * Decrypt direct access key
	 */
	static decryptDirectAccessKey(encryptedAESKey: string, userPrivateKey: string): string {
		const privateKey = RSAUtils.privateKeyFromHex(userPrivateKey);
		const encryptedKeyBigInt = BigInt('0x' + encryptedAESKey);
		const decryptedKeyBigInt = RSA.decrypt(encryptedKeyBigInt, privateKey);
		const aesKeyBytes = RSAUtils.bigIntToBytes(decryptedKeyBigInt);
		
		return new TextDecoder().decode(aesKeyBytes);
	}

	/**
	 * Share AES key among advisors using Shamir
	 */
	static shareKeyAmongAdvisors(
		aesKey: string,
		advisorIds: string[],
		threshold: number = 3
	): ShamirSharingResult {
		const { shares, prime } = ShamirUtils.shareAESKey(aesKey, threshold, advisorIds.length);
		const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

		return {
			keyId,
			shares: shares.map((share, index) => ({
				advisorId: advisorIds[index],
				shareX: share.x,
				shareY: share.y
			})),
			prime
		};
	}

	/**
	 * Reconstruct AES key from Shamir shares
	 */
	static reconstructKeyFromShares(
		shares: Array<{ shareX: number; shareY: string }>,
		prime: string
	): string {
		const secretShares: SecretShare[] = shares.map(share => ({
			x: share.shareX,
			y: share.shareY
		}));

		return ShamirUtils.reconstructAESKey(secretShares.slice(0, 3), prime, 64);
	}
}