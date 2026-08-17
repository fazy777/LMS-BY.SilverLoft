"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, sendEmailVerification } from "firebase/auth";
import { Authentication, googleProvider } from "../../../lib/firebase-client.js";

// Palette (matches LoginPage)
// primary   #112A46  (deep navy)
// secondary #ACC8E5  (sky blue)
// tint      #EAF1FA  (secondary at low opacity, used as page bg)
// ink       #0B1B2E  (near-black, darker than primary, for body text)

export default function SignupPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [focused, setFocused] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const strength = (() => {
        if (!password) return 0;
        let s = 0;
        if (password.length >= 8) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    })();
    const strengthLabel = ["Weak", "Weak", "Fair", "Good", "Strong"][strength];
    const strengthColor = ["#D9534F", "#D9534F", "#E0A82E", "#5C9AD1", "#112A46"][strength];

    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case "auth/email-already-in-use":
                return "An account with this email already exists.";
            case "auth/invalid-email":
                return "The email address is invalid.";
            case "auth/operation-not-allowed":
                return "Email/password accounts are not enabled in Firebase console.";
            case "auth/weak-password":
                return "Password must be at least 6 characters long.";
            case "auth/popup-closed-by-user":
                return "Google sign-in popup was closed before finishing.";
            default:
                return "Failed to create account. Please check your details and try again.";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (password !== confirm) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(Authentication, email.trim(), password);
            if (name.trim()) {
                await updateProfile(userCredential.user, {
                    displayName: name.trim()
                });
            }
            // Force refresh to get updated token with new displayName claim
            const idToken = await userCredential.user.getIdToken(true);

            const res = await fetch("/api/v1/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, displayName: name.trim() }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setSuccessMessage("Account created successfully! Redirecting to verification...");
                
                // Fire verification email in background without blocking redirection
                fetch("/api/v1/auth/send-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken, displayName: name.trim() }),
                }).catch((vErr) => {
                    console.warn("Verification email background trigger error:", vErr);
                });

                setTimeout(() => {
                    router.push("/verify");
                }, 600);
            } else {
                console.error("Failed to create session:", data);
                setErrorMessage(data?.error?.message || "Failed to create session on server.");
            }
        } catch (error) {
            console.error("Signup error:", error);
            setErrorMessage(error?.code ? getFirebaseErrorMessage(error.code) : (error.message || "Failed to create account."));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        setGoogleLoading(true);
        try {
            const userCredential = await signInWithPopup(Authentication, googleProvider);
            const idToken = await userCredential.user.getIdToken();
            const displayName = userCredential.user.displayName;

            const res = await fetch("/api/v1/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, displayName }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setSuccessMessage("Signed in with Google successfully! Redirecting...");
                setTimeout(() => {
                    router.push("/dashboard");
                }, 1000);
            } else {
                console.error("Failed to create session:", data);
                setErrorMessage(data?.error?.message || "Failed to create session on server.");
            }
        } catch (error) {
            console.error("Google sign up error:", error);
            setErrorMessage(error?.code ? getFirebaseErrorMessage(error.code) : (error.message || "Failed to sign up with Google."));
        } finally {
            setGoogleLoading(false);
        }
    };

    const fieldClasses = (fieldName) =>
        `flex items-center rounded-xl border bg-white px-3.5 transition-colors ${focused === fieldName
            ? "border-[#112A46] ring-4 ring-[#ACC8E5]/40"
            : "border-[#112A46]/15"
        }`;

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
                            <linearGradient id="fade2" x1="0" y1="0" x2="0" y2="1">
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
                                            <line x1={x} y1={y} x2={nx} y2={y} stroke="url(#fade2)" strokeWidth="1" />
                                        )}
                                        {row < 6 && (
                                            <line x1={x} y1={y} x2={x} y2={ny} stroke="url(#fade2)" strokeWidth="1" />
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
                            Build your profile.<br />Claim your seat.
                        </h1>
                        <p className="mt-4 text-[15px] leading-relaxed text-[#ACC8E5]/85">
                            Join verified learners on a single, secured identity.
                            One account covers your courses, grades, and credentials.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-6 text-[13px] text-[#ACC8E5]/70">
                        <span>256-bit encryption</span>
                        <span className="h-1 w-1 rounded-full bg-[#ACC8E5]/40" />
                        <span>SOC 2 in progress</span>
                    </div>
                </div>

                {/* Right panel — form */}
                <div className="flex flex-col justify-center px-8 py-10 sm:px-14 sm:py-12">
                    <div className="w-full max-w-sm mx-auto">
                        <div className="mb-7 lg:hidden flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-lg bg-[#112A46] flex items-center justify-center">
                                <Lock size={17} className="text-[#ACC8E5]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[15px] font-semibold tracking-wide text-[#112A46]">Silver Loft</span>
                        </div>

                        <h2 className="text-[26px] font-semibold text-[#112A46] tracking-tight">Create an account</h2>
                        <p className="mt-1 text-[14.5px] text-[#112A46]/55">
                            Start learning with the Silver Loft LMS.
                        </p>

                        {errorMessage && (
                            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13.5px] flex items-center gap-2.5">
                                <AlertCircle size={17} className="shrink-0 text-red-500" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mt-4 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[13.5px] flex items-center gap-2.5">
                                <CheckCircle2 size={17} className="shrink-0 text-green-500" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="name" className="block text-[13px] font-bold text-[#112A46] mb-1">
                                    Full name
                                </label>
                                <div className={fieldClasses("name")}>
                                    <User size={17} className="text-[#64748B] shrink-0" />
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onFocus={() => setFocused("name")}
                                        onBlur={() => setFocused(null)}
                                        placeholder="Jane Doe"
                                        className="w-full bg-transparent border-0 outline-none py-2.5 px-2.5 text-[14.5px] text-[#0B1B2E] placeholder:text-[#94A3B8]"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-[13px] font-bold text-[#112A46] mb-1">
                                    Email
                                </label>
                                <div className={fieldClasses("email")}>
                                    <Mail size={17} className="text-[#64748B] shrink-0" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocused("email")}
                                        onBlur={() => setFocused(null)}
                                        placeholder="you@company.com"
                                        className="w-full bg-transparent border-0 outline-none py-2.5 px-2.5 text-[14.5px] text-[#0B1B2E] placeholder:text-[#94A3B8]"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-[13px] font-bold text-[#112A46] mb-1">
                                    Password
                                </label>
                                <div className={fieldClasses("password")}>
                                    <Lock size={17} className="text-[#64748B] shrink-0" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocused("password")}
                                        onBlur={() => setFocused(null)}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent border-0 outline-none py-2.5 px-2.5 text-[14.5px] text-[#0B1B2E] placeholder:text-[#94A3B8]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="text-[#64748B] hover:text-[#112A46] transition-colors shrink-0 cursor-pointer"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>

                                {password && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex gap-1 h-1">
                                            {[1, 2, 3, 4].map((idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        backgroundColor: idx <= strength ? strengthColor : "#112A4615",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-[#112A46]/45">Strength</span>
                                            <span style={{ color: strengthColor }} className="font-medium">
                                                {strengthLabel}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirm" className="block text-[13px] font-medium text-[#112A46]/80 mb-1">
                                    Confirm password
                                </label>
                                <div className={fieldClasses("confirm")}>
                                    <Lock size={17} className="text-[#112A46]/40 shrink-0" />
                                    <input
                                        id="confirm"
                                        type={showConfirm ? "text" : "password"}
                                        required
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        onFocus={() => setFocused("confirm")}
                                        onBlur={() => setFocused(null)}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent border-0 outline-none py-2.5 px-2.5 text-[14.5px] text-[#112A46] placeholder:text-[#112A46]/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((s) => !s)}
                                        className="text-[#112A46]/40 hover:text-[#112A46] transition-colors shrink-0 cursor-pointer"
                                        aria-label={showConfirm ? "Hide password" : "Show password"}
                                    >
                                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>

                            {/* Terms */}
                            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    required
                                    className="h-4 w-4 mt-0.5 rounded border-[#112A46]/25 text-[#112A46] focus:ring-[#ACC8E5] accent-[#112A46]"
                                />
                                <span className="text-[12.5px] text-[#112A46]/65 leading-tight">
                                    I agree to the{" "}
                                    <a href="#" className="font-semibold text-[#112A46] hover:underline">
                                        Terms of Service
                                    </a>{" "}
                                    and{" "}
                                    <a href="#" className="font-semibold text-[#112A46] hover:underline">
                                        Privacy Policy
                                    </a>
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={loading || googleLoading}
                                className="w-full mt-3! flex items-center justify-center gap-2 rounded-xl bg-[#112A46] text-white text-[14.5px] font-semibold py-3.5 hover:bg-[#0B1B2E] active:scale-[0.99] transition-all disabled:opacity-70 cursor-pointer"
                            >
                                {loading ? (
                                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    <>
                                        Create account
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-5 flex items-center gap-3">
                            <div className="h-px flex-1 bg-[#112A46]/10" />
                            <span className="text-[12.5px] text-[#112A46]/40">or</span>
                            <div className="h-px flex-1 bg-[#112A46]/10" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignUp}
                            disabled={loading || googleLoading}
                            className="mt-4 w-full flex items-center justify-center gap-2.5 rounded-xl border border-[#112A46]/15 py-3 text-[14px] font-medium text-[#112A46] hover:bg-[#EAF1FA] transition-colors cursor-pointer disabled:opacity-60"
                        >
                            {googleLoading ? (
                                <span className="h-4 w-4 rounded-full border-2 border-[#112A46]/30 border-t-[#112A46] animate-spin" />
                            ) : (
                                <>
                                    <svg width="17" height="17" viewBox="0 0 48 48">
                                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.5 29.4 35.5 24 35.5c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z" />
                                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.6 3.5 24 3.5c-7.7 0-14.4 4.3-17.7 11.2z" />
                                        <path fill="#4CAF50" d="M24 44.5c5.5 0 10.3-1.8 14.1-5l-6.5-5.5c-2.1 1.5-4.8 2.5-7.6 2.5-5.4 0-9.9-3-11.6-7.4l-6.5 5C9.5 40.1 16.2 44.5 24 44.5z" />
                                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.5-2.5 4.6-4.7 6l6.5 5.5C40.7 36.8 44.5 31 44.5 24c0-1.2-.1-2.4-.9-3.5z" />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </button>

                        <p className="mt-6 text-center text-[13.5px] text-[#112A46]/55">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-[#112A46] hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
