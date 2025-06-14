import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import db from '$lib/server/database';

export const GET: RequestHandler = async ({ locals, params }) => {
    const user = locals.user?.user;
    if (!user) {
        throw error(401, 'Unauthorized');
    }
    
    if (user.role !== 'Dosen_Wali' && user.role !== 'Kepala_Program_Studi') {
        throw error(403, 'Only advisors and heads can access shares');
    }

    const { recordId } = params;
    if (!recordId) {
        throw error(400, 'Record ID required');
    }

    try {
        const shares = await db.secretShare.findMany({
            where: { recordId },
            include: {
                advisor: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            },
            orderBy: { shareX: 'asc' }
        });

        if (shares.length === 0) {
            return json({
                success: false,
                message: 'No shares found for this record'
            });
        }

        const sharesData = shares.map(share => ({
            advisorId: share.advisorId,
            advisorName: share.advisor.fullName,
            shareX: share.shareX,
            shareY: share.shareY,
            prime: share.prime
        }));

        return json({
            success: true,
            shares: sharesData
        });

    } catch (err: any) {
        console.error(`Error fetching all shares: ${err.message}`);
        throw error(500, 'Failed to fetch shares');
    }
};