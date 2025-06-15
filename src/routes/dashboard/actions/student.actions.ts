import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import db from '$lib/server/database';
import { CryptoService } from '$lib/services/crypto.service';
import { SignatureService } from '$lib/services/signature.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';
import type { AcademicRecord } from '$lib/types/academic.types';

interface TranscriptResult {
	myTranscriptSuccess: true;
	myTranscript: AcademicRecord & {
		verificationStatus: 'VERIFIED' | 'UNVERIFIED';
		verificationMessage: string;
		signedBy: string;
		recordCreatedAt: Date;
	};
	message: string;
}

export const studentActions = {
	/**
	 * View student's own transcript with signature verification
	 */
	viewMyTranscript: async ({ locals }: RequestEvent) => {
		// Authentication check
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}
		
		const userId = locals.user.user.id;
		const userRole = locals.user.user.role;
		
		// Role validation - only students can use this action
		if (userRole !== 'Mahasiswa') {
			return fail(403, { error: 'Only students can view their own transcript.' });
		}
		
		try {
			// Get user's private key for decryption
			const fullUser = await db.user.findUnique({ 
				where: { id: userId },
				select: { privateKey: true }
			});
			
			if (!fullUser?.privateKey) {
				return fail(500, { error: 'Your private key was not found. Please contact administrator.' });
			}

			// Find student's most recent academic record
			const record = await db.transkrip.findFirst({
				where: { studentId: userId },
				include: { student: { select: { programStudi: true } } },
				orderBy: { createdAt: 'desc' }
			});

			if (!record) {
				return fail(404, { error: 'No academic record found. Your advisor may not have input your data yet.' });
			}

			// Get direct access key
			const directKey = await db.directKey.findUnique({
				where: { recordId_userId: { recordId: record.id, userId } }
			});

			if (!directKey) {
				return fail(403, { error: 'Access key not found for your record. Please contact administrator.' });
			}

			// Decrypt record
			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, fullUser.privateKey);
			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			// Verify signature
			const { status, message, signedBy } = await verifySignature(decryptedRecord, record);

			const transcript = {
				...decryptedRecord,
				verificationStatus: status,
				verificationMessage: message,
				signedBy,
				recordCreatedAt: record.createdAt
			};

			return { 
				myTranscriptSuccess: true, 
				myTranscript: transcript,
				message: 'Your transcript has been loaded successfully!' 
			} as TranscriptResult;

		} catch (error: any) {
			console.error('Error loading student transcript:', error);
			return fail(500, { 
				error: 'An unexpected error occurred while loading your transcript.' 
			});
		}
	}
};

/**
 * Verify transcript signature
 */
async function verifySignature(decryptedRecord: AcademicRecord, originalRecord: any) {
	try {
		// Get program head's public key
		const head = await db.user.findFirst({
			where: { 
				role: 'Kepala_Program_Studi', 
				programStudi: originalRecord.student.programStudi 
			},
			select: { publicKey: true, fullName: true }
		});

		if (!head?.publicKey) {
			return {
				status: 'UNVERIFIED' as const,
				message: 'Program head public key not found',
				signedBy: 'Not available'
			};
		}

		// Check if record is signed
		if (!originalRecord.digitalSignature || originalRecord.digitalSignature.trim() === '') {
			return {
				status: 'UNVERIFIED' as const,
				message: 'This transcript is awaiting digital signature approval from the Head of Study Program',
				signedBy: 'Pending approval'
			};
		}

		// Verify signature
		const signature = {
			signature: originalRecord.digitalSignature,
			algorithm: 'RSA-SHA3' as const,
			keyId: originalRecord.keyId,
			timestamp: originalRecord.createdAt,
			dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
		};

		const verification = SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);

		return {
			status: verification.isValid ? 'VERIFIED' as const : 'UNVERIFIED' as const,
			message: verification.message,
			signedBy: verification.isValid ? head.fullName : 'Verification failed'
		};

	} catch (error) {
		console.error('Signature verification error:', error);
		return {
			status: 'UNVERIFIED' as const,
			message: 'Signature verification encountered an error',
			signedBy: 'Verification error'
		};
	}
}