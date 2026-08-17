import { useState } from "react";

interface LoginPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const BooksIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="28" width="12" height="16" rx="2" fill="#ACC8E5" />
    <rect x="6" y="26" width="12" height="16" rx="2" fill="#7BADD4" />
    <rect x="8" y="24" width="12" height="16" rx="2" fill="#ACC8E5" />
    <rect x="22" y="20" width="14" height="20" rx="2" fill="#ACC8E5" />
    <rect x="24" y="18" width="14" height="20" rx="2" fill="#7BADD4" />
    <rect x="26" y="16" width="14" height="20" rx="2" fill="#ACC8E5" />
    <rect x="8" y="38" width="32" height="3" rx="1.5" fill="rgba(172,200,229,0.4)" />
  </svg>
);

export default function LoginPage({ onLogin, onSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email address.";
    if (!password) newErrors.password = "Password is required.";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onLogin();
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    height: "50px",
    border: `1.5px solid ${hasError ? "#DC2626" : "#E2E8F0"}`,
    borderRadius: "12px",
    padding: "0 16px",
    fontSize: "15px",
    fontFamily: "Inter, sans-serif",
    color: "#0B1B2E",
    backgroundColor: "#FFFFFF",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#EAF1FA",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          width: "40%",
          minWidth: "320px",
          backgroundColor: "#112A46",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Constellation dot grid via radial-gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(172,200,229,0.35) 1.5px, transparent 1.5px)",
            backgroundSize: "36px 36px",
            pointerEvents: "none",
          }}
        />
        {/* Subtle glow blobs */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "-20%",
            width: "60%",
            height: "60%",
            background: "radial-gradient(circle, rgba(172,200,229,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            right: "-15%",
            width: "55%",
            height: "55%",
            background: "radial-gradient(circle, rgba(172,200,229,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", textAlign: "center", maxWidth: "320px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginBottom: "16px" }}>
            <BooksIcon />
            <span
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: "28px",
                color: "#FFFFFF",
                letterSpacing: "-0.3px",
              }}
            >
              Silver Loft
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 600,
              fontSize: "18px",
              color: "#ACC8E5",
              marginBottom: "52px",
              letterSpacing: "0.2px",
            }}
          >
            Learn without limits.
          </p>

          {/* Trust badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { icon: "🔒", label: "256-bit Encryption" },
              { icon: "✅", label: "SOC 2 Compliant" },
              { icon: "🎓", label: "180K+ Students" },
            ].map((badge) => (
              <div
                key={badge.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: "rgba(172,200,229,0.12)",
                  border: "1px solid rgba(172,200,229,0.25)",
                  borderRadius: "12px",
                  padding: "12px 18px",
                }}
              >
                <span style={{ fontSize: "18px" }}>{badge.icon}</span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "#ACC8E5",
                  }}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <h1
            style={{
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              fontSize: "28px",
              color: "#112A46",
              marginBottom: "8px",
              letterSpacing: "-0.3px",
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: "15px", color: "#64748B", marginBottom: "36px" }}>
            Sign in to continue your learning journey.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0B1B2E",
                  marginBottom: "6px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitted) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                style={inputStyle(!!errors.email)}
                onFocus={(e) => (e.target.style.borderColor = "#112A46")}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.email ? "#DC2626" : "#E2E8F0")
                }
              />
              {errors.email && (
                <p style={{ color: "#DC2626", fontSize: "12px", marginTop: "5px" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0B1B2E",
                  marginBottom: "6px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (submitted) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  style={{ ...inputStyle(!!errors.password), paddingRight: "50px" }}
                  onFocus={(e) => (e.target.style.borderColor = "#112A46")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = errors.password ? "#DC2626" : "#E2E8F0")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748B",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && (
                <p style={{ color: "#DC2626", fontSize: "12px", marginTop: "5px" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Keep signed in + Forgot password */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "28px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#0B1B2E",
                }}
              >
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  style={{ accentColor: "#112A46", width: "16px", height: "16px" }}
                />
                Keep me signed in
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  fontSize: "14px",
                  color: "#112A46",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: "#112A46",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                letterSpacing: "0.2px",
                transition: "background-color 0.15s",
                marginBottom: "24px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a3d63")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#112A46")}
            >
              Sign In
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
              <span style={{ fontSize: "13px", color: "#64748B", whiteSpace: "nowrap" }}>
                or continue with
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
            </div>

            {/* Google SSO */}
            <button
              type="button"
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: "#FFFFFF",
                color: "#0B1B2E",
                border: "1.5px solid #E2E8F0",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "background-color 0.15s",
                marginBottom: "32px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Sign up link */}
            <p style={{ textAlign: "center", fontSize: "14px", color: "#64748B" }}>
              {"Don't have an account? "}
              <button
                type="button"
                onClick={onSignup}
                style={{
                  background: "none",
                  border: "none",
                  color: "#112A46",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "0",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Sign up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
