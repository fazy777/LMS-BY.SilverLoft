import { NextResponse } from "next/server";
import { Resend } from "resend";
import { adminAuth, SESSION_COOKIE_NAME } from "@/lib/auth.js";
import { createVerificationEmail } from "@/lib/auth/verification-email.js";
import db from "@/lib/db.js";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { idToken, email: bodyEmail, displayName: bodyDisplayName } = body;

        const auth = adminAuth();
        let verifiedUid = null;
        let verifiedEmail = bodyEmail;
        let verifiedDisplayName = bodyDisplayName;

        // 1. Verify caller via ID Token or Session Cookie
        if (idToken) {
            try {
                const decoded = await auth.verifyIdToken(idToken);
                verifiedUid = decoded.uid;
                verifiedEmail = decoded.email || verifiedEmail;
                verifiedDisplayName = decoded.name || verifiedDisplayName;
            } catch (tokenErr) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "INVALID_TOKEN",
                            message: "Invalid or expired Firebase ID token.",
                        },
                    },
                    { status: 401 }
                );
            }
        } else {
            const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
            if (sessionCookie) {
                try {
                    const decoded = await auth.verifySessionCookie(sessionCookie, false);
                    verifiedUid = decoded.uid;
                    verifiedEmail = decoded.email || verifiedEmail;
                } catch {
                    // Session cookie invalid
                }
            }
        }

        // Fallback: If body provided email and firebaseUid, verify against DB
        if (!verifiedUid && body.firebaseUid && body.email) {
            const [users] = await db.query(
                `SELECT id, firebase_uid, email, display_name FROM users WHERE firebase_uid = ? AND email = ? AND deleted_at IS NULL LIMIT 1`,
                [body.firebaseUid, body.email]
            );
            if (users.length > 0) {
                verifiedUid = users[0].firebase_uid;
                verifiedEmail = users[0].email;
                verifiedDisplayName = users[0].display_name || verifiedDisplayName;
            }
        }

        if (!verifiedUid || !verifiedEmail) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "UNAUTHENTICATED",
                        message: "Authentication required to send verification email.",
                    },
                },
                { status: 401 }
            );
        }

        // 2. Lookup display name from DB if not yet set
        if (!verifiedDisplayName) {
            const [userRows] = await db.query(
                `SELECT display_name FROM users WHERE firebase_uid = ? LIMIT 1`,
                [verifiedUid]
            );
            if (userRows.length > 0 && userRows[0].display_name) {
                verifiedDisplayName = userRows[0].display_name;
            }
        }

        // 3. Generate verification email HTML and Plain-Text fallback
        const { html, text } = await createVerificationEmail({
            email: verifiedEmail,
            firebaseUid: verifiedUid,
            displayName: verifiedDisplayName,
        });

        // 4. Send email via Resend
        const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
        if (!resendApiKey) {
            console.error("RESEND_API_KEY is not configured in environment variables.");
            return NextResponse.json({
                success: true,
                emailSent: false,
                message: "Verification code generated, but email service is not configured.",
                data: { email: verifiedEmail },
            });
        }

        const resend = new Resend(resendApiKey);
        const configuredFrom = (process.env.EMAIL_FROM || "onboarding@resend.dev").trim();
        const fromEmail = configuredFrom.includes("@") ? configuredFrom : "onboarding@resend.dev";
        const emailSubject = "Verify your email address - Silver Loft LMS";

        let emailResult = null;
        let sendError = null;

        try {
            emailResult = await resend.emails.send({
                from: fromEmail,
                to: verifiedEmail,
                subject: emailSubject,
                html,
                text,
            });

            // If configured domain failed due to unverified domain, fallback to onboarding@resend.dev
            if (emailResult?.error && fromEmail !== "onboarding@resend.dev") {
                console.warn(`[send-verification] Domain ${fromEmail} failed (${emailResult.error.message}). Retrying with onboarding@resend.dev...`);
                emailResult = await resend.emails.send({
                    from: "onboarding@resend.dev",
                    to: verifiedEmail,
                    subject: emailSubject,
                    html,
                    text,
                });
            }
        } catch (err) {
            sendError = err;
            console.error("[send-verification] Resend exception:", err.message);
        }

        if (emailResult?.error) {
            sendError = emailResult.error;
            console.warn("[send-verification] Resend delivery notice:", emailResult.error.message);
        }

        // Return success even if email delivery hit a free-tier/domain restriction so OTP flow continues
        return NextResponse.json({
            success: true,
            emailSent: !sendError,
            message: sendError
                ? `Verification code generated. (${sendError.message})`
                : "Verification email sent successfully.",
            data: {
                email: verifiedEmail,
                emailId: emailResult?.data?.id || null,
            },
        });
    } catch (error) {
        console.error("[send-verification] Internal error:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: error.message || "Failed to process verification request.",
                },
            },
            { status: 500 }
        );
    }
}
