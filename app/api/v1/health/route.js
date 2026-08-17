import { NextResponse } from 'next/server';
import { query } from '@/lib/db.js';
import { adminAuth } from '@/lib/auth.js';
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
        database: process.env.MYSQL_DATABASE || '[Not specified or in URI]',
        ssl: Boolean(process.env.MYSQL_SSL),
        error: null,
      },
      firebaseAdmin: {
        status: 'pending',
        hasServiceAccount: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
        hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
        hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
        error: null,
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
        hint: process.env.VERCEL && (process.env.MYSQL_HOST === 'localhost' || !process.env.MYSQL_HOST)
          ? 'Vercel serverless functions cannot connect to localhost. You must host MySQL on a cloud provider (e.g. TiDB Cloud, Aiven, Railway, AWS RDS) and set MYSQL_HOST or DATABASE_URL in Vercel Environment Variables.'
          : 'Verify database credentials, host accessibility, and SSL requirements.',
      };
    }

    // 2. Test Firebase Admin
    try {
      const auth = adminAuth();
      if (auth && (diagnostics.firebaseAdmin.hasClientEmail || diagnostics.firebaseAdmin.hasServiceAccount)) {
        diagnostics.firebaseAdmin.status = 'configured';
      } else {
        diagnostics.firebaseAdmin.status = 'missing_credentials';
      }
    } catch (err) {
      diagnostics.firebaseAdmin.status = 'error';
      diagnostics.firebaseAdmin.error = {
        message: err.message,
      };
    }

    // 3. Test Stripe
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = getStripe();
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
      diagnostics.firebaseAdmin.status === 'configured' &&
      diagnostics.stripe.status === 'configured';

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

