import { AppError } from './errors.js';

let stripeClient = null;

export async function getStripe() {
    if (!stripeClient) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new AppError(
                'NOT_CONFIGURED',
                'Stripe is not configured (STRIPE_SECRET_KEY).',
                501
            );
        }
        const { default: Stripe } = await import('stripe');
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripeClient;
}

const DEFAULT_PLATFORM_FEE_BPS = 1000; // 10% — MVP platform cut

export function calculateFeeSplit(amountCents) {
    const bps = Number(process.env.PLATFORM_FEE_BPS ?? DEFAULT_PLATFORM_FEE_BPS);
    if (!Number.isInteger(bps) || bps < 0 || bps > 10000) {
        throw new AppError('CONFIG_ERROR', 'PLATFORM_FEE_BPS must be an integer between 0 and 10000.', 500);
    }
    const platformFeeCents = Math.round((amountCents * bps) / 10000);
    return {
        platform_fee_cents: platformFeeCents,
        instructor_earning_cents: amountCents - platformFeeCents,
    };
}

export async function verifyPaidCheckoutSession(sessionId) {
    const stripe = await getStripe();

    let session;
    try {
        session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent'],
        });
    } catch {
        throw new AppError('STRIPE_SESSION_NOT_FOUND', 'Checkout session not found.', 404);
    }

    if (session.payment_status !== 'paid') {
        throw new AppError(
            'PAYMENT_NOT_COMPLETED',
            'Payment for this checkout session has not completed.',
            400
        );
    }
    const metadata = session.metadata || {};
    if (!metadata.course_id) {
        throw new AppError(
            'SESSION_METADATA_MISSING',
            'Checkout session metadata is missing course_id.',
            400
        );
    }

    const paymentIntent = session.payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string' || !paymentIntent.id) {
        throw new AppError(
            'PAYMENT_INTENT_MISSING',
            'Checkout session has no payment intent.',
            400
        );
    }

    return {
        checkout_session_id: session.id,
        payment_intent_id: paymentIntent.id,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency,
        course_id: Number(metadata.course_id),
        session_user_id: metadata.user_id != null ? Number(metadata.user_id) : null,
    };
}
