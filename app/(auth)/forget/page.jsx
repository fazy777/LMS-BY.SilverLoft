"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Lock, Mail, MailCheck, AlertCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Authentication } from "../../../lib/firebase-client.js";

// Palette (matches LoginPage / SignupPage / LMSDashboard)
// primary   #112A46  (deep navy)
// secondary #ACC8E5  (sky blue)
// tint      #EAF1FA  (secondary at low opacity, page bg)

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [focused, setFocused] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case "auth/invalid-email":
                return "The email address is invalid.";
            case "auth/user-not-found":
                return "No account found with this email address.";
            case "auth/too-many-requests":
                return "Too many attempts. Please try again later.";
            default:
                return "Failed to send reset link. Please try again.";
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!email.trim()) return;

        setErrorMessage("");
        setLoading(true);

        try {
            await sendPasswordResetEmail(Authentication, email.trim());
            setSent(true);
        } catch (error) {
            console.error("Password reset error:", error);
            setErrorMessage(error?.code ? getFirebaseErrorMessage(error.code) : (error.message || "Failed to send reset email."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#EAF1FA] flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(17,42,70,0.35)] bg-white">

                {/* Left panel — brand / signature */}
                <div className="relative hidden lg:flex flex-col justify-between bg-[#112A46] text-white p-12 overflow-hidden">
                    <svg
                        className="absolute inset-0 h-full w-full opacity-[0.35]"
                        viewBox="0 0 400 560"
                        fill="none"
                        preserveAspectRatio="xMidYMid slice"
                    >
                        <defs>
                            <linearGradient id="fade3" x1="0" y1="0" x2="0" y2="1">
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
                                            <line x1={x} y1={y} x2={nx} y2={y} stroke="url(#fade3)" strokeWidth="1" />
                                        )}
                                        {row < 6 && (
                                            <line x1={x} y1={y} x2={x} y2={ny} stroke="url(#fade3)" strokeWidth="1" />
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
                        <h1 className="text-[34px] leading-[1.15] font-semibold tracking-tight">
                            Locked out?<br />Let&apos;s fix that.
                        </h1>
                        <p className="mt-4 text-[15px] leading-relaxed text-[#ACC8E5]/85">
                            Reset links expire in 15 minutes and only work once —
                            same verification standard as every sign-in.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-6 text-[13px] text-[#ACC8E5]/70">
                        <span>256-bit encryption</span>
                        <span className="h-1 w-1 rounded-full bg-[#ACC8E5]/40" />
                        <span>SOC 2 in progress</span>
                    </div>
                </div>

                {/* Right panel — form */}
                <div className="flex flex-col justify-center px-8 py-12 sm:px-14 sm:py-16">
                    <div className="w-full max-w-sm mx-auto">
                        <div className="mb-9 lg:hidden flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-[#112A46] flex items-center justify-center">
                                <Lock size={17} className="text-[#ACC8E5]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[15px] font-semibold tracking-wide text-[#112A46]">Silver Loft</span>
                        </div>

                        {!sent ? (
                            <>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#112A46]/50 hover:text-[#112A46] transition-colors"
                                >
                                    <ArrowLeft size={14} />
                                    Back to sign in
                                </Link>

                                <h2 className="mt-5 text-[26px] font-semibold text-[#112A46] tracking-tight">
                                    Forgot your password?
                                </h2>
                                <p className="mt-1.5 text-[14.5px] text-[#112A46]/55 leading-relaxed">
                                    Enter the email on your account and we&apos;ll send you a link to reset it.
                                </p>

                                {errorMessage && (
                                    <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13.5px] flex items-center gap-2.5">
                                        <AlertCircle size={17} className="shrink-0 text-red-500" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-[13px] font-medium text-[#112A46]/80 mb-1.5">
                                            Email
                                        </label>
                                        <div
                                            className={`flex items-center rounded-xl border bg-white px-3.5 transition-colors ${focused ? "border-[#112A46] ring-4 ring-[#ACC8E5]/40" : "border-[#112A46]/15"
                                                }`}
                                        >
                                            <Mail size={17} className="text-[#112A46]/40 shrink-0" />
                                            <input
                                                id="email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onFocus={() => setFocused(true)}
                                                onBlur={() => setFocused(false)}
                                                placeholder="you@company.com"
                                                className="w-full bg-transparent border-0 outline-none py-3 px-2.5 text-[14.5px] text-[#112A46] placeholder:text-[#112A46]/30"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#112A46] text-white text-[14.5px] font-semibold py-3.5 hover:bg-[#0B1B2E] active:scale-[0.99] transition-all disabled:opacity-70 cursor-pointer"
                                    >
                                        {loading ? (
                                            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        ) : (
                                            <>
                                                Send reset link
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="mt-8 text-center text-[13.5px] text-[#112A46]/55">
                                    Don&apos;t have an account?{" "}
                                    <Link href="/signup" className="font-semibold text-[#112A46] hover:underline">
                                        Request access
                                    </Link>
                                </p>
                            </>
                        ) : (
                            <div className="text-center sm:text-left">
                                <div className="h-14 w-14 rounded-2xl bg-[#EAF1FA] flex items-center justify-center mx-auto sm:mx-0">
                                    <MailCheck size={24} className="text-[#112A46]" />
                                </div>

                                <h2 className="mt-6 text-[24px] font-semibold text-[#112A46] tracking-tight">
                                    Check your inbox
                                </h2>
                                <p className="mt-2 text-[14.5px] text-[#112A46]/55 leading-relaxed">
                                    We&apos;ve sent a password reset link to
                                </p>
                                <p className="text-[14.5px] font-semibold text-[#112A46]">{email}</p>

                                <button
                                    onClick={() => setSent(false)}
                                    className="w-full mt-8 rounded-xl border border-[#112A46]/15 py-3.5 text-[14px] font-medium text-[#112A46] hover:bg-[#EAF1FA] transition-colors cursor-pointer"
                                >
                                    Use a different email
                                </button>

                                <p className="mt-6 text-center sm:text-left text-[13px] text-[#112A46]/45">
                                    Didn&apos;t get it? Check spam, or{" "}
                                    <button
                                        onClick={handleSubmit}
                                        className="font-semibold text-[#112A46] hover:underline cursor-pointer"
                                    >
                                        resend the link
                                    </button>
                                    .
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
