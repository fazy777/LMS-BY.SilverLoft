"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Authentication, googleProvider } from "../../../lib/firebase-client.js";

// Palette
// primary   #112A46  (deep navy)
// secondary #ACC8E5  (sky blue)
// tint      #EAF1FA  (secondary at low opacity, used as page bg)
// ink       #0B1B2E  (near-black, darker than primary, for body text)

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get('redirect');

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [focused, setFocused] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
                return "Invalid email or password. Please try again.";
            case "auth/invalid-email":
                return "The email address is invalid.";
            case "auth/user-disabled":
                return "This account has been disabled.";
            case "auth/too-many-requests":
                return "Too many unsuccessful attempts. Please try again later.";
            case "auth/popup-closed-by-user":
                return "Google sign-in popup was closed before finishing.";
            default:
                return "Failed to sign in. Please check your credentials.";
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(Authentication, email.trim(), password);
            const idToken = await userCredential.user.getIdToken();
            
            const res = await fetch("/api/v1/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });
            
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                setSuccessMessage("Signed in successfully! Redirecting...");
                const target = redirectParam || (email.trim() === 'hafizmfaizanali@gmail.com' ? '/admin' : '/dashboard');
                router.push(target);
            } else {
                console.error("Failed to create session:", data);
                setErrorMessage(data?.error?.message || "Failed to create session on server.");
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrorMessage(error?.code ? getFirebaseErrorMessage(error.code) : (error.message || "Failed to sign in."));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
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
                const target = redirectParam || (userCredential.user.email === 'hafizmfaizanali@gmail.com' ? '/admin' : '/dashboard');
                setTimeout(() => {
                    router.push(target);
                }, 800);
            } else {
                console.error("Failed to create session:", data);
                setErrorMessage(data?.error?.message || "Failed to create session on server.");
            }
        } catch (error) {
            console.error("Google sign in error:", error);
            setErrorMessage(error?.code ? getFirebaseErrorMessage(error.code) : (error.message || "Failed to sign in with Google."));
        } finally {
            setGoogleLoading(false);
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
                            <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
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
                                            <line x1={x} y1={y} x2={nx} y2={y} stroke="url(#fade)" strokeWidth="1" />
                                        )}
                                        {row < 6 && (
                                            <line x1={x} y1={y} x2={x} y2={ny} stroke="url(#fade)" strokeWidth="1" />
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
                            Access, verified<br />before it&apos;s granted.
                        </h1>
                        <p className="mt-4 text-[15px] leading-relaxed text-[#ACC8E5]/85">
                            Every session on this network is checked, logged, and signed —
                            sign in to pick up right where your last one left off.
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

                        <h2 className="text-[26px] font-semibold text-[#112A46] tracking-tight">Welcome back</h2>
                        <p className="mt-1.5 text-[14.5px] text-[#112A46]/55">
                            Sign in with the email you registered with.
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

                        <form onSubmit={handleLogin} className="mt-6 space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-[13px] font-medium text-[#112A46]/80 mb-1.5">
                                    Email
                                </label>
                                <div
                                    className={`flex items-center rounded-xl border bg-white px-3.5 transition-colors ${focused === "email"
                                        ? "border-[#112A46] ring-4 ring-[#ACC8E5]/40"
                                        : "border-[#112A46]/15"
                                        }`}
                                >
                                    <Mail size={17} className="text-[#112A46]/40 shrink-0" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocused("email")}
                                        onBlur={() => setFocused(null)}
                                        placeholder="you@company.com"
                                        className="w-full bg-transparent border-0 outline-none py-3 px-2.5 text-[14.5px] text-[#0B1B2E] placeholder:text-[#94A3B8]"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="block text-[13px] font-bold text-[#112A46]">
                                        Password
                                    </label>
                                    <Link href="/forget" className="text-[12.5px] font-bold text-[#112A46] hover:underline transition-colors">
                                        Forgot?
                                    </Link>
                                </div>
                                <div
                                    className={`flex items-center rounded-xl border bg-white px-3.5 transition-colors ${focused === "password"
                                        ? "border-[#112A46] ring-4 ring-[#ACC8E5]/40"
                                        : "border-[#CBD5E1]"
                                        }`}
                                >
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
                                        className="w-full bg-transparent border-0 outline-none py-3 px-2.5 text-[14.5px] text-[#0B1B2E] placeholder:text-[#94A3B8]"
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
                            </div>

                            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#112A46] focus:ring-[#ACC8E5] accent-[#112A46]"
                                />
                                <span className="text-[13.5px] text-[#334155] font-medium">Keep me signed in</span>
                            </label>

                            <button
                                type="submit"
                                disabled={loading || googleLoading}
                                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#112A46] text-white text-[14.5px] font-semibold py-3.5 hover:bg-[#0B1B2E] active:scale-[0.99] transition-all disabled:opacity-70 cursor-pointer"
                            >
                                {loading ? (
                                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-7 flex items-center gap-3">
                            <div className="h-px flex-1 bg-[#112A46]/10" />
                            <span className="text-[12.5px] text-[#112A46]/40">or</span>
                            <div className="h-px flex-1 bg-[#112A46]/10" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading || googleLoading}
                            className="mt-5 w-full flex items-center justify-center gap-2.5 rounded-xl border border-[#112A46]/15 py-3 text-[14px] font-medium text-[#112A46] hover:bg-[#EAF1FA] transition-colors cursor-pointer disabled:opacity-60"
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

                        <p className="mt-8 text-center text-[13.5px] text-[#112A46]/55">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="font-semibold text-[#112A46] hover:underline">
                                Request access
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#EAF1FA] flex items-center justify-center text-[#112A46] font-semibold">Loading login...</div>}>
            <LoginForm />
        </Suspense>
    );
}
