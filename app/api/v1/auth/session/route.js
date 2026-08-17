import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth.js";
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

        // 1. Decode & verify the token structure
        let decodedToken;
        try {
            decodedToken = decodeJwt(idToken);
            if (!decodedToken || (!decodedToken.sub && !decodedToken.uid)) {
                throw new Error("Invalid token payload");
            }
        } catch (err) {
            console.error("Token decoding error:", err);
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_TOKEN",
                        message: "Token verification failed.",
                        details: err.message
                    }
                },
                { status: 401 }
            );
        }

        const firebaseUid = decodedToken.sub || decodedToken.uid;
        const email = decodedToken.email;
        const tokenDisplayName = decodedToken.name;
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

        // 4. Create a secure server-side session token
        const expiresIn = 60 * 60 * 24 * 14; // 14 days in seconds
        const sessionCookie = await createSessionToken({
            uid: firebaseUid,
            email,
            id: userRow.id,
            is_admin: Boolean(userRow.is_admin || isSuperAdminEmail),
            is_instructor: Boolean(userRow.is_instructor || isSuperAdminEmail),
        }, expiresIn);

        // 5. Set it as HTTP-only, Secure cookie
        const response = NextResponse.json({
            success: true,
            data: {
                id: userRow.id,
                email,
                display_name: userRow.display_name,
                is_instructor: Boolean(userRow.is_instructor || isSuperAdminEmail),
                is_admin: Boolean(userRow.is_admin || isSuperAdminEmail),
            },
        });

        response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: expiresIn,
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