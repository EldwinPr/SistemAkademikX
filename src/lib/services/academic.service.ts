import { CryptoService } from './crypto.service';
import { SignatureService } from './signature.service';
import type {
	AcademicRecord,
	EncryptedAcademicRecord,
	DirectKey,
	SecretShare,
	AccessRequest,
	AccessResponse,
	GroupDecryptionRequest,
	Course
} from '../types/academic.types';
import { VerificationStatus } from '../types/academic.types';

export class AcademicService {
	// Grade mapping from document
	private static readonly GRADE_POINTS: Record<string, number> = {
		'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5,
		'C': 2.0, 'D': 1.0, 'E': 0.0
	};

	/**
	 * Create academic record with dual access
	 */
	static createRecord(
		data: { nim: string; name: string; courses: Course[] },
		advisorId: string,
		encryptionKey: string,
		allAdvisorIds: string[],
		userIds: { studentId: string; advisorId: string; headId: string },
		publicKeys: Record<string, string>
	) {
		// Validate and calculate IPK
		const record = this.prepareRecord(data);
		
		// Encrypt record
		const { encryptedData } = CryptoService.encryptAcademicRecord(record, encryptionKey);
		
		// Create direct access keys
		const directKeyData = CryptoService.createDirectAccessKeys(
			encryptionKey,
			[userIds.studentId, userIds.advisorId, userIds.headId],
			publicKeys
		);
		
		// Create Shamir shares
		const keySharing = CryptoService.shareKeyAmongAdvisors(encryptionKey, allAdvisorIds, 3);
		
		// Sign record
		const signature = SignatureService.signAcademicRecord(record, publicKeys.headPrivateKey, 'head_key_id');
		
		const recordId = this.generateId();
		
		return {
			encryptedRecord: {
				id: recordId,
				studentId: userIds.studentId,
				encryptedData,
				digitalSignature: signature.signature,
				keyId: keySharing.keyId,
				createdAt: new Date(),
				createdBy: advisorId
			},
			directKeys: directKeyData.map(key => ({
				id: this.generateId(),
				recordId,
				userId: key.userId,
				encryptedAESKey: key.encryptedAESKey,
				createdAt: new Date()
			})),
			secretShares: keySharing.shares.map(share => ({
				id: this.generateId(),
				recordId,
				advisorId: share.advisorId,
				shareX: share.shareX,
				shareY: share.shareY,
				prime: keySharing.prime,
				createdAt: new Date()
			}))
		};
	}

	/**
	 * Access record - direct or group
	 */
	static accessRecord(
		request: AccessRequest,
		directKey: DirectKey | null,
		userPrivateKey: string
	): AccessResponse {
		if (directKey) {
			// Direct access
			try {
				const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, userPrivateKey);
				const record = CryptoService.decryptAcademicRecord('encrypted_data', aesKey);
				
				return {
					success: true,
					accessType: 'DIRECT',
					data: record,
					verificationStatus: VerificationStatus.VERIFIED,
					message: 'Direct access granted'
				};
			} catch (error) {
				return {
					success: false,
					accessType: 'DENIED',
					message: 'Direct access failed'
				};
			}
		}
		
		// Group required
		return {
			success: false,
			accessType: 'GROUP_REQUIRED',
			message: 'Need 3 advisor shares',
			requiredShareCount: 3
		};
	}

	/**
	 * Group decrypt with shares
	 */
	static groupDecrypt(
		request: GroupDecryptionRequest,
		encryptedData: string,
		headPublicKey: string
	): AccessResponse {
		if (request.participatingShares.length < 3) {
			return {
				success: false,
				accessType: 'DENIED',
				message: 'Need minimum 3 shares'
			};
		}

		try {
			// Reconstruct key
			const key = CryptoService.reconstructKeyFromShares(
				request.participatingShares.map(s => ({ shareX: s.shareX, shareY: s.shareY })),
				request.prime
			);
			
			// Decrypt record
			const record = CryptoService.decryptAcademicRecord(encryptedData, key);
			
			// Verify signature
			const signature = {
				signature: 'signature_from_db',
				algorithm: 'RSA-SHA3' as const,
				keyId: 'key_id',
				timestamp: new Date(),
				dataHash: ''
			};
			
			const verification = SignatureService.verifyAcademicRecord(record, signature, headPublicKey);
			
			return {
				success: true,
				accessType: 'DIRECT',
				data: record,
				verificationStatus: verification.isValid ? VerificationStatus.VERIFIED : VerificationStatus.INVALID,
				message: verification.message
			};
		} catch (error) {
			return {
				success: false,
				accessType: 'DENIED',
				message: 'Group decryption failed'
			};
		}
	}

	/**
	 * Calculate IPK automatically
	 */
	private static calculateIPK(courses: Course[]): number {
		let totalPoints = 0;
		let totalCredits = 0;

		courses.forEach(course => {
			const points = this.GRADE_POINTS[course.grade] || 0;
			totalPoints += points * course.credits;
			totalCredits += course.credits;
		});

		return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
	}

	/**
	 * Prepare and validate record
	 */
	private static prepareRecord(data: { nim: string; name: string; courses: Course[] }): AcademicRecord {
		if (!data.nim || !data.name || !data.courses?.length) {
			throw new Error('Missing required fields');
		}

		// Remove the fixed 10 course requirement - now flexible
		if (data.courses.length < 1) {
			throw new Error('Must have at least 1 course');
		}

		if (data.courses.length > 12) {
			throw new Error('Maximum 12 courses allowed');
		}

		// Validate total credits don't exceed 24 SKS
		const totalCredits = data.courses.reduce((sum, course) => sum + course.credits, 0);
		if (totalCredits > 24) {
			throw new Error('Total credits cannot exceed 24 SKS');
		}

		// Validate grades
		data.courses.forEach((course, i) => {
			if (!(course.grade in this.GRADE_POINTS)) {
				throw new Error(`Invalid grade '${course.grade}' for course ${i + 1}`);
			}
		});

		return {
			nim: data.nim,
			name: data.name,
			courses: data.courses,
			ipk: this.calculateIPK(data.courses)
		};
	}

	private static generateId(): string {
		return `id_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
	}
}