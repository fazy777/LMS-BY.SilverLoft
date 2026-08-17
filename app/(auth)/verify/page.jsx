"use client";

import { useState, useEffect, useRef, useCallback, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";
import { applyActionCode, onAuthStateChanged } from "firebase/auth";
import { Authentication } from "../../../lib/firebase-client.js";

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    const inputRefs = useRef([]);

    // Handle verification if opened via Firebase Action Code (verification link)
    const handleFirebaseEmailAction = useCallback(async (code) => {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        try {
            await applyActionCode(Authentication, code);
            setSuccessMessage("Your email has been verified via link! Redirecting...");

            // Sync with backend if user is logged in
            if (Authentication.currentUser) {
                const idToken = await Authentication.currentUser.getIdToken(true);
                await fetch("/api/v1/auth/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken }),
                }).catch(() => {});
            }

            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (err) {
            console.error("Action code verification failed:", err);
            setErrorMessage("The verification link is invalid or has expired. Please enter the 6-digit code or request a new email.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    // Check Firebase Auth state & handle action codes from email links
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(Authentication, async (user) => {
            if (user) {
                setCurrentUser(user);
                setUserEmail(user.email || "");
            }
        });

        // Check if page was opened via Firebase verification link (oobCode query param)
        const oobCode = searchParams.get("oobCode");
        const mode = searchParams.get("mode");

        let actionTimer;
        if (oobCode && (mode === "verifyEmail" || !mode)) {
            actionTimer = setTimeout(() => {
                handleFirebaseEmailAction(oobCode);
            }, 0);
        }

        return () => {
            if (actionTimer) clearTimeout(actionTimer);
            unsubscribe();
        };
    }, [searchParams, handleFirebaseEmailAction]);

    // Handle 60s cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleOtpChange = (index, value) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        if (!cleaned) {
            const next = [...otp];
            next[index] = "";
            setOtp(next);
            return;
        }

        // If user typed or pasted multiple digits
        if (cleaned.length > 1) {
            const next = [...otp];
            const chars = cleaned.slice(0, 6).split("");
            chars.forEach((c, i) => {
                if (index + i < 6) {
                    next[index + i] = c;
                }
            });
            setOtp(next);
            const nextFocusIndex = Math.min(index + chars.length, 5);
            inputRefs.current[nextFocusIndex]?.focus();
            return;
        }

        const next = [...otp];
        next[index] = cleaned[0];
        setOtp(next);

        // Move to next input box
        if (index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
        if (!pastedData) return;

        const next = [...otp];
        pastedData.split("").forEach((char, i) => {
            if (i < 6) next[i] = char;
        });
        setOtp(next);
        const focusIdx = Math.min(pastedData.length, 5);
        inputRefs.current[focusIdx]?.focus();
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            setErrorMessage("Please enter the complete 6-digit code.");
            return;
        }

        setErrorMessage("");
        setSuccessMessage("");
        setLoading(true);

        try {
            let idToken = null;
            if (Authentication.currentUser) {
                idToken = await Authentication.currentUser.getIdToken(true);
            }

            const res = await fetch("/api/v1/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    otp: code,
                    email: userEmail || undefined,
                    idToken: idToken || undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setSuccessMessage("Email verified successfully! Taking you to your dashboard...");
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1200);
            } else {
                setErrorMessage(data?.error?.message || "Invalid verification code. Please try again.");
            }
        } catch (err) {
            console.error("Verification error:", err);
            setErrorMessage("Failed to verify code. Please check your network and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resending) return;
        setErrorMessage("");
        setSuccessMessage("");
        setResending(true);

        try {
            let idToken = null;
            if (Authentication.currentUser) {
                idToken = await Authentication.currentUser.getIdToken();
            }

            const res = await fetch("/api/v1/auth/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idToken: idToken || undefined,
                    email: userEmail || undefined,
                    firebaseUid: currentUser?.uid || undefined,
                    displayName: currentUser?.displayName || undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setSuccessMessage("A fresh verification code and link have been sent to your email!");
                setResendCooldown(60);
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            } else {
                setErrorMessage(data?.error?.message || "Failed to resend verification email. Please try again.");
            }
        } catch (err) {
            console.error("Resend error:", err);
            setErrorMessage("Failed to resend verification email. Please check your connection.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#EAF1FA] flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(17,42,70,0.35)] bg-white">

                {/* Left panel — brand / security showcase */}
                <div className="relative hidden lg:flex flex-col justify-between bg-[#112A46] text-white p-12 overflow-hidden">
                    <svg
                        className="absolute inset-0 h-full w-full opacity-[0.35]"
                        viewBox="0 0 400 560"
                        fill="none"
                        preserveAspectRatio="xMidYMid slice"
                    >
                        <defs>
                            <linearGradient id="fadeVerify" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ACC8E5" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#ACC8E5" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {Array.from({ length: 7 }).map((_, row) =>
                            Array.from({ length: 6 }).map((_, col) => {
                                const x = 20 + col * 72;
                                const y = 20 + row * 84;
                                const nx = x + 72;
                                const ny = y + 84;
                                return (
                                    <g key={`${row}-${col}`}>
                                        {col < 5 && (
                                            <line x1={x} y1={y} x2={nx} y2={y} stroke="url(#fadeVerify)" strokeWidth="1" />
                                        )}
                                        {row < 6 && (
                                            <line x1={x} y1={y} x2={x} y2={ny} stroke="url(#fadeVerify)" strokeWidth="1" />
                                        )}
                                        <circle cx={x} cy={y} r={(row + col) % 5 === 0 ? 3 : 1.4} fill="#ACC8E5" />
                                    </g>
                                );
                            })
                        )}
                    </svg>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-[#ACC8E5] flex items-center justify-center">
                                <Lock size={17} className="text-[#112A46]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[15px] font-semibold tracking-wide">Silver&nbsp;Loft</span>
                        </div>
                    </div>

                    <div className="relative z-10 max-w-sm">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ACC8E5]/15 text-[#ACC8E5] text-[13px] font-medium mb-4">
                            <ShieldCheck size={16} />
                            <span>Two-Way Verification</span>
                        </div>
                        <h1 className="text-[34px] leading-[1.15] font-semibold tracking-tight">
                            Verify your email.<br />Secure your identity.
                        </h1>
                        <p className="mt-4 text-[15px] leading-relaxed text-[#ACC8E5]/85">
                            Use either the 6-digit code or click the direct verification button in the email we delivered to you.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-6 text-[13px] text-[#ACC8E5]/70">
                        <span>Instant delivery</span>
                        <span className="h-1 w-1 rounded-full bg-[#ACC8E5]/40" />
                        <span>15-min code expiry</span>
                    </div>
                </div>

                {/* Right panel — verification form */}
                <div className="flex flex-col justify-center px-8 py-10 sm:px-14 sm:py-12">
                    <div className="w-full max-w-sm mx-auto">
                        <div className="mb-7 lg:hidden flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-[#112A46] flex items-center justify-center">
                                <Lock size={17} className="text-[#ACC8E5]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[15px] font-semibold tracking-wide text-[#112A46]">Silver Loft</span>
                        </div>

                        <div className="h-12 w-12 rounded-2xl bg-[#EAF1FA] flex items-center justify-center mb-4 text-[#112A46]">
                            <Mail size={22} />
                        </div>

                        <h2 className="text-[26px] font-semibold text-[#112A46] tracking-tight">
                            Verify your email
                        </h2>
                        <p className="mt-1 text-[14.5px] text-[#112A46]/60 leading-relaxed">
                            {userEmail ? (
                                <>
                                    We sent a 6-digit code to <strong className="text-[#112A46] font-semibold">{userEmail}</strong>
                                </>
                            ) : (
                                "Enter the 6-digit code sent to your registered email address."
                            )}
                        </p>

                        {errorMessage && (
                            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13.5px] flex items-start gap-2.5">
                                <AlertCircle size={17} className="shrink-0 text-red-500 mt-0.5" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mt-4 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[13.5px] flex items-start gap-2.5">
                                <CheckCircle2 size={17} className="shrink-0 text-green-500 mt-0.5" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                            <div>
                                <label className="block text-[13px] font-medium text-[#112A46]/80 mb-2.5">
                                    6-Digit Verification Code
                                </label>
                                <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => (inputRefs.current[idx] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className="w-12 h-14 sm:w-12 sm:h-14 text-center text-[22px] font-bold rounded-xl border border-[#112A46]/20 bg-[#F9FBFE] text-[#112A46] focus:border-[#112A46] focus:bg-white focus:ring-4 focus:ring-[#ACC8E5]/40 outline-none transition-all"
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.join("").length !== 6}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#112A46] text-white text-[14.5px] font-semibold py-3.5 hover:bg-[#0B1B2E] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                                {loading ? (
                                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    <>
                                        Verify Email
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Resend Action */}
                        <div className="mt-6 p-4 rounded-2xl bg-[#F4F8FC] border border-[#ACC8E5]/30 text-center">
                            <p className="text-[13px] text-[#112A46]/70">
                                Didn&apos;t receive the email or code expired?
                            </p>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending || resendCooldown > 0}
                                className="mt-2 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#112A46] hover:text-[#0B1B2E] hover:underline disabled:text-[#112A46]/40 disabled:no-underline cursor-pointer"
                            >
                                {resending ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        <span>Sending new code...</span>
                                    </>
                                ) : resendCooldown > 0 ? (
                                    <span>Resend code in {resendCooldown}s</span>
                                ) : (
                                    <>
                                        <RefreshCw size={14} />
                                        <span>Resend verification email</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="mt-6 text-center text-[13.5px] text-[#112A46]/55">
                            Wrong account?{" "}
                            <Link href="/login" className="font-semibold text-[#112A46] hover:underline">
                                Sign in with another email
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full bg-[#EAF1FA] flex items-center justify-center">
                <span className="h-8 w-8 rounded-full border-3 border-[#112A46]/30 border-t-[#112A46] animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}