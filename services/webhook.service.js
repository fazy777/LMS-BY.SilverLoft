import { AppError } from '../lib/errors.js';
import { transaction } from '../lib/db.js';
import { getStripe } from '../lib/stripe.js';
import { applyPaidSession } from './enrollment.service.js';

export function constructStripeEvent(rawBody, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('NOT_CONFIGURED', 'STRIPE_WEBHOOK_SECRET is not configured.', 501);
  }
  try {
    return getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError('INVALID_SIGNATURE', 'Stripe signature verification failed.', 400);
  }
}

function normalizeCheckoutSession(session) {
  if (session.payment_status !== 'paid') {
    throw new AppError('PAYMENT_NOT_COMPLETED', 'Checkout session is not paid.', 400);
  }
  const metadata = session.metadata || {};
  if (!metadata.course_id) {
    throw new AppError('SESSION_METADATA_MISSING', 'Checkout session metadata is missing course_id.', 400);
  }
  if (!metadata.user_id) {
    throw new AppError('SESSION_METADATA_MISSING', 'Checkout session metadata is missing user_id.', 400);
  }
  if (!session.payment_intent) {
    throw new AppError('PAYMENT_INTENT_MISSING', 'Checkout session has no payment intent.', 400);
  }

  return {
    checkout_session_id: session.id,
    payment_intent_id: session.payment_intent,
    amount_cents: session.amount_total,
    currency: session.currency,
    course_id: Number(metadata.course_id),
    session_user_id: Number(metadata.user_id),
  };
}

export async function handleStripeEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      let session;
      try {
        session = normalizeCheckoutSession(event.data.object);
      } catch (err) {
        if (err instanceof AppError && err.status === 400) {
          console.error('[webhook] unusable checkout session:', err.code, err.message);
          return { blocked: err.code };
        }
        throw err;
      }

      try {
        const { enrollment, replay } = await applyPaidSession(session);
        return { enrollment_id: enrollment.id, replay };
      } catch (err) {
        if (
          err instanceof AppError &&
          ['SELF_ENROLLMENT', 'COURSE_NOT_PUBLISHED', 'ALREADY_ENROLLED'].includes(err.code)
        ) {
          console.error(
            `[webhook] checkout.session.completed blocked: ${err.code} — ` +
              `session ${session.checkout_session_id}, manual action required.`
          );
          return { blocked: err.code };
        }
        throw err; 
      }
    }

    case 'charge.refunded':
      return markPaymentRefunded(event.data.object);

    case 'transfer.paid':
      return markTransferPaid(event.data.object);

    case 'transfer.failed':
      return markTransferFailed(event.data.object);

    default:
      return { ignored: true };
  }
}
async function markPaymentRefunded(charge) {
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return { ignored: true }; 
  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT id, status FROM payments WHERE stripe_payment_intent_id = ? FOR UPDATE',
      [paymentIntentId]
    );
    if (rows.length === 0) return { unknown_payment: true }; 
    const payment = rows[0];
    if (payment.status === 'refunded') return { already_refunded: true };

    await conn.execute("UPDATE payments SET status = 'refunded' WHERE id = ?", [payment.id]);
    await conn.execute(
      `DELETE FROM payout_ledger_entries
        WHERE payment_id = ? AND status = 'pending'`,
      [payment.id]
    );
    return { payment_id: payment.id, refunded: true };
  });
}

async function markTransferPaid(transfer) {
  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT id, status FROM payouts WHERE stripe_transfer_id = ? FOR UPDATE',
      [transfer.id]
    );
    if (rows.length === 0) return { unknown_transfer: true };
    const payout = rows[0];
    if (payout.status === 'paid') return { already_paid: true };

    await conn.execute("UPDATE payouts SET status = 'paid' WHERE id = ?", [payout.id]);
    await conn.execute(
      `UPDATE payout_ledger_entries
          SET status = 'paid'
        WHERE payout_id = ? AND status = 'included_in_payout'`,
      [payout.id]
    );
    return { payout_id: payout.id, paid: true };
  });
}
async function markTransferFailed(transfer) {
  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT id, status FROM payouts WHERE stripe_transfer_id = ? FOR UPDATE',
      [transfer.id]
    );
    if (rows.length === 0) return { unknown_transfer: true };

    await conn.execute("UPDATE payouts SET status = 'failed' WHERE id = ?", [rows[0].id]);
    await conn.execute(
      `UPDATE payout_ledger_entries
          SET status = 'pending', payout_id = NULL
        WHERE payout_id = ? AND status = 'included_in_payout'`,
      [rows[0].id]
    );
    return { payout_id: rows[0].id, failed: true };
  });
}
