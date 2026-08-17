import fs from "fs/promises";
import path from "path";

import { generateVerificationLink } from "./verification-link.js";
import { getVerificationOTP } from "./verification-otp.js";

export async function createVerificationEmail({
    email,
    firebaseUid,
    displayName,
}) {
    const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim().replace(/\/$/, "");
    const appUrl = rawAppUrl.startsWith("http") ? rawAppUrl : `http://${rawAppUrl}`;

    // Generate Firebase verification link
    const verificationLink = await generateVerificationLink(email);

    // Get or create OTP from MySQL (with auto-provisioning fallback)
    const verificationOTP = await getVerificationOTP(firebaseUid, { email, displayName });

    // Read HTML template
    const templatePath = path.join(
        process.cwd(),
        "emails",
        "verification.html"
    );

    let html = await fs.readFile(
        templatePath,
        "utf-8"
    );

    const safeDisplayName = displayName || "Learner";

    // Replace placeholders
    html = html
        .replaceAll("{{displayName}}", safeDisplayName)
        .replaceAll("{{verificationLink}}", verificationLink)
        .replaceAll("{{verificationOTP}}", verificationOTP)
        .replaceAll("{{recipientEmail}}", email)
        .replaceAll("{{appUrl}}", appUrl);

    // Plain text alternative (critical for passing Spam Assassin and inbox placement)
    const text = `
Verify your email address - Silver Loft LMS

Hello ${safeDisplayName},

Thank you for creating an account on Silver Loft LMS. To complete your account setup, please verify your email address.

Your 6-Digit Verification Code:
${verificationOTP}
(This code is valid for 15 minutes)

Or verify directly via this link:
${verificationLink}

Security Notice: Silver Loft LMS staff will never ask for your password or verification code. If you did not create an account, you can safely ignore this email.

© 2026 Silver Loft LMS. All rights reserved.
`.trim();

    return {
        html,
        text,
        verificationLink,
        verificationOTP,
    };
}