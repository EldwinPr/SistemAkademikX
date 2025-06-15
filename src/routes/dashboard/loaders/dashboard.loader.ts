import type { UserContext, SafeUser } from '$lib/types/auth.types';
import type { User, Transkrip, ProgramStudi, Role } from '@prisma/client';
import db from '$lib/server/database';

/**
 * Dashboard data structure returned to client
 * Contains role-specific data based on user permissions
 */
export interface DashboardData {
	userContext: UserContext;
	myRecords: TranscriptRecord[];
	myTranscriptsWithDetails: TranscriptSummary[];
	adviseeStudents: StudentWithTranscripts[];
	allRecords: TranscriptWithStudent[];
	allAdvisors: AdvisorInfo[];
	allStudents: StudentInfo[];
	programRecords: TranscriptWithStudent[];
	headKeys: HeadKeyInfo | null;
	allStudentsWithTranscripts: StudentWithTranscriptList[];
	error?: string;
}

/**
 * Type definitions for dashboard data structures
 */
interface TranscriptRecord {
	id: string;
	studentId: string;
	encryptedData: string;
	digitalSignature: string;
	keyId: string;
	createdAt: Date;
	createdBy: string;
}

interface TranscriptSummary {
	id: string;
	createdAt: Date;
	digitalSignature: string;
}

interface StudentWithTranscripts extends Omit<User, 'password' | 'privateKey'> {
	hasTranscript: boolean;
	transcriptRecords: Array<{
		id: string;
		createdAt: Date;
	}>;
}

interface TranscriptWithStudent {
	id: string;
	studentId: string;
	encryptedData: string;
	digitalSignature: string;
	keyId: string;
	createdAt: Date;
	createdBy: string;
	student: {
		fullName: string;
		nim: string | null;
	};
}

interface AdvisorInfo {
	id: string;
	username: string;
	fullName: string;
	role: Role;
	createdAt: Date;
}

interface StudentInfo {
	id: string;
	username: string;
	fullName: string;
	nim: string | null;
	role: Role;
	programStudi: ProgramStudi | null;
	DosenId: string | null;
	createdAt: Date;
}

interface HeadKeyInfo {
	publicKey: string | null;
}

interface StudentWithTranscriptList {
	id: string;
	fullName: string;
	nim: string | null;
	records: Array<{
		id: string;
		createdAt: Date;
	}>;
}

export async function loadDashboardData(userContext: UserContext): Promise<DashboardData> {
	const { user } = userContext;
	const { role, programStudi, id: userId } = user;

	// Initialize dashboard data structure with defaults
	const dashboardData: DashboardData = {
		userContext,
		myRecords: [],
		myTranscriptsWithDetails: [],
		adviseeStudents: [],
		allRecords: [],
		allAdvisors: [],
		allStudents: [],
		programRecords: [],
		headKeys: null,
		allStudentsWithTranscripts: []
	};

	try {
		// Route to role-specific data loaders
		switch (role) {
			case 'Mahasiswa':
				await loadStudentData(userId, dashboardData);
				break;
			
			case 'Dosen_Wali':
				await loadAdvisorData(userId, dashboardData);
				break;
			
			case 'Kepala_Program_Studi':
				if (!programStudi) {
					throw new Error('Program Studi not found for head user');
				}
				await loadHeadData(userId, programStudi, dashboardData);
				break;
			
			default:
				throw new Error(`Unsupported user role: ${role}`);
		}

		return dashboardData;

	} catch (error) {
		// Log detailed error for debugging
		console.error('Dashboard data loading failed:', {
			userId,
			role,
			programStudi,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		
		// Re-throw with context for higher level handling
		throw new Error(`Failed to load dashboard data for ${role}: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

async function loadStudentData(userId: string, data: DashboardData): Promise<void> {
	try {
		// Load all transcripts for this student (for historical view)
		data.myRecords = await db.transkrip.findMany({
			where: { studentId: userId },
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				studentId: true,
				encryptedData: true,
				digitalSignature: true,
				keyId: true,
				createdAt: true,
				createdBy: true
			}
		});

		// Load transcript summaries for dropdown selection
		data.myTranscriptsWithDetails = await db.transkrip.findMany({
			where: { studentId: userId },
			select: {
				id: true,
				createdAt: true,
				digitalSignature: true
			},
			orderBy: { createdAt: 'desc' }
		});

		console.log(`Loaded ${data.myRecords.length} transcripts for student ${userId}`);

	} catch (error) {
		console.error('Failed to load student data:', error);
		throw new Error(`Database error while loading student data: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

async function loadAdvisorData(userId: string, data: DashboardData): Promise<void> {
	try {
		// Load students under this advisor's supervision with their transcript counts
		const studentsWithRecords = await db.user.findMany({
			where: { 
				DosenId: userId, 
				role: 'Mahasiswa' 
			},
			include: {
				records: {
					select: { 
						id: true, 
						createdAt: true 
					},
					orderBy: { createdAt: 'desc' }
				},
				_count: { 
					select: { records: true } 
				}
			},
			orderBy: { fullName: 'asc' }
		});

		// Transform data to include transcript status
		data.adviseeStudents = studentsWithRecords.map(student => ({
			...student,
			hasTranscript: student._count.records > 0,
			transcriptRecords: student.records
		}));

		// Load all advisors for secret sharing operations
		data.allAdvisors = await db.user.findMany({ 
			where: { role: 'Dosen_Wali' },
			select: {
				id: true,
				username: true,
				fullName: true,
				role: true,
				createdAt: true
			},
			orderBy: { fullName: 'asc' }
		});
		
		// Load all academic records (for group decryption access)
		data.allRecords = await db.transkrip.findMany({
			orderBy: { createdAt: 'desc' },
			include: { 
				student: { 
					select: { 
						fullName: true, 
						nim: true 
					} 
				} 
			}
		});

		// Load all students with their transcript lists (for group decryption selection)
		data.allStudentsWithTranscripts = await db.user.findMany({
			where: { role: 'Mahasiswa' },
			select: {
				id: true,
				fullName: true,
				nim: true,
				records: {
					select: {
						id: true,
						createdAt: true
					},
					orderBy: { createdAt: 'desc' }
				}
			},
			orderBy: { fullName: 'asc' }
		});

		console.log(`Loaded data for advisor ${userId}: ${data.adviseeStudents.length} advisees, ${data.allRecords.length} total records`);

	} catch (error) {
		console.error('Failed to load advisor data:', error);
		throw new Error(`Database error while loading advisor data: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

async function loadHeadData(userId: string, programStudi: ProgramStudi, data: DashboardData): Promise<void> {
	try {
		// Load all transcripts for this program
		data.programRecords = await db.transkrip.findMany({
			where: { 
				student: { programStudi } 
			},
			orderBy: { createdAt: 'desc' },
			include: { 
				student: { 
					select: { 
						fullName: true, 
						nim: true 
					} 
				} 
			}
		});

		// Load all advisors (for user management)
		data.allAdvisors = await db.user.findMany({ 
			where: { role: 'Dosen_Wali' },
			select: {
				id: true,
				username: true,
				fullName: true,
				role: true,
				createdAt: true
			},
			orderBy: { fullName: 'asc' }
		});

		// Load all students in this program (for user management)
		data.allStudents = await db.user.findMany({ 
			where: { 
				role: 'Mahasiswa', 
				programStudi 
			},
			select: {
				id: true,
				username: true,
				fullName: true,
				nim: true,
				role: true,
				programStudi: true,
				DosenId: true,
				createdAt: true
			},
			orderBy: { fullName: 'asc' }
		});

		// Load head's cryptographic keys for signing operations
		const headUser = await db.user.findUnique({ 
			where: { id: userId },
			select: { publicKey: true }
		});
		
		if (!headUser) {
			throw new Error(`Head user not found: ${userId}`);
		}

		data.headKeys = { 
			publicKey: headUser.publicKey 
		};

		console.log(`Loaded data for head ${userId} (${programStudi}): ${data.programRecords.length} program records, ${data.allStudents.length} students`);

	} catch (error) {
		console.error('Failed to load head data:', error);
		throw new Error(`Database error while loading head data: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

export function validateRequiredFields(obj: any, requiredFields: string[]): void {
	const missingFields = requiredFields.filter(field => 
		obj[field] === undefined || obj[field] === null
	);
	
	if (missingFields.length > 0) {
		throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
	}
}

export function handleDatabaseError(operation: string, error: unknown): never {
	const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
	
	console.error(`Database operation failed: ${operation}`, {
		error: errorMessage,
		timestamp: new Date().toISOString()
	});
	
	throw new Error(`${operation} failed: ${errorMessage}`);
}