import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import db from '$lib/server/database';
import { CryptoService } from '$lib/services/crypto.service';
import { SignatureService } from '$lib/services/signature.service';
import { RSA, RSAUtils } from '$lib/cryptography/RSA';
import { SHA3 } from '$lib/cryptography/SHA3';
import type { Role } from '@prisma/client';

export const headActions = {
	/**
	 * Digitally sign academic record
	 */
	signRecord: async ({ request, locals }: RequestEvent) => {
		if (locals.user?.permissions.canSignRecords !== true) {
			return fail(403, { error: 'You do not have permission to sign records.' });
		}

		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			const userId = locals.user.user.id;

			if (!recordId) {
				return fail(400, { error: 'Record ID is required.' });
			}

			// Get head's private key
			const headUser = await db.user.findUnique({ where: { id: userId } });
			if (!headUser?.privateKey) {
				return fail(500, { error: 'Could not retrieve your private key for signing.' });
			}

			// Check direct access to record
			const directKey = await db.directKey.findUnique({
				where: { recordId_userId: { recordId, userId } }
			});

			if (!directKey) {
				return fail(403, { error: 'You do not have access to this record for signing.' });
			}

			// Get and decrypt record
			const record = await db.transkrip.findUnique({ 
				where: { id: recordId },
				include: { student: { select: { fullName: true } } }
			});
			if (!record) {
				return fail(404, { error: 'Academic record not found.' });
			}

			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, headUser.privateKey);
			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			// Create digital signature
			const newSignature = SignatureService.signAcademicRecord(
				decryptedRecord,
				headUser.privateKey,
				record.keyId
			);

			// Update record with signature
			await db.transkrip.update({
				where: { id: recordId },
				data: { digitalSignature: newSignature.signature }
			});

			const action = record.digitalSignature ? 'ditandatangani ulang' : 'ditandatangani';
			return { 
				success: true, 
				message: `Transkrip ${record.student.fullName} berhasil ${action}.` 
			};

		} catch (error: any) {
			console.error('Error signing record:', error);
			return fail(500, { error: 'An internal error occurred during signing.' });
		}
	},

	/**
	 * Remove digital signature from record
	 */
	removeSignature: async ({ request, locals }: RequestEvent) => {
		if (locals.user?.permissions.canSignRecords !== true) {
			return fail(403, { error: 'You do not have permission to manage signatures.' });
		}

		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;

			if (!recordId) {
				return fail(400, { error: 'Record ID is required.' });
			}

			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: { student: { select: { fullName: true, programStudi: true } } }
			});

			if (!record) {
				return fail(404, { error: 'Academic record not found.' });
			}

			// Check program ownership
			if (record.student.programStudi !== locals.user.user.programStudi) {
				return fail(403, { error: 'You can only manage signatures for your own study program.' });
			}

			if (!record.digitalSignature) {
				return fail(400, { error: 'This transcript is not signed yet.' });
			}

			// Remove signature
			await db.transkrip.update({
				where: { id: recordId },
				data: { digitalSignature: '' }
			});

			return { 
				success: true, 
				message: `Tanda tangan digital untuk transkrip ${record.student.fullName} berhasil dihapus.` 
			};

		} catch (error: any) {
			console.error('Error removing signature:', error);
			return fail(500, { error: 'An internal error occurred while removing signature.' });
		}
	},

	/**
	 * Delete transcript and all related data
	 */
	deleteTranscript: async ({ request, locals }: RequestEvent) => {
		if (locals.user?.user.role !== 'Kepala_Program_Studi') {
			return fail(403, { error: 'Only the Head of Study Program can delete transcripts.' });
		}

		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;

			if (!recordId) {
				return fail(400, { error: 'Record ID is required.' });
			}

			// Get record with student info
			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: {
					student: {
						select: { id: true, fullName: true, nim: true, programStudi: true }
					}
				}
			});

			if (!record) {
				return fail(404, { error: 'Transcript record not found.' });
			}

			// Check program ownership
			if (record.student.programStudi !== locals.user.user.programStudi) {
				return fail(403, { error: 'You can only delete transcripts from your own study program.' });
			}

			// Delete all related data in transaction
			await db.$transaction(async (tx) => {
				await tx.directKey.deleteMany({ where: { recordId } });
				await tx.secretShare.deleteMany({ where: { recordId } });
				await tx.transkrip.delete({ where: { id: recordId } });
			});

			return { 
				success: true, 
				message: `Transkrip ${record.student.fullName} (${record.student.nim}) berhasil dihapus beserta semua data terkait.` 
			};

		} catch (error: any) {
			console.error('Error deleting transcript:', error);
			
			if (error.code === 'P2025') {
				return fail(404, { error: 'Transcript record not found or already deleted.' });
			}
			
			return fail(500, { error: 'An internal error occurred during transcript deletion.' });
		}
	},

	/**
	 * Assign advisor to student
	 */
	assignAdvisor: async ({ request, locals }: RequestEvent) => {
		if (locals.user?.user.role !== 'Kepala_Program_Studi') {
			return fail(403, { error: 'Only the Head of Study Program can assign advisors.' });
		}

		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;
			const advisorId = formData.get('advisorId') as string;

			if (!studentId || !advisorId) {
				return fail(400, { error: 'Student ID and Advisor ID are required.' });
			}

			// Validate student belongs to head's program
			const student = await db.user.findUnique({ where: { id: studentId } });
			if (!student || student.programStudi !== locals.user.user.programStudi) {
				return fail(404, { error: 'Student not found or not in your study program.' });
			}

			// Update student's advisor
			await db.user.update({
				where: { id: studentId },
				data: { DosenId: advisorId }
			});

			return { 
				success: true, 
				message: `Advisor successfully assigned to student ${student.fullName}.` 
			};

		} catch (error: any) {
			console.error('Error assigning advisor:', error);
			return fail(500, { error: 'An internal error occurred.' });
		}
	},

	/**
	 * Register new user (student or advisor)
	 */
	registerUser: async ({ request, locals }: RequestEvent) => {
		if (locals.user?.user.role !== 'Kepala_Program_Studi') {
			return fail(403, { error: 'Only the Head of Study Program can register new users.' });
		}

		try {
			const formData = await request.formData();
			const username = formData.get('username') as string;
			const password = formData.get('password') as string;
			const fullName = formData.get('fullName') as string;
			const userType = formData.get('userType') as string;
			const role = formData.get('role') as string;
			const nim = formData.get('nim') as string | undefined;
			const advisorId = formData.get('advisorId') as string | undefined;

			// Basic validation
			if (!username || !password || !fullName || !userType || !role) {
				return fail(400, { error: 'Username, password, full name, and role are required.' });
			}

			// Role validation
			if (userType === 'dosen' && role !== 'Dosen_Wali') {
				return fail(400, { error: 'Invalid role for dosen user type.' });
			}

			if (userType === 'student' && role !== 'Mahasiswa') {
				return fail(400, { error: 'Invalid role for student user type.' });
			}

			// Student-specific validation
			if (userType === 'student') {
				if (!nim) {
					return fail(400, { error: 'NIM is required for new students.' });
				}

				// Validate NIM format
				const nimRegex = /^(135|182)\d{5}$/;
				if (!nimRegex.test(nim)) {
					return fail(400, { error: 'Invalid NIM format. Must be 135XXXXX (IF) or 182XXXXX (STI).' });
				}

				// Check if NIM already exists
				const existingNIM = await db.user.findFirst({ where: { nim } });
				if (existingNIM) {
					return fail(409, { error: 'NIM already exists. Please generate a new one.' });
				}
			}

			// Check username uniqueness
			const existingUser = await db.user.findUnique({ where: { username } });
			if (existingUser) {
				return fail(409, { error: 'Username already exists. Please choose a different username.' });
			}

			// Hash password and generate keys
			const passwordHash = Array.from(SHA3.sha256(password))
				.map(b => b.toString(16).padStart(2, '0'))
				.join('');

			const keyPair = RSA.generateKeyPair(2048);

			// Prepare user data
			const userData: any = {
				username,
				password: passwordHash,
				fullName,
				role: role as Role,
				publicKey: RSAUtils.publicKeyToHex(keyPair.publicKey),
				privateKey: RSAUtils.privateKeyToHex(keyPair.privateKey)
			};

			// Add student-specific fields
			if (userType === 'student') {
				userData.nim = nim;
				userData.programStudi = locals.user.user.programStudi;
				userData.DosenId = advisorId || null;
			}

			// Create user
			await db.user.create({ data: userData });

			const userTypeDisplay = userType === 'dosen' ? 'Dosen Wali' : 'Mahasiswa';
			const additionalInfo = userType === 'student' 
				? ` dengan NIM ${nim} di program ${locals.user.user.programStudi}`
				: '';

			return { 
				success: true, 
				message: `${userTypeDisplay} ${fullName} berhasil didaftarkan${additionalInfo}.` 
			};

		} catch (error: any) {
			console.error('Error registering user:', error);

			if (error.code === 'P2002') {
				if (error.meta?.target?.includes('username')) {
					return fail(409, { error: 'Username already exists.' });
				}
				if (error.meta?.target?.includes('nim')) {
					return fail(409, { error: 'NIM already exists.' });
				}
				return fail(409, { error: 'Data already exists.' });
			}
			
			return fail(500, { error: 'An internal error occurred during user registration.' });
		}
	},

	/**
	 * Delete user and cleanup related data
	 */
	deleteUser: async ({ request, locals }: RequestEvent) => {
		if (locals.user?.user.role !== 'Kepala_Program_Studi') {
			return fail(403, { error: 'Only the Head of Study Program can delete users.' });
		}

		try {
			const formData = await request.formData();
			const userId = formData.get('userId') as string;
			const userType = formData.get('userType') as string;

			if (!userId || !userType) {
				return fail(400, { error: 'User ID and user type are required.' });
			}

			// Get user info
			const userToDelete = await db.user.findUnique({ 
				where: { id: userId },
				include: {
					students: userType === 'advisor' ? { select: { fullName: true } } : undefined,
					records: userType === 'student' ? { select: { id: true } } : undefined
				}
			});

			if (!userToDelete) {
				return fail(404, { error: 'User not found.' });
			}

			// Safety checks
			if (userToDelete.role === 'Kepala_Program_Studi') {
				return fail(403, { error: 'Cannot delete another Head of Study Program.' });
			}

			if (userType === 'advisor' && userToDelete.role !== 'Dosen_Wali') {
				return fail(400, { error: 'User type mismatch: expected Dosen Wali.' });
			}

			if (userType === 'student' && userToDelete.role !== 'Mahasiswa') {
				return fail(400, { error: 'User type mismatch: expected Mahasiswa.' });
			}

			// Delete user and related data
			await db.$transaction(async (tx) => {
				if (userType === 'advisor') {
					// Remove advisor relationships
					await tx.user.updateMany({
						where: { DosenId: userId },
						data: { DosenId: null }
					});
					
					// Delete secret shares
					await tx.secretShare.deleteMany({
						where: { advisorId: userId }
					});
				} else if (userType === 'student') {
					// Delete student's access keys and records
					await tx.directKey.deleteMany({ where: { userId } });
					await tx.transkrip.deleteMany({ where: { studentId: userId } });
				}

				// Delete sessions and user
				await tx.session.deleteMany({ where: { userId } });
				await tx.user.delete({ where: { id: userId } });
			});

			const deletedInfo = userType === 'advisor' 
				? `${userToDelete.fullName} and removed advisor relationship from ${userToDelete.students?.length || 0} students`
				: `${userToDelete.fullName} and all related academic data`;

			return { 
				success: true, 
				message: `Successfully deleted ${deletedInfo}.` 
			};

		} catch (error: any) {
			console.error('Error deleting user:', error);
			
			if (error.code === 'P2003') {
				return fail(409, { error: 'Cannot delete user due to existing relationships. Please contact administrator.' });
			}
			
			return fail(500, { error: 'An internal error occurred during user deletion.' });
		}
	}
};