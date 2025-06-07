
import { AES, AESUtils } from '../cryptography/AES';
import { BBSUtils } from '../cryptography/BBS';
import { ShamirUtils, type SecretShare } from '../cryptography/SSS';
import type { AcademicRecord } from '../types/academic.types';
import type { EncryptionResult, KeyReconstructionRequest } from '../types/crypto.types';

export class EncryptionService {
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
		try {
			const key = aesKey || this.generateSecureAESKey();
			const encryptedData = AESUtils.encryptAcademicRecord(record, key);
			
			return { encryptedData, keyUsed: key };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to encrypt record: ${errorMessage}`);
		}
	}

	/**
	 * Decrypt academic record
	 */
	static decryptAcademicRecord(encryptedData: string, aesKey: string): AcademicRecord {
		try {
			return AESUtils.decryptAcademicRecord(encryptedData, aesKey);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to decrypt record: ${errorMessage}`);
		}
	}

	/**
	 * Share AES key among advisors
	 */
	static shareKeyAmongAdvisors(aesKey: string, advisorIds: string[]) {
		try {
			const { shares, prime } = ShamirUtils.shareAESKey(aesKey, 3, advisorIds.length);
			const keyId = this.generateKeyId();

			return {
				keyId,
				shares: shares.map((share, index) => ({
					advisorId: advisorIds[index],
					shareX: share.x,
					shareY: share.y
				})),
				prime
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to share key: ${errorMessage}`);
		}
	}

	/**
	 * Reconstruct AES key from shares
	 */
	static reconstructKeyFromShares(request: KeyReconstructionRequest): string {
		try {
			const shares: SecretShare[] = request.advisorShares.map(share => ({
				x: share.shareX,
				y: share.shareY
			}));

			return ShamirUtils.reconstructAESKey(shares.slice(0, 3), request.prime, 64);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to reconstruct key: ${errorMessage}`);
		}
	}

	/**
	 * Complete workflow: Encrypt + Share
	 */
	static encryptAndShare(record: AcademicRecord, advisorIds: string[]) {
		const aesKey = this.generateSecureAESKey();
		const { encryptedData } = this.encryptAcademicRecord(record, aesKey);
		const keySharing = this.shareKeyAmongAdvisors(aesKey, advisorIds);

		return { encryptedRecord: encryptedData, keySharing };
	}

	/**
	 * Complete workflow: Reconstruct + Decrypt
	 */
	static reconstructAndDecrypt(encryptedData: string, request: KeyReconstructionRequest): AcademicRecord {
		const aesKey = this.reconstructKeyFromShares(request);
		return this.decryptAcademicRecord(encryptedData, aesKey);
	}

	private static generateKeyId(): string {
		return `key_${Date.now()}_${BBSUtils.generateSecureHex(4)}`;
	}
}