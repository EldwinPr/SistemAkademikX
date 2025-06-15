import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import db from '$lib/server/database';
import { AcademicService } from '$lib/services/academic.service';
import { CryptoService } from '$lib/services/crypto.service';
import { SignatureService } from '$lib/services/signature.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';
import type { Course, AcademicRecord } from '$lib/types/academic.types';

const VALID_GRADES = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'];

export const advisorActions = {
	/**
	 * Create new academic record for advisee student
	 */
	inputRecord: async ({ request, locals }: RequestEvent) => {
		// Permission check
		if (locals.user?.permissions.canCreateRecords !== true) {
			return fail(403, { error: 'You do not have permission to create records.' });
		}

		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;
			const aesKey = formData.get('aesKey') as string;

			// Basic validation
			if (!studentId || !aesKey) {
				return fail(400, { error: 'Student ID and AES Key are required.' });
			}
			
			if (aesKey.length !== 64) {
				return fail(400, { error: 'Invalid AES key format. Must be 64 hex characters.' });
			}
			
			// Validate student exists and is under this advisor
			const student = await db.user.findUnique({ where: { id: studentId } });
			if (!student) {
				return fail(404, { error: 'Student not found.' });
			}

			if (student.DosenId !== locals.user.user.id) {
				return fail(403, { error: 'You can only create records for your advisee students.' });
			}

			// Get program head
			const head = await db.user.findFirst({
				where: { role: 'Kepala_Program_Studi', programStudi: student.programStudi }
			});
			if (!head?.publicKey || !head?.privateKey) {
				return fail(500, { error: 'Program head keys not configured.' });
			}

			// Parse courses from form data
			const courses = parseCourseData(formData);
			if (courses.length === 0) {
				return fail(400, { error: 'At least one course is required.' });
			}

			// Validate courses
			const validation = validateCourses(courses);
			if (!validation.isValid) {
				return fail(400, { error: validation.error });
			}

			// Create academic record
			const recordData = { nim: student.nim!, name: student.fullName, courses };
			const allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' } });
			const userIdsForDirectAccess = { studentId: student.id, advisorId: student.DosenId!, headId: head.id };
			
			// Get public keys
			const usersForKeys = await db.user.findMany({
				where: { id: { in: Object.values(userIdsForDirectAccess) } }
			});
			const publicKeys: Record<string, string> = {};
			usersForKeys.forEach(u => {
				if (u.publicKey) publicKeys[u.id] = u.publicKey;
			});

			// Create encrypted record and keys
			const { encryptedRecord, directKeys, secretShares } = AcademicService.createRecord(
				recordData,
				locals.user.user.id,
				aesKey,
				allAdvisors.map(a => a.id),
				userIdsForDirectAccess,
				publicKeys
			);
			
			// Save to database
			await db.$transaction([
				db.transkrip.create({ data: encryptedRecord }),
				db.directKey.createMany({ data: directKeys }),
				db.secretShare.createMany({ data: secretShares })
			]);

			return { 
				success: true, 
				message: `Academic record for ${student.fullName} created successfully with ${courses.length} courses.` 
			};

		} catch (error: any) {
			console.error('Error creating record:', error);
			return fail(500, { error: 'An internal error occurred while creating the record.' });
		}
	},

	/**
	 * View academic record with direct access
	 */
	viewRecord: async ({ request, locals }: RequestEvent) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}
		
		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			const userId = locals.user.user.id;

			if (!recordId) {
				return fail(400, { error: 'Record ID is required.' });
			}

			// Get user's private key
			const fullUser = await db.user.findUnique({ where: { id: userId } });
			if (!fullUser?.privateKey) {
				return fail(500, { error: 'Private key not found.' });
			}

			// Check direct access
			const directKey = await db.directKey.findUnique({
				where: { recordId_userId: { recordId, userId } }
			});

			if (!directKey) {
				// Check if advisor needs group decryption
				const record = await db.transkrip.findUnique({ where: { id: recordId } });
				const student = await db.user.findUnique({ where: { id: record?.studentId } });
				
				if (locals.user.user.role === 'Dosen_Wali' && student?.DosenId !== userId) {
					return fail(403, { message: 'Group decryption required to view this record.', groupRequired: true });
				}
				return fail(403, { error: 'You do not have access to this record.' });
			}

			// Decrypt record
			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, fullUser.privateKey);
			
			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: { student: { select: { programStudi: true } } }
			});
			if (!record) return fail(404, { error: 'Record not found.' });

			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			// Verify signature
			const verification = await verifyRecordSignature(decryptedRecord, record);
			
			return { success: true, record: decryptedRecord, verification };

		} catch (error: any) {
			console.error('Error viewing record:', error);
			return fail(500, { error: 'Failed to view record.' });
		}
	},

	/**
	 * Decrypt record using group consensus (3+ advisors)
	 */
	groupDecrypt: async ({ request, locals }: RequestEvent) => {
		if (locals.user?.permissions.canParticipateInGroupDecryption !== true) {
			return fail(403, { error: 'Only advisors can participate in group decryption.' });
		}

		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			
			// Get the 3 shares
			const shares = [
				{ shareX: parseInt(formData.get('share1X') as string), shareY: formData.get('share1Y') as string },
				{ shareX: parseInt(formData.get('share2X') as string), shareY: formData.get('share2Y') as string },
				{ shareX: parseInt(formData.get('share3X') as string), shareY: formData.get('share3Y') as string }
			];

			// Validate inputs
			if (!recordId || shares.some(s => isNaN(s.shareX) || !s.shareY)) {
				return fail(400, { error: 'Record ID and all 3 shares are required.' });
			}

			// Get record and prime
			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: { 
					student: { select: { programStudi: true, fullName: true, nim: true } },
					shares: { select: { prime: true }, take: 1 }
				}
			});

			if (!record?.shares?.length) {
				return fail(400, { error: 'No shares found for this record.' });
			}

			const prime = record.shares[0].prime;

			// Reconstruct AES key
			let aesKey: string;
			try {
				aesKey = CryptoService.reconstructKeyFromShares(shares, prime);
			} catch (error) {
				return fail(400, { error: 'Failed to reconstruct key. Please verify all shares are correct.' });
			}

			// Decrypt record
			let decryptedRecord: AcademicRecord;
			try {
				decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);
			} catch (error) {
				return fail(400, { error: 'Failed to decrypt record. The reconstructed key may be incorrect.' });
			}

			// Verify signature
			const verification = await verifyRecordSignature(decryptedRecord, record);

			return { 
				groupDecryptSuccess: true, 
				decryptedData: decryptedRecord,
				verificationStatus: verification.isValid ? 'VERIFIED' : 'UNVERIFIED',
				verificationMessage: verification.message,
				studentInfo: {
					name: record.student.fullName,
					nim: record.student.nim
				},
				message: `Group decryption successful for ${record.student.fullName} (${record.student.nim}).`
			};

		} catch (error: any) {
			console.error('Group decrypt error:', error);
			return fail(500, { error: 'Group decryption failed.' });
		}
	}
};

/**
 * Parse course data from form submission
 */
function parseCourseData(formData: FormData): Course[] {
	const courses: Course[] = [];
	let courseIndex = 0;
	
	while (true) {
		const code = formData.get(`courses[${courseIndex}][code]`) as string;
		const name = formData.get(`courses[${courseIndex}][name]`) as string;
		const credits = formData.get(`courses[${courseIndex}][credits]`) as string;
		const grade = formData.get(`courses[${courseIndex}][grade]`) as string;
		
		if (!code || !name || !credits || !grade) break;
		
		courses.push({
			code: code.trim(),
			name: name.trim(),
			credits: parseInt(credits, 10),
			grade: grade.trim()
		});
		
		courseIndex++;
	}
	
	return courses;
}

/**
 * Validate course data
 */
function validateCourses(courses: Course[]): { isValid: boolean; error?: string } {
	for (let i = 0; i < courses.length; i++) {
		const course = courses[i];
		
		if (!course.code || !course.name) {
			return { isValid: false, error: `Course ${i + 1}: Code and name are required.` };
		}
		
		if (isNaN(course.credits) || course.credits < 1 || course.credits > 6) {
			return { isValid: false, error: `Course ${i + 1}: Credits must be between 1 and 6.` };
		}
		
		if (!VALID_GRADES.includes(course.grade)) {
			return { isValid: false, error: `Course ${i + 1}: Invalid grade.` };
		}
	}

	const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
	if (totalCredits > 24) {
		return { isValid: false, error: `Total credits (${totalCredits}) exceeds maximum (24 SKS).` };
	}

	return { isValid: true };
}

/**
 * Verify record signature
 */
async function verifyRecordSignature(decryptedRecord: AcademicRecord, record: any) {
	try {
		const head = await db.user.findFirst({
			where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi }
		});
		
		if (!head?.publicKey) {
			return { isValid: false, message: 'Program head public key not found' };
		}

		const signature = {
			signature: record.digitalSignature,
			algorithm: 'RSA-SHA3' as const,
			keyId: record.keyId,
			timestamp: record.createdAt,
			dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
		};
		
		return SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);
	} catch (error) {
		return { isValid: false, message: 'Signature verification failed' };
	}
}