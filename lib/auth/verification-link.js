import { adminAuth } from "../auth.js";

export async function generateVerificationLink(email) {
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cleanAppUrl = rawAppUrl.trim().replace(/\/$/, "");
    const appUrl = cleanAppUrl.startsWith("http://") || cleanAppUrl.startsWith("https://")
        ? cleanAppUrl
        : `http://${cleanAppUrl}`;

    const defaultVerifyUrl = `${appUrl}/verify`;

    if (!email) {
        return defaultVerifyUrl;
    }

    const actionCodeSettings = {
        url: defaultVerifyUrl,
        handleCodeInApp: true,
    };

    try {
        const auth = adminAuth();
        const verificationLink = await auth.generateEmailVerificationLink(
            email,
            actionCodeSettings
        );
        return verificationLink;
    } catch (err) {
        console.warn(`[verification-link] Notice: ${err.message}. Using app verification URL fallback.`);
        return defaultVerifyUrl;
    }
}