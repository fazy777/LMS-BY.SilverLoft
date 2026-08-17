import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import { getStripe } from '@/lib/stripe.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      isVercel: Boolean(process.env.VERCEL),
      database: {
        status: 'pending',
        host: process.env.DATABASE_URL ? '[Configured via DATABASE_URL]' : (process.env.MYSQL_HOST || 'localhost'),
        database: process.env.MYSQL_DATABASE || 'LMS',
        ssl: true,
        error: null,
      },
      auth: {
        status: 'configured',
        type: 'jose-web-crypto',
        sessionCookieName: process.env.SESSION_COOKIE_NAME || '__session',
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'lms-nextjs-42ab6',
      },
      stripe: {
        status: 'pending',
        isConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
        hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
        error: null,
      },
      services: {
        resendEmailConfigured: Boolean(process.env.RESEND_API_KEY),
        cloudinaryConfigured: Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME),
        cloudflareStreamConfigured: Boolean(process.env.CLOUDFLARE_STREAM_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN),
      },
    };

    // 1. Test Database Connection
    try {
      const [rows] = await query('SELECT 1 as is_alive');
      if (rows && rows.length > 0) {
        diagnostics.database.status = 'connected';
      } else {
        diagnostics.database.status = 'connected_empty_response';
      }
    } catch (err) {
      diagnostics.database.status = 'error';
      diagnostics.database.error = {
        message: err.message,
        code: err.code || 'UNKNOWN',
      };
    }

    // 2. Test Stripe
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = await getStripe();
        if (stripe) {
          diagnostics.stripe.status = 'configured';
        }
      } else {
        diagnostics.stripe.status = 'missing_secret_key';
      }
    } catch (err) {
      diagnostics.stripe.status = 'error';
      diagnostics.stripe.error = {
        message: err.message,
      };
    }

    const allHealthy = diagnostics.database.status === 'connected' &&
      diagnostics.auth.status === 'configured';

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      diagnostics,
    }, {
      status: 200,
    });
  } catch (fatalErr) {
    return NextResponse.json({
      status: 'fatal_error',
      message: fatalErr.message,
      stack: fatalErr.stack,
    }, {
      status: 200,
    });
  }
}
