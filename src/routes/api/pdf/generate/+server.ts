// src/routes/api/pdf/generate/+server.ts - Fixed version
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { CryptoService } from '$lib/services/crypto.service';
import { PDFService } from '$lib/services/pdf.service';
import { SignatureService } from '$lib/services/signature.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';

export const POST: RequestHandler = async ({ locals, request }) => {
	// Check authentication first
	if (!locals.user) {
		throw error(401, 'Unauthorized: Please log in to generate PDF');
	}

	try {
		console.log('PDF generation request received');
		
		// Parse form data with error handling
		let formData: FormData;
		try {
			formData = await request.formData();
		} catch (parseError) {
			console.error('Failed to parse form data:', parseError);
			throw error(400, 'Invalid request format');
		}

		const recordId = formData.get('recordId') as string;
		const shouldEncrypt = formData.get('encrypt') === 'true';
		const rc4Key = formData.get('rc4Key') as string | undefined;

		console.log('PDF Generation params:', { 
			recordId, 
			shouldEncrypt, 
			hasKey: !!rc4Key,
			userId: locals.user.user.id 
		});

		// Validate required parameters
		if (!recordId) {
			throw error(400, 'Record ID is required');
		}

		const userId = locals.user.user.id;
		
		// Get user's private key
		const fullUser = await db.user.findUnique({ 
			where: { id: userId },
			select: { privateKey: true, fullName: true }
		});

		if (!fullUser?.privateKey) {
			console.error('Private key not found for user:', userId);
			throw error(500, 'User private key not found');
		}

		// Check direct access to record
		const directKey = await db.directKey.findUnique({
			where: { recordId_userId: { recordId, userId } }
		});

		if (!directKey) {
			console.error('Direct access denied for user:', userId, 'record:', recordId);
			throw error(403, 'Access denied to this record');
		}

		// Decrypt AES key
		let aesKey: string;
		try {
			aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, fullUser.privateKey);
		} catch (decryptError) {
			console.error('Failed to decrypt AES key:', decryptError);
			throw error(500, 'Failed to decrypt access key');
		}
		
		// Get academic record
		const record = await db.transkrip.findUnique({
			where: { id: recordId },
			include: { 
				student: { 
					select: { 
						programStudi: true, 
						fullName: true, 
						nim: true 
					} 
				} 
			}
		});

		if (!record) {
			throw error(404, 'Academic record not found');
		}

		// Decrypt academic data
		let decryptedRecord;
		try {
			decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);
		} catch (decryptError) {
			console.error('Failed to decrypt academic record:', decryptError);
			throw error(500, 'Failed to decrypt academic data');
		}

		// Get program head for signature verification
		const head = await db.user.findFirst({
			where: { 
				role: 'Kepala_Program_Studi', 
				programStudi: record.student.programStudi! 
			},
			select: { 
				publicKey: true, 
				fullName: true 
			}
		});

		if (!head?.publicKey) {
			throw error(500, 'Program head public key not found');
		}

		// Verify signature
		const signature = {
			signature: record.digitalSignature,
			algorithm: 'RSA-SHA3' as const,
			keyId: record.keyId,
			timestamp: record.createdAt,
			dataHash: SHA3Utils.toHex(SHA3Utils.hashAcademicRecord(decryptedRecord))
		};

		const verification = SignatureService.verifyAcademicRecord(decryptedRecord, signature, head.publicKey);

		// Create signature data for PDF
		const signatureData = {
			signedBy: head.fullName,
			status: verification.isValid ? 'TERVERIFIKASI' : 'TIDAK VALID',
			signature: record.digitalSignature,
			timestamp: record.createdAt
		};

		// Generate PDF transcript
		let transcript;
		try {
			transcript = PDFService.generateTranscript(
				decryptedRecord, 
				signatureData,
				{
					includeSignature: true,
					includeWatermark: true,
					headerText: 'INSTITUT TEKNOLOGI BANDUNG'
				},
				fullUser.fullName
			);
		} catch (pdfError) {
			console.error('PDF generation failed:', pdfError);
			throw error(500, 'Failed to generate PDF content');
		}

		if (!transcript.fileData) {
			throw error(500, 'PDF generation returned empty data');
		}

		let finalFileData = transcript.fileData;
		let finalFileName = transcript.fileName;

		// Encrypt if requested
		if (shouldEncrypt && rc4Key) {
			console.log('Encrypting PDF with RC4...');
			try {
				const encryptedResult = PDFService.encryptPDF(finalFileData, finalFileName, rc4Key);
				finalFileData = encryptedResult.encryptedData;
				finalFileName = encryptedResult.fileName;
			} catch (encryptError) {
				console.error('PDF encryption failed:', encryptError);
				throw error(500, 'Failed to encrypt PDF');
			}
		}

		console.log('PDF generation successful:', {
			fileName: finalFileName, 
			size: finalFileData.length,
			encrypted: shouldEncrypt
		});

		// Return PDF with proper headers
		return new Response(finalFileData, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${finalFileName}"`,
				'Content-Length': finalFileData.length.toString(),
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});

	} catch (err: any) {
		console.error("PDF generation error:", err);
		
		// Re-throw SvelteKit errors as-is
		if (err.status) {
			throw err;
		}
		
		// Log unexpected errors and return generic message
		console.error("Unexpected error in PDF generation:", err);
		throw error(500, 'Internal server error during PDF generation');
	}
};