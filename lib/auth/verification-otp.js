import db from "../db.js";
import { adminAuth } from "../auth.js";

/**
 * Generate a random 6-digit numeric OTP.
 */
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate and store a fresh 6-digit OTP with expiration for the user.
 * Supports auto-provisioning the user row if not yet present in MySQL.
 * Default expiration is 15 minutes.
 */
export async function saveVerificationOTP(firebaseUid, { email = null, displayName = null, expiresInMinutes = 15 } = {}) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // 1. Try updating existing user row
    const [result] = await db.query(
        `
        UPDATE users
        SET verificationOTP = ?,
            verificationOTPExpiresAt = ?
        WHERE firebase_uid = ?
          AND deleted_at IS NULL
        `,
        [otp, expiresAt, firebaseUid]
    );

    // 2. If no existing row found and email is available, provision the user row with the OTP
    if (result.affectedRows === 0 && email) {
        await db.query(
            `
            INSERT INTO users (firebase_uid, email, display_name, verificationOTP, verificationOTPExpiresAt)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                verificationOTP = VALUES(verificationOTP),
                verificationOTPExpiresAt = VALUES(verificationOTPExpiresAt)
            `,
            [firebaseUid, email, displayName, otp, expiresAt]
        );
    }

    return otp;
}

/**
 * Fetch or create a valid OTP for a user.
 */
export async function getVerificationOTP(firebaseUid, { email = null, displayName = null } = {}) {
    const [rows] = await db.query(
        `
        SELECT verificationOTP, verificationOTPExpiresAt
        FROM users
        WHERE firebase_uid = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [firebaseUid]
    );

    if (rows.length === 0) {
        // Auto-provision if user row doesn't exist yet
        return await saveVerificationOTP(firebaseUid, { email, displayName });
    }

    const { verificationOTP, verificationOTPExpiresAt } = rows[0];

    // If OTP exists and has not expired, return it
    if (verificationOTP && verificationOTPExpiresAt && new Date(verificationOTPExpiresAt) > new Date()) {
        return verificationOTP;
    }

    // Otherwise generate and store a new active OTP
    return await saveVerificationOTP(firebaseUid, { email, displayName });
}

/**
 * Verify the submitted 6-digit OTP against MySQL and synchronize with Firebase Auth.
 */
export async function verifyUserOTP({ firebaseUid, otp }) {
    if (!firebaseUid || !otp) {
        throw new Error("Firebase UID and OTP are required.");
    }

    const cleanOTP = String(otp).trim();

    const [rows] = await db.query(
        `
        SELECT id, firebase_uid, email, verificationOTP, verificationOTPExpiresAt, email_verified
        FROM users
        WHERE firebase_uid = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [firebaseUid]
    );

    if (rows.length === 0) {
        throw new Error("Account not found.");
    }

    const user = rows[0];

    if (!user.verificationOTP) {
        throw new Error("No active verification code found. Please request a new code.");
    }

    if (user.verificationOTPExpiresAt && new Date(user.verificationOTPExpiresAt) < new Date()) {
        throw new Error("Verification code has expired. Please request a new code.");
    }

    if (user.verificationOTP !== cleanOTP) {
        throw new Error("Invalid verification code. Please check and try again.");
    }

    // Mark as verified in MySQL and clear the used OTP
    await db.query(
        `
        UPDATE users
        SET email_verified = TRUE,
            verificationOTP = NULL,
            verificationOTPExpiresAt = NULL
        WHERE id = ?
        `,
        [user.id]
    );

    // Synchronize emailVerified status with Firebase Auth
    try {
        const auth = adminAuth();
        await auth.updateUser(firebaseUid, {
            emailVerified: true,
        });
    } catch (fbErr) {
        console.warn("Could not sync emailVerified to Firebase Auth:", fbErr.message);
    }

    return {
        success: true,
        message: "Email verified successfully.",
        userId: user.id,
    };
}