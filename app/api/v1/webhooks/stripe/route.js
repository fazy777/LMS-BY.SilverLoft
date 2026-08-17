import { AppError, handle } from '@/lib/errors.js';
import {
    constructStripeEvent,
    handleStripeEvent,
} from '@/services/webhook.service.js';


export const runtime = 'nodejs';

export const POST = handle(async (req) => {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
        throw new AppError('INVALID_SIGNATURE', 'Missing stripe-signature header.', 400);
    }

    // constructEvent needs the RAW body — parse nothing before verification.
    const rawBody = await req.text();
    const event = constructStripeEvent(rawBody, signature);

    const result = await handleStripeEvent(event);
    return { received: true, type: event.type, ...result };
});
