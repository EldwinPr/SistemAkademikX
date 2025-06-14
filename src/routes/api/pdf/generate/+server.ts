import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';
import { CryptoService } from '$lib/services/crypto.service';
import { PDFService } from '$lib/services/pdf.service';
import { SHA3Utils } from '$lib/cryptography/SHA3';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const formData = await request.formData();
		const recordId = formData.get('recordId') as string;
		const shouldEncrypt = formData.get('encrypt') === 'true';
		const rc4Key = formData.get('rc4Key') as string | undefined;

		console.log('PDF Generation Request:', { recordId, shouldEncrypt, hasKey: !!rc4Key });

		if (!recordId) {
			throw error(400, 'Record ID is required');
		}

		const userId = locals.user.user.id;
		const fullUser = await db.user.findUnique({ 
			where: { id: userId },
			select: { privateKey: true }
		});

		if (!fullUser?.privateKey) {
			throw error(500, 'Private key not found');
		}

		// Get direct access key
		const directKey = await db.directKey.findUnique({
			where: { recordId_userId: { recordId, userId } }
		});

		if (!directKey) {
			throw error(403, 'Access denied to this record');
		}

		// Decrypt record
		const aesKey = CryptoService.decryptDirectAccessKey(directKey.encryptedAESKey, fullUser.privateKey);
		
		const record = await db.transkrip.findUnique({
			where: { id: recordId },
			include: { student: { select: { programStudi: true } } }
		});

		if (!record) {
			throw error(404, 'Record not found');
		}

		const decryptedRecord = CryptoService.decryptAcademicRecord(record.encryptedData, aesKey);

		// Get signature info
		const head = await db.user.findFirst({
			where: { role: 'Kepala_Program_Studi', programStudi: record.student.programStudi! }
		});

		if (!head?.publicKey) {
			throw error(500, 'Program head public key not found');
		}

		// Create signature data for PDF
		const signatureData = {
			signedBy: head.fullName,
			status: 'TERVERIFIKASI',
			signature: record.digitalSignature,
			timestamp: record.createdAt
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
			throw error(500, 'Failed to generate PDF');
		}

		let finalFileData = transcript.fileData;
		let finalFileName = transcript.fileName;

		// Encrypt if requested
		if (shouldEncrypt && rc4Key) {
			console.log('Encrypting PDF with RC4...');
			const encryptedResult = PDFService.encryptPDF(finalFileData, finalFileName, rc4Key);
			finalFileData = encryptedResult.encryptedData;
			finalFileName = encryptedResult.fileName;
		}

		console.log('Returning PDF:', finalFileName, 'Size:', finalFileData.length);

		return new Response(finalFileData, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${finalFileName}"`,
				'Content-Length': finalFileData.length.toString(),
				'Cache-Control': 'no-cache'
			}
		});

	} catch (err: any) {
		console.error("Error generating PDF:", err);
		if (err.status) throw err;
		throw error(500, `Failed to generate PDF: ${err.message}`);
	}
};