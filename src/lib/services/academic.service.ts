import { EncryptionService } from './encryption.service';
import { SignatureService } from './signature.service';
import type {
	AcademicRecord,
	EncryptedAcademicRecord,
	DecryptedAcademicDisplay,
} from '../types/academic.types';
import { VerificationStatus } from '../types/academic.types';
import type { DigitalSignature, KeyReconstructionRequest } from '../types/crypto.types';

export class AcademicService {
	/**
	 * Create encrypted academic record
	 */
	static async createRecord(
		record: AcademicRecord,
		advisorIds: string[],
		headPrivateKey: string,
		headKeyId: string,
		createdBy: string
	) {
		try {
			// Validate record
			this.validateRecord(record);

			// Encrypt and share key
			const { encryptedRecord, keySharing } = EncryptionService.encryptAndShare(record, advisorIds);

			// Create digital signature
			const signature = SignatureService.signAcademicRecord(record, headPrivateKey, headKeyId);

			// Prepare for database
			const dbRecord: EncryptedAcademicRecord = {
				id: this.generateId(),
				studentId: record.nim,
				encryptedData: encryptedRecord,
				digitalSignature: signature.signature,
				keyId: keySharing.keyId,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy
			};

			return { dbRecord, keySharing, signature };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to create record: ${errorMessage}`);
		}
	}

	/**
	 * Decrypt record with group consent
	 */
	static async decryptRecord(
		encryptedRecord: EncryptedAcademicRecord,
		reconstructionRequest: KeyReconstructionRequest,
		headPublicKey: string,
		accessedBy: string
	): Promise<DecryptedAcademicDisplay> {
		try {
			// Decrypt using Shamir reconstruction
			const record = EncryptionService.reconstructAndDecrypt(
				encryptedRecord.encryptedData,
				reconstructionRequest
			);

			// Verify signature
			const signature: DigitalSignature = {
				signature: encryptedRecord.digitalSignature,
				algorithm: 'RSA-SHA3',
				keyId: encryptedRecord.keyId,
				timestamp: encryptedRecord.createdAt,
				dataHash: ''
			};

			const verification = SignatureService.verifyAcademicRecord(record, signature, headPublicKey);

			return {
				record,
				verificationStatus: verification.isValid ? VerificationStatus.VERIFIED : VerificationStatus.INVALID,
				accessedBy,
				accessedAt: new Date()
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to decrypt record: ${errorMessage}`);
		}
	}

	/**
	 * Get student's own record (direct access)
	 */
	static async getStudentRecord(
		encryptedRecord: EncryptedAcademicRecord,
		aesKey: string,
		headPublicKey: string,
		studentId: string
	): Promise<DecryptedAcademicDisplay> {
		try {
			// Direct decryption for student
			const record = EncryptionService.decryptAcademicRecord(encryptedRecord.encryptedData, aesKey);

			// Verify signature
			const signature: DigitalSignature = {
				signature: encryptedRecord.digitalSignature,
				algorithm: 'RSA-SHA3',
				keyId: encryptedRecord.keyId,
				timestamp: encryptedRecord.createdAt,
				dataHash: ''
			};

			const verification = SignatureService.verifyAcademicRecord(record, signature, headPublicKey);

			return {
				record,
				verificationStatus: verification.isValid ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
				accessedBy: studentId,
				accessedAt: new Date()
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to get student record: ${errorMessage}`);
		}
	}

	/**
	 * Validate academic record
	 */
	static validateRecord(record: AcademicRecord): void {
		if (!record.nim?.trim()) throw new Error('NIM is required');
		if (!record.name?.trim()) throw new Error('Name is required');
		if (!record.courses?.length) throw new Error('Courses are required');
		if (record.ipk < 0 || record.ipk > 4) throw new Error('IPK must be between 0-4');

		// Check IPK calculation
		const calculatedIPK = this.calculateIPK(record.courses);
		if (Math.abs(calculatedIPK - record.ipk) > 0.01) {
			throw new Error(`IPK mismatch: expected ${calculatedIPK.toFixed(2)}`);
		}
	}

	/**
	 * Calculate IPK
	 */
	static calculateIPK(courses: AcademicRecord['courses']): number {
		const gradePoints: Record<string, number> = {
			'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5,
			'C': 2.0, 'D': 1.0, 'E': 0.0
		};

		let totalPoints = 0;
		let totalCredits = 0;

		for (const course of courses) {
			const points = gradePoints[course.grade] || 0;
			totalPoints += points * course.credits;
			totalCredits += course.credits;
		}

		return totalCredits > 0 ? totalPoints / totalCredits : 0;
	}

	private static generateId(): string {
		return `record_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
	}
}