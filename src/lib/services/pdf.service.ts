import { RC4Utils } from '../cryptography/RC4';
import { BBSUtils } from '../cryptography/BBS';
import type { 
	AcademicRecord,
	GeneratedTranscript,
	PDFTranscriptConfig,
	TranscriptRequest
} from '../types/academic.types';
import type { 
	DigitalSignature,
	PDFEncryptionResult,
	PDFDecryptionResult
} from '../types/crypto.types';

export class PDFService {
	/**
	 * Generate transcript PDF with proper PDF structure
	 */
	static generateTranscript(
		record: AcademicRecord,
		signatureData?: any,
		config?: PDFTranscriptConfig,
		generatedBy: string = 'system'
	): GeneratedTranscript {
		try {
			const pdfData = this.createValidPDF(record, signatureData, config);
			
			return {
				id: this.generateId(),
				studentId: record.nim,
				fileName: `transcript_${record.nim}_${Date.now()}.pdf`,
				isEncrypted: false,
				fileData: pdfData,
				generatedAt: new Date(),
				generatedBy
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to generate PDF: ${errorMessage}`);
		}
	}

	/**
	 * Create a valid PDF file with proper structure
	 */
	private static createValidPDF(record: AcademicRecord, signatureData?: any, config?: PDFTranscriptConfig): Uint8Array {
		// Calculate total SKS
		const totalSKS = record.courses.reduce((sum, course) => sum + course.credits, 0);
		
		// Create PDF content stream
		let contentStream = `BT
/F1 20 Tf
50 750 Td
(${config?.headerText || 'INSTITUT TEKNOLOGI BANDUNG'}) Tj
0 -30 Td
/F1 16 Tf
(TRANSKRIP AKADEMIK) Tj
0 -40 Td
/F1 12 Tf
(Nama: ${this.escapePDFString(record.name)}) Tj
0 -20 Td
(NIM: ${record.nim}) Tj
0 -20 Td
(IPK: ${record.ipk.toFixed(2)}) Tj
0 -20 Td
(Total SKS: ${totalSKS}) Tj
0 -30 Td
/F1 10 Tf
(DAFTAR MATA KULIAH:) Tj`;

		// Add courses
		let yOffset = -15;
		record.courses.forEach((course, index) => {
			contentStream += `
0 ${yOffset} Td
(${index + 1}. ${this.escapePDFString(course.code)} - ${this.escapePDFString(course.name)}) Tj
0 -12 Td
(   ${course.credits} SKS - Nilai: ${course.grade}) Tj`;
			yOffset = -15;
		});

		// Add signature if provided
		if (signatureData && config?.includeSignature !== false) {
			contentStream += `
0 -30 Td
/F1 8 Tf
(--- TANDA TANGAN DIGITAL ---) Tj`;
			
			if (signatureData.signedBy) {
				contentStream += `
0 -12 Td
(Ditandatangani oleh: ${this.escapePDFString(signatureData.signedBy)}) Tj
0 -12 Td
(Status: ${signatureData.status || 'TERVERIFIKASI'}) Tj`;
			}
			
			if (signatureData.signature) {
				const shortSig = signatureData.signature.substring(0, 32);
				contentStream += `
0 -12 Td
(Signature: ${shortSig}...) Tj`;
			}
		}

		// Add footer
		if (config?.includeWatermark !== false) {
			contentStream += `
0 -40 Td
/F1 8 Tf
([TRANSKRIP RESMI - INSTITUT TEKNOLOGI BANDUNG]) Tj
0 -12 Td
(Dicetak pada: ${new Date().toLocaleDateString('id-ID')}) Tj`;
		}

		contentStream += `
ET`;

		// Calculate content stream length
		const streamBytes = new TextEncoder().encode(contentStream);
		const streamLength = streamBytes.length;

		// Create complete PDF structure
		const pdfHeader = '%PDF-1.4\n';
		
		const catalog = `1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

`;

		const pages = `2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

`;

		const page = `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

`;

		const font = `4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

`;

		const content = `5 0 obj
<<
/Length ${streamLength}
>>
stream
${contentStream}
endstream
endobj

`;

		// Calculate cross-reference positions
		const headerLength = new TextEncoder().encode(pdfHeader).length;
		const catalogStart = headerLength;
		const pagesStart = catalogStart + new TextEncoder().encode(catalog).length;
		const pageStart = pagesStart + new TextEncoder().encode(pages).length;
		const fontStart = pageStart + new TextEncoder().encode(page).length;
		const contentStart = fontStart + new TextEncoder().encode(font).length;
		const xrefStart = contentStart + new TextEncoder().encode(content).length;

		const xref = `xref
0 6
0000000000 65535 f 
${catalogStart.toString().padStart(10, '0')} 00000 n 
${pagesStart.toString().padStart(10, '0')} 00000 n 
${pageStart.toString().padStart(10, '0')} 00000 n 
${fontStart.toString().padStart(10, '0')} 00000 n 
${contentStart.toString().padStart(10, '0')} 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${xrefStart}
%%EOF`;

		// Combine all parts
		const completePDF = pdfHeader + catalog + pages + page + font + content + xref;
		
		return new TextEncoder().encode(completePDF);
	}

	/**
	 * Escape special characters for PDF strings
	 */
	private static escapePDFString(str: string): string {
		return str
			.replace(/\\/g, '\\\\')
			.replace(/\(/g, '\\(')
			.replace(/\)/g, '\\)')
			.replace(/\r/g, '\\r')
			.replace(/\n/g, '\\n')
			.replace(/\t/g, '\\t');
	}

	/**
	 * Encrypt PDF with RC4
	 */
	static encryptPDF(pdfData: Uint8Array, fileName: string, key?: string): PDFEncryptionResult {
		try {
			const encryptionKey = key || this.generateKey();
			const encryptedData = RC4Utils.encryptBinary(pdfData, encryptionKey);
			
			return {
				encryptedData,
				encryptionKey,
				fileName: fileName.replace('.pdf', '_encrypted.pdf'),
				originalSize: pdfData.length,
				encryptedSize: encryptedData.length
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to encrypt PDF: ${errorMessage}`);
		}
	}

	/**
	 * Decrypt PDF with RC4
	 */
	static decryptPDF(encryptedData: Uint8Array, key: string, fileName: string): PDFDecryptionResult {
		try {
			const decryptedData = RC4Utils.decryptBinary(encryptedData, key);
			
			return {
				success: true,
				decryptedData,
				fileName: fileName.replace('_encrypted', ''),
				message: 'PDF decrypted successfully'
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return {
				success: false,
				fileName,
				message: `Decryption failed: ${errorMessage}`
			};
		}
	}

	/**
	 * Process transcript request
	 */
	static processRequest(request: TranscriptRequest, record: AcademicRecord, signature?: DigitalSignature): GeneratedTranscript {
		const config: PDFTranscriptConfig = {
			includeSignature: request.includeSignature,
			includeWatermark: true,
			headerText: 'INSTITUT TEKNOLOGI BANDUNG'
		};

		const transcript = this.generateTranscript(record, signature, config, request.requestedBy);

		// Encrypt if requested
		if (request.encryptPDF && transcript.fileData) {
			const { encryptedData, fileName } = this.encryptPDF(transcript.fileData, transcript.fileName);
			transcript.fileData = encryptedData;
			transcript.fileName = fileName;
			transcript.isEncrypted = true;
		}

		return transcript;
	}

	/**
	 * Generate secure key
	 */
	private static generateKey(): string {
		return BBSUtils.generateSecureHex(32);
	}

	/**
	 * Generate unique ID
	 */
	private static generateId(): string {
		return `pdf_${Date.now()}_${BBSUtils.generateSecureHex(4)}`;
	}
}