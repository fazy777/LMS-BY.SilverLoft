import { AppError, handle, ok } from '../../../../../../lib/errors.js';
import { requireVerifiedEmail, withAuth } from '../../../../../../lib/auth.js';
import {
    assertCourseOwner,
    submitCourseForReview,
} from '../../../../../../services/course.service.js';


export const runtime = 'nodejs';

export const POST = handle(async (req, ctx) => {
    const auth = await withAuth(req);
    const { id } = await ctx.params;

    if (auth.status !== 'active') {
        throw new AppError('ACCOUNT_SUSPENDED', 'Your account is not active.', 403);
    }

    await assertCourseOwner(id, auth.id);
    
    await requireVerifiedEmail(req);

    return ok(await submitCourseForReview(id, auth.id));
});
