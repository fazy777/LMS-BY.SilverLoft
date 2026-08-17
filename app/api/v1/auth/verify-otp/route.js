import { NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth.js";
import { verifyUserOTP } from "@/lib/auth/verification-otp.js";
import db from "@/lib/db.js";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { otp, email, idToken } = body;

        if (!otp || String(otp).trim().length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "MISSING_OTP",
                        message: "Please enter the 6-digit verification code.",
                    },
                },
                { status: 400 }
            );
        }

        let targetUid = null;

        // 1. Check ID Token if provided
        if (idToken) {
            try {
                const decoded = await verifySessionToken(idToken);
                if (decoded) {
                    targetUid = decoded.uid || decoded.sub;
                }
            } catch (tokenErr) {
                // Ignore and try other methods
            }
        }

        // 2. Check Session Cookie if no UID yet
        if (!targetUid) {
            const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
            if (sessionCookie) {
                try {
                    const decoded = await verifySessionToken(sessionCookie);
                    if (decoded) {
                        targetUid = decoded.uid || decoded.sub;
                    }
                } catch {
                    // Ignore
                }
            }
        }

        // 3. Fallback: Lookup by email if provided
        if (!targetUid && email) {
            const [rows] = await db.query(
                `SELECT firebase_uid FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
                [email.trim()]
            );
            if (rows.length > 0) {
                targetUid = rows[0].firebase_uid;
            }
        }

        if (!targetUid) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "USER_IDENTIFICATION_REQUIRED",
                        message: "Unable to identify user. Please provide your email or sign in again.",
                    },
                },
                { status: 400 }
            );
        }

        // 4. Verify the OTP in MySQL and sync with Firebase
        const result = await verifyUserOTP({
            firebaseUid: targetUid,
            otp: String(otp).trim(),
        });

        return NextResponse.json({
            success: true,
            message: result.message || "Email verified successfully.",
        });
    } catch (error) {
        console.error("verify-otp error:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "VERIFICATION_FAILED",
                    message: error.message || "Failed to verify code. Please try again.",
                },
            },
            { status: 400 }
        );
    }
}
