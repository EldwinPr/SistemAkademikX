import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/database';

/**
 * GET /api/shares/[recordId]
 * 
 * Get the current user's secret share for a specific record.
 * Only returns the share if the user is authorized to have one.
 * 
 * Response format:
 * {
 *   success: boolean,
 *   message: string,
 *   share: {
 *     shareX: number,
 *     shareY: string,
 *     prime: string,
 *     createdAt: Date
 *   } | null
 * }
 */
export const GET: RequestHandler = async ({ locals, params }) => {
    const user = locals.user?.user;
    if (!user) {
        throw error(401, 'Unauthorized: You must be logged in to access shares.');
    }
    
    // Only advisors can have shares
    if (user.role !== 'Dosen_Wali') {
        throw error(403, 'Forbidden: Only advisors can access secret shares.');
    }

    const { recordId } = params;
    if (!recordId) {
        throw error(400, 'Bad Request: Record ID is required.');
    }

    try {
        // First, verify that the record exists
        const record = await db.transkrip.findUnique({
            where: { id: recordId },
            select: { 
                id: true,
                student: {
                    select: {
                        fullName: true,
                        nim: true
                    }
                }
            }
        });

        if (!record) {
            throw error(404, 'Record not found.');
        }

        // Find the user's share for this record
        const userShare = await db.secretShare.findUnique({
            where: {
                recordId_advisorId: {
                    recordId: recordId,
                    advisorId: user.id
                }
            },
            select: {
                shareX: true,
                shareY: true,
                prime: true,
                createdAt: true
            }
        });

        if (!userShare) {
            return json({
                success: false,
                message: `No secret share found for your user account on record for ${record.student.fullName} (${record.student.nim}).`,
                share: null
            });
        }

        return json({
            success: true,
            message: `Secret share retrieved successfully for ${record.student.fullName} (${record.student.nim}).`,
            share: {
                shareX: userShare.shareX,
                shareY: userShare.shareY,
                prime: userShare.prime,
                createdAt: userShare.createdAt
            }
        });

    } catch (err: any) {
        console.error(`Error fetching share for record ${recordId}:`, err);
        
        // Re-throw SvelteKit errors
        if (err.status) {
            throw err;
        }
        
        throw error(500, 'Internal Server Error: Failed to fetch share data.');
    }
};