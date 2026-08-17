import { NextResponse } from "next/server";
import { adminAuth, SESSION_COOKIE_NAME } from "@/lib/auth.js";
import db from "@/lib/db.js";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const body = await request.json();
        const { idToken, displayName: clientDisplayName } = body;

        if (!idToken) {
            return NextResponse.json(
                { success: false, error: { code: "MISSING_TOKEN", message: "ID token is required." } },
                { status: 400 }
            );
        }

        const auth = adminAuth();

        // 1. Verify the Firebase ID token — this is the ONLY source of truth
        //    for firebase_uid/email. Never trust these values if sent raw in the body.
        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(idToken);
        } catch (err) {
            console.error("Firebase Admin verifyIdToken error:", err);
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_TOKEN",
                        message: err.message ? `Token verification failed: ${err.message}` : "Token verification failed.",
                        details: err.message
                    }
                },
                { status: 401 }
            );
        }

        const { uid: firebaseUid, email, name: tokenDisplayName } = decodedToken;
        const finalDisplayName = tokenDisplayName || (typeof clientDisplayName === "string" && clientDisplayName.trim() ? clientDisplayName.trim() : null);

        // 2. Look up the matching MySQL user row by firebase_uid or email
        const [existingRows] = await db.query(
            "SELECT id, firebase_uid, email, display_name, is_instructor, is_admin FROM users WHERE (firebase_uid = ? OR email = ?) AND deleted_at IS NULL LIMIT 1",
            [firebaseUid, email]
        );

        let userRow = existingRows[0];

        const isSuperAdminEmail = email === 'hafizmfaizanali@gmail.com';

        // 3. First-time login (signup OR first-ever Google login) — provision the row
        if (!userRow) {
            const [result] = await db.query(
                `INSERT INTO users (firebase_uid, email, display_name, is_admin, is_instructor) VALUES (?, ?, ?, ?, ?)`,
                [firebaseUid, email, finalDisplayName, isSuperAdminEmail ? 1 : 0, isSuperAdminEmail ? 1 : 0]
            );

            userRow = {
                id: result.insertId,
                display_name: finalDisplayName,
                is_instructor: isSuperAdminEmail ? 1 : 0,
                is_admin: isSuperAdminEmail ? 1 : 0,
            };
        } else {
            const updates = [];
            const params = [];

            if (userRow.firebase_uid !== firebaseUid) {
                updates.push("firebase_uid = ?");
                params.push(firebaseUid);
            }
            if (!userRow.display_name && finalDisplayName) {
                updates.push("display_name = ?");
                params.push(finalDisplayName);
                userRow.display_name = finalDisplayName;
            }
            if (isSuperAdminEmail && !userRow.is_admin) {
                updates.push("is_admin = 1, is_instructor = 1");
                userRow.is_admin = 1;
                userRow.is_instructor = 1;
            }

            if (updates.length > 0) {
                params.push(userRow.id);
                await db.query(
                    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
                    params
                );
            }
        }

        // 4. Create a server-side session cookie via Firebase Admin
        //    Note: createSessionCookie requires Firebase Admin Service Account credentials.
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days, in ms
        let sessionCookie;
        try {
            sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        } catch (cookieErr) {
            console.error("Firebase Admin createSessionCookie error:", cookieErr);
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "SESSION_COOKIE_FAILED",
                        message: cookieErr.message ? `Failed to create session: ${cookieErr.message}` : "Failed to create session on server.",
                        details: cookieErr.message
                    }
                },
                { status: 500 }
            );
        }

        // 5. Set it as HTTP-only, Secure — never accessible to client-side JS
        const response = NextResponse.json({
            success: true,
            data: {
                id: userRow.id,
                email,
                display_name: userRow.display_name,
                is_instructor: !!userRow.is_instructor,
                is_admin: !!userRow.is_admin,
            },
        });

        response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: expiresIn / 1000, // seconds
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("Session creation error:", err);
        return NextResponse.json(
            { success: false, error: { code: "SERVER_ERROR", message: err.message || "Something went wrong." } },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!sessionCookie) {
            return NextResponse.json({ success: true, data: null });
        }
        try {
            const auth = adminAuth();
            const decoded = await auth.verifySessionCookie(sessionCookie);
            await auth.revokeRefreshTokens(decoded.uid);
        } catch (err) {
            console.error("Session revoke error:", err);
        }

        const response = NextResponse.json({ success: true, data: null });

        response.cookies.set(SESSION_COOKIE_NAME, "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
        });

        return response;
    } catch (err) {
        console.error("Session deletion error:", err);
        return NextResponse.json(
            { success: false, error: { code: "SERVER_ERROR", message: "Something went wrong." } },
            { status: 500 }
        );
    }
}