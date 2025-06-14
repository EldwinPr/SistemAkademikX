import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PDFService } from '$lib/services/pdf.service';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const formData = await request.formData();
		const encryptedFile = formData.get('encryptedPdf') as File;
		const rc4Key = formData.get('rc4Key') as string;

		if (!encryptedFile || !rc4Key) {
			throw error(400, 'Encrypted file and RC4 key are required');
		}

		console.log('Decrypting PDF:', encryptedFile.name, 'Size:', encryptedFile.size);

		const encryptedBytes = new Uint8Array(await encryptedFile.arrayBuffer());
		const result = PDFService.decryptPDF(encryptedBytes, rc4Key, encryptedFile.name);

		if (!result.success || !result.decryptedData) {
			throw error(400, result.message || 'Decryption failed');
		}

		return new Response(result.decryptedData, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${result.fileName}"`,
				'Content-Length': result.decryptedData.length.toString(),
				'Cache-Control': 'no-cache'
			}
		});

	} catch (err: any) {
		console.error('Error decrypting PDF:', err);
		if (err.status) throw err;
		throw error(500, `Failed to decrypt PDF: ${err.message}`);
	}
};