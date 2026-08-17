import { query } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { fetchCourseRow } from './course.service.js';
import { getStripe } from '../lib/stripe.js';

/**
 * POST /checkout/session — create a Stripe Checkout Session (architecture §5).
 *
 * This endpoint does NOT create the enrollment — it only returns the Stripe
 * URL. The enrollment is created later by the server-verified payment path:
 * the Stripe webhook (canonical) or POST /enrollments (reconciliation).
 * The session's metadata { course_id, user_id } is set HERE, server-side, and
 * is the only thing those paths trust.
 */
export async function createCheckoutSession(userId, courseId, { successUrl, cancelUrl }) {
    const course = await fetchCourseRow(courseId); // 404 if missing/soft-deleted
    if (course.status !== 'published') {
        throw new AppError('COURSE_NOT_PUBLISHED', 'This course is not published.', 400);
    }
    if (course.instructor_id === userId) {
        throw new AppError('SELF_ENROLLMENT', 'You cannot buy your own course.', 400);
    }

    const [enrRows] = await query(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
        [userId, course.id]
    );
    if (enrRows.length > 0) {
        throw new AppError('ALREADY_ENROLLED', 'You are already enrolled in this course.', 409);
    }

    const [userRows] = await query('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: course.currency,
                    // Stripe requires an integer; the DB may return DECIMAL as a string
                    // (supportBigNumbers), so coerce explicitly.
                    unit_amount: Number(course.price_cents),
                    product_data: { name: course.title },
                },
            },
        ],
        customer_email: userRows[0]?.email ?? undefined, // prefill from verified profile
        client_reference_id: String(userId),
        metadata: {
            course_id: String(course.id),
            user_id: String(userId),
        },
        // Stripe substitutes {CHECKOUT_SESSION_ID}; the success page then calls
        // POST /enrollments with that id.
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
    });

    return { id: session.id, url: session.url };
}
