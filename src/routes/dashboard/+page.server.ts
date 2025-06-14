import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/database';
import { AcademicService } from '$lib/services/academic.service';
import { CryptoService } from '$lib/services/crypto.service';
import { PDFService } from '$lib/services/pdf.service';
import { SignatureService } from '$lib/services/signature.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';
import type { AcademicRecord, Course } from '$lib/types/academic.types';
import type { User } from '$lib/types/auth.types';
import { RSA, RSAUtils } from '$lib/cryptography/RSA';
import { SHA3 } from '$lib/cryptography/SHA3';
import type { Role } from '@prisma/client';
import type { DigitalSignature } from '$lib/types/crypto.types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth/login');

	const { user, permissions } = locals.user;
	const { role, programStudi, id: userId } = user;

	const dashboardData = {
		userContext: locals.user,
		myRecords: [] as any[],
		adviseeStudents: [] as User[],
		allRecords: [] as any[],
		allAdvisors: [] as User[],
		allStudents: [] as User[],
		programRecords: [] as any[],
		headKeys: null as any
	};

	try {
		if (role === 'Mahasiswa') {
			dashboardData.myRecords = await db.transkrip.findMany({
				where: { studentId: userId },
				orderBy: { createdAt: 'desc' }
			});
		} else if (role === 'Dosen_Wali') {
			const studentsWithCounts = await db.user.findMany({
				where: { DosenId: userId, role: 'Mahasiswa' },
				include: {
				_count: {
					select: { records: true }
				}
			}
			});

			dashboardData.adviseeStudents = studentsWithCounts.map(student => ({
				...student,
				hasTranscript: student._count.records > 0
			}));

			dashboardData.allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' } });
			
			dashboardData.allRecords = await db.transkrip.findMany({
				orderBy: { createdAt: 'desc' },
				include: { student: { select: { fullName: true, nim: true } } }
			});
		} else if (role === 'Kepala_Program_Studi') {
 
			dashboardData.programRecords = await db.transkrip.findMany({
				where: { student: { programStudi } },
				orderBy: { createdAt: 'desc' },
				include: { student: { select: { fullName: true, nim: true } } }
			});

			dashboardData.allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' } });
			dashboardData.allStudents = await db.user.findMany({ where: { role: 'Mahasiswa', programStudi } });

			dashboardData.headKeys = {
				publicKey: user.publicKey
			};
		}

		return dashboardData;
	} catch (error) {
		console.error('Dashboard load error:', error);
		return {
			...dashboardData,
			error: 'Failed to load dashboard data.'
		};
	}
};

export const actions: Actions = {
	inputRecord: async ({ request, locals }) => {
		if (locals.user?.permissions.canCreateRecords !== true) {
			return fail(403, { error: 'Forbidden: You do not have permission to create records.' });
		}

		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;
			const aesKey = formData.get('aesKey') as string;

			// Validate input
			if (!studentId || !aesKey) {
				return fail(400, { error: 'Student ID and AES Key are required.' });
			}
			if (aesKey.length !== 64) {
				// AES-256 key should be 64 hex characters
				return fail(400, { error: 'Invalid AES key format. Must be a 256-bit hex string (64 characters).' });
			}
			
			const student = await db.user.findUnique({ where: { id: studentId } });
			if (!student) {
				return fail(404, { error: 'Student not found.' });
			}

			const head = await db.user.findFirst({
				where: { role: 'Kepala_Program_Studi', programStudi: student.programStudi }
			});
			if (!head || !head.publicKey || !head.privateKey) {
				return fail(500, { error: 'Program head or their keys are not configured.' });
			}

			// Parse courses dynamically - no fixed number required
			const courses: Course[] = [];
			let courseIndex = 0;
			
			// Keep looking for courses until we don't find any more
			while (true) {
				const code = formData.get(`courses[${courseIndex}][code]`) as string;
				const name = formData.get(`courses[${courseIndex}][name]`) as string;
				const credits = formData.get(`courses[${courseIndex}][credits]`) as string;
				const grade = formData.get(`courses[${courseIndex}][grade]`) as string;
				
				// If any required field is missing, stop parsing
				if (!code || !name || !credits || !grade) {
					break;
				}
				
				// Add the course
				courses.push({
					code: code.trim(),
					name: name.trim(),
					credits: parseInt(credits, 10),
					grade: grade.trim()
				});
				
				courseIndex++;
			}

			// Validate that we have at least one course
			if (courses.length === 0) {
				return fail(400, { error: 'At least one course is required.' });
			}

			// Validate course data
			for (let i = 0; i < courses.length; i++) {
				const course = courses[i];
				
				if (!course.code || !course.name) {
					return fail(400, { error: `Course ${i + 1}: Code and name are required.` });
				}
				
				if (isNaN(course.credits) || course.credits < 1 || course.credits > 6) {
					return fail(400, { error: `Course ${i + 1}: Credits must be between 1 and 6.` });
				}
				
				const validGrades = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'];
				if (!validGrades.includes(course.grade)) {
					return fail(400, { error: `Course ${i + 1}: Invalid grade. Must be one of: ${validGrades.join(', ')}.` });
				}
			}

			// Check total credits (optional validation)
			const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
			if (totalCredits > 24) {
				return fail(400, { error: `Total credits (${totalCredits}) exceeds maximum allowed (24 SKS).` });
			}

			const recordData = { nim: student.nim!, name: student.fullName, courses };

			const allAdvisors = await db.user.findMany({ where: { role: 'Dosen_Wali' } });
			const userIdsForDirectAccess = { studentId: student.id, advisorId: student.DosenId!, headId: head.id };
			
			const usersForKeys = await db.user.findMany({
				where: { id: { in: Object.values(userIdsForDirectAccess) } }
			});

			const publicKeys: Record<string, string> = {};
			usersForKeys.forEach(u => {
				if (u.publicKey) publicKeys[u.id] = u.publicKey;
			});

			publicKeys.headPrivateKey = head.privateKey;

			const { encryptedRecord, directKeys, secretShares } = AcademicService.createRecord(
				recordData,
				locals.user.user.id,
				aesKey,
				allAdvisors.map(a => a.id),
				userIdsForDirectAccess,
				publicKeys
			);
			
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
			console.error("Error creating record:", error);
			return fail(500, { error: error.message || 'An internal error occurred.' });
		}
	},

	viewRecord: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/auth/login');
		
		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;

			const userId = locals.user.user.id;
			const fullUser = await db.user.findUnique({ where: { id: userId } });

			if (!fullUser?.privateKey) {
				return fail(500, { error: 'Private key for the current user not found.' });
			}

			const userPrivateKey = fullUser.privateKey;

			if (!recordId || !userPrivateKey) {
				return fail(400, { error: 'Record ID and user credentials are required.' });
			}
			
			const directKey = await db.directKey.findUnique({
				where: { recordId_userId: { recordId, userId } }
			});

			if (!directKey) {
				const record = await db.transkrip.findUnique({ where: { id: recordId } });
				const student = await db.user.findUnique({ where: { id: record?.studentId } });
				
				if (locals.user.user.role === 'Dosen_Wali' && student?.DosenId !== userId) {
					return fail(403, { message: 'Group decryption required to view this record.', groupRequired: true });
				}
				return fail(403, { error: 'Access Denied: You do not have direct access to this record.' });
			}

			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, userPrivateKey);
			
			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: { student: { select: { programStudi: true } } }
			});
			if (!record) return fail(404, { error: 'Record not found.' });

			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			const head = await db.user.findFirst({
				where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi! }
			});
			if (!head?.publicKey) return fail(500, { error: 'Could not find public key to verify signature.' });
			
			const signature = {
				signature: record.digitalSignature,
				algorithm: 'RSA-SHA3' as const,
				keyId: record.keyId,
				timestamp: record.createdAt,
				dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
			};

			const verification = SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);
			
			return { success: true, record: decryptedRecord, verification };

		} catch (error: any) {
			console.error("Error viewing record:", error);
			return fail(500, { error: error.message || 'Failed to view record.' });
		}
	},
	
	viewMyTranscript: async ({ locals }) => {
		if (!locals.user) throw redirect(302, '/auth/login');
		
		const userId = locals.user.user.id;
		const userRole = locals.user.user.role;
		
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

			// Find student's academic record
			const record = await db.transkrip.findFirst({
				where: { studentId: userId },
				include: { student: { select: { programStudi: true } } },
				orderBy: { createdAt: 'desc' }
			});

			if (!record) {
				return fail(404, { error: 'No academic record found. Your advisor may not have input your data yet.' });
			}

			const directKey = await db.directKey.findUnique({
				where: { 
					recordId_userId: { 
						recordId: record.id, 
						userId: userId 
					} 
				}
			});

			if (!directKey) {
				return fail(403, { error: 'Access key not found for your record. Please contact administrator.' });
			}

			// Decrypt AES key using private key
			const aesKey = CryptoService.decryptDirectAccessKey(
				directKey.encryptedAESKey, 
				fullUser.privateKey
			);
			
			// Decrypt academic record
			const decryptedRecord = CryptoService.decryptAcademicRecord(
				record.encryptedData, 
				aesKey
			);

			// Get program head's public key for signature verification
			const head = await db.user.findFirst({
				where: { 
					role: 'Kepala_Program_Studi', 
					programStudi: record.student.programStudi! 
				},
				select: { publicKey: true, fullName: true }
			});

			if (!head?.publicKey) {
				return fail(500, { error: 'Program head public key not found for signature verification.' });
			}

			// Verify digital signature
			const signature = {
				signature: record.digitalSignature,
				algorithm: 'RSA-SHA3' as const,
				keyId: record.keyId,
				timestamp: record.createdAt,
				dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
			};

			const verification = SignatureService.verifyAcademicRecord(
				decryptedRecord, 
				signature, 
				head.publicKey
			);

			// Prepare transcript data with verification status
			const transcript = {
				...decryptedRecord,
				verificationStatus: verification.isValid ? 'VERIFIED' : 'UNVERIFIED',
				verificationMessage: verification.message,
				signedBy: head.fullName,
				recordCreatedAt: record.createdAt
			};

			return { 
				myTranscriptSuccess: true, 
				myTranscript: transcript,
				message: 'Your transcript has been loaded successfully!' 
			};

		} catch (error: any) {
			console.error("Error loading student transcript:", error);
			return fail(500, { 
				error: error.message || 'An unexpected error occurred while loading your transcript.' 
			});
		}
	},

	groupDecrypt: async ({ request, locals }) => {
		if (locals.user?.permissions.canParticipateInGroupDecryption !== true) {
			return fail(403, { error: 'Forbidden: Only advisors can participate in group decryption.' });
		}

		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			
			// Get individual share data from form
			const advisorId1 = formData.get('advisorId1') as string;
			const shareY1 = formData.get('shareY1') as string;
			const advisorId2 = formData.get('advisorId2') as string;
			const shareY2 = formData.get('shareY2') as string;
			const advisorId3 = formData.get('advisorId3') as string;
			const shareY3 = formData.get('shareY3') as string;

			// Validate required fields
			if (!recordId || !advisorId1 || !shareY1 || !advisorId2 || !shareY2 || !advisorId3 || !shareY3) {
				return fail(400, { error: 'Record ID and all 3 advisor shares are required.' });
			}

			// Get database shares to validate 
			const dbShares = await db.secretShare.findMany({
				where: { 
					recordId,
					advisorId: { in: [advisorId1, advisorId2, advisorId3] }
				}
			});

			if (dbShares.length < 3) {
				return fail(400, { error: `Only found ${dbShares.length} shares in database. Need 3 shares for reconstruction.` });
			}

			const shareMap = new Map(dbShares.map(s => [s.advisorId, s]));
			
			const submittedShares = [
				{ advisorId: advisorId1, shareY: shareY1 },
				{ advisorId: advisorId2, shareY: shareY2 },
				{ advisorId: advisorId3, shareY: shareY3 }
			];

			const validatedShares: { shareX: number; shareY: string }[] = [];

			for (const submitted of submittedShares) {
				const dbShare = shareMap.get(submitted.advisorId);
				
				if (!dbShare) {
					return fail(400, { error: `No share found for advisor ${submitted.advisorId} in this record.` });
				}
				
				if (dbShare.shareY !== submitted.shareY) {
					return fail(400, { error: `Invalid share provided for advisor ${submitted.advisorId}. Share does not match database.` });
				}
				
				validatedShares.push({
					shareX: dbShare.shareX,
					shareY: dbShare.shareY
				});
			}

			const prime = dbShares[0].prime; // All shares have same prime

			// Reconstruct AES key using validated shares
			const aesKey = CryptoService.reconstructKeyFromShares(validatedShares, prime);

			// Get and decrypt the academic record
			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: { student: { select: { programStudi: true, fullName: true, nim: true } } }
			});

			if (!record) {
				return fail(404, { error: 'Academic record not found.' });
			}

			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			// Verify digital signature
			const head = await db.user.findFirst({
				where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi! }
			});

			if (!head?.publicKey) {
				return fail(500, { error: 'Program head public key not found for signature verification.' });
			}

			const signature = {
				signature: record.digitalSignature,
				algorithm: 'RSA-SHA3' as const,
				keyId: record.keyId,
				timestamp: record.createdAt,
				dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
			};

			const verification = SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);

			// Return data in format expected by component
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
			console.error("Group decrypt error:", error);
			return fail(500, { error: error.message || 'Group decryption failed due to server error.' });
		}
	},
	generatePdf: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/auth/login');

		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			const shouldEncrypt = formData.get('encrypt') === 'true';
			const rc4Key = formData.get('rc4Key') as string | undefined;

			if (!recordId) {
				return fail(400, { error: 'Record ID is required.' });
			}

			if (shouldEncrypt && !rc4Key) {
				return fail(400, { error: 'RC4 key is required for encryption.' });
			}

			const userId = locals.user.user.id;
			const fullUser = await db.user.findUnique({ 
				where: { id: userId },
				select: { privateKey: true }
			});

			if (!fullUser?.privateKey) {
				return fail(500, { error: 'Private key not found.' });
			}

			// Get direct access key
			const directKey = await db.directKey.findUnique({
				where: { recordId_userId: { recordId, userId } }
			});

			if (!directKey) {
				return fail(403, { error: 'Access denied to this record.' });
			}

			// Decrypt record
			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, fullUser.privateKey);
			
			const record = await db.transkrip.findUnique({
				where: { id: recordId },
				include: { student: { select: { programStudi: true } } }
			});

			if (!record) return fail(404, { error: 'Record not found.' });

			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			// Get signature info
			const head = await db.user.findFirst({
				where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi! }
			});

			if (!head?.publicKey) return fail(500, { error: 'Program head public key not found.' });

			// Create signature data for PDF
			const signatureData = {
				algorithm: 'RSA-SHA3',
				keyId: record.keyId,
				timestamp: record.createdAt,
				signature: record.digitalSignature,
				dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord)),
				signedBy: head.fullName,
				status: 'SIGNED'
			};

			// Generate PDF transcript
			const transcript = PDFService.generateTranscript(
				decryptedRecord, 
				signatureData,
				{
					includeSignature: true,
					includeWatermark: true,
					headerText: 'INSTITUT TEKNOLOGI BANDUNG'
				},
				locals.user.user.fullName
			);

			if (!transcript.fileData) {
				return fail(500, { error: 'Failed to generate PDF.' });
			}

			let finalFileData = transcript.fileData;
			let finalFileName = transcript.fileName;

			// Encrypt if requested
			if (shouldEncrypt && rc4Key) {
				const encryptedResult = PDFService.encryptPDF(finalFileData, finalFileName, rc4Key);
				finalFileData = encryptedResult.encryptedData;
				finalFileName = encryptedResult.fileName;
				
				// Update transcript object to reflect encryption
				transcript.isEncrypted = true;
				transcript.fileName = finalFileName;
				transcript.fileData = finalFileData;
			}

			return new Response(finalFileData, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="${finalFileName}"`,
				},
			});

		} catch (error: any) {
			console.error("Error generating PDF:", error);
			return fail(500, { error: error.message || 'Failed to generate PDF.' });
		}
	},
	decryptPdf: async ({ request }) => {
		try {
			const formData = await request.formData();
			const encryptedFile = formData.get('pdfFile') as File;
			const rc4Key = formData.get('decryptKey') as string;

			if (!encryptedFile || !rc4Key) {
				return fail(400, { error: 'Encrypted file and RC4 key are required.' });
			}

			const encryptedBytes = new Uint8Array(await encryptedFile.arrayBuffer());
			const result = PDFService.decryptPDF(encryptedBytes, rc4Key, encryptedFile.name);

			if (!result.success || !result.decryptedData) {
				return fail(400, { error: result.message || 'Decryption failed.' });
			}

			return new Response(result.decryptedData, {
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="${result.fileName}"`,
				},
			});

		} catch (error: any) {
			console.error("Error decrypting PDF:", error);
			return fail(500, { error: error.message || 'Failed to decrypt PDF.' });
		}
	},	
	signRecord: async ({ request, locals }) => {
		if (locals.user?.permissions.canSignRecords !== true) {
			return fail(403, { error: 'Forbidden: You do not have permission to sign records.' });
		}

		try {
			const formData = await request.formData();
			const recordId = formData.get('recordId') as string;
			const userId = locals.user.user.id;

			const headUser = await db.user.findUnique({ where: { id: userId } });
			if (!headUser?.privateKey) {
				return fail(500, { error: 'Could not retrieve your private key for signing.' });
			}

			const directKey = await db.directKey.findUnique({
				where: { recordId_userId: { recordId, userId } }
			});

			if (!directKey) {
				return fail(403, { error: 'You do not have direct access to decrypt this record for re-signing.' });
			}

			const record = await db.transkrip.findUnique({ where: { id: recordId } });
			if (!record) {
				return fail(404, { error: 'Academic record not found.' });
			}

			const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, headUser.privateKey);
			const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

			const newSignature = SignatureService.signAcademicRecord(
				decryptedRecord,
				headUser.privateKey,
				record.keyId // Use existing keyId
			);

			await db.transkrip.update({
				where: { id: recordId },
				data: {
					digitalSignature: newSignature.signature
				}
			});

			return { success: true, message: 'Record has been successfully re-signed.' };

		} catch (error: any) {
			console.error("Error re-signing record:", error);
			return fail(500, { error: error.message || 'An internal error occurred during re-signing.' });
		}
	},

	assignAdvisor: async ({ request, locals }) => {
		if (locals.user?.user.role !== 'Kepala_Program_Studi') {
			return fail(403, { error: 'Forbidden: Only the Head of Study Program can assign advisors.' });
		}

		try {
			const formData = await request.formData();
			const studentId = formData.get('studentId') as string;
			const advisorId = formData.get('advisorId') as string;
			const headProgramStudi = locals.user.user.programStudi;

			if (!studentId || !advisorId) {
				return fail(400, { error: 'Student ID and Advisor ID are required.' });
			}

			const student = await db.user.findUnique({ where: { id: studentId } });
			if (!student || student.programStudi !== headProgramStudi) {
				return fail(404, { error: `Student not found or not in your study program.` });
			}

			await db.user.update({
				where: { id: studentId },
				data: {
					DosenId: advisorId
				}
			});

			return { success: true, message: `Advisor successfully assigned to student ${student.fullName}.` };

		} catch (error: any) {
			console.error("Error assigning advisor:", error);
			return fail(500, { error: error.message || 'An internal error occurred.' });
		}
	},

	registerUser: async ({ request, locals }) => {
		if (locals.user?.user.role !== 'Kepala_Program_Studi') {
			return fail(403, { error: 'Forbidden: Only the Head of Study Program can register new users.' });
		}

		try {
			const formData = await request.formData();
			const username = formData.get('username') as string;
			const password = formData.get('password') as string;
			const fullName = formData.get('fullName') as string;
			const role = formData.get('role') as Role;
			const nim = formData.get('nim') as string | undefined;

			if (!username || !password || !fullName || !role) {
				return fail(400, { error: 'Username, password, full name, and role are required.' });
			}

			if (role === 'Mahasiswa' && !nim) {
				return fail(400, { error: 'NIM is required for new students.' });
			}

			const passwordHash = Array.from(SHA3.sha256(password))
				.map(b => b.toString(16).padStart(2, '0'))
				.join('');

			const keyPair = RSA.generateKeyPair(2048);

			await db.user.create({
				data: {
					username,
					password: passwordHash,
					fullName,
					role,
					nim: role === 'Mahasiswa' ? nim : null,
					programStudi: role === 'Mahasiswa' ? locals.user.user.programStudi : null, // Students get the head's program
					publicKey: RSAUtils.publicKeyToHex(keyPair.publicKey),
					privateKey: RSAUtils.privateKeyToHex(keyPair.privateKey)
				}
			});

			return { success: true, message: `User ${fullName} registered successfully.` };

		} catch (error: any) {
			console.error("Error registering user:", error);

			if (error.code === 'P2002') {
				return fail(409, { error: 'Username already exists.' });
			}
			return fail(500, { error: error.message || 'An internal error occurred during user registration.' });
		}
	}
};