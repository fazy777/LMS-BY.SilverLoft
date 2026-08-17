import { useState } from "react";

interface SignupPageProps {
  onSignup: () => void;
  onLogin: () => void;
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

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return 0;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  if (password.length >= 10 && hasNumber && hasSpecial) return 4;
  if (password.length >= 8 && hasNumber) return 3;
  if (password.length >= 6) return 2;
  return 1;
}

const strengthConfig: { label: string; color: string }[] = [
  { label: "", color: "#E2E8F0" },
  { label: "Weak", color: "#DC2626" },
  { label: "Fair", color: "#EA580C" },
  { label: "Good", color: "#CA8A04" },
  { label: "Strong", color: "#16A34A" },
];

export default function SignupPage({ onSignup, onLogin }: SignupPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(password) as StrengthLevel;
  const strengthInfo = strengthConfig[strength];
  const confirmMismatch = confirmTouched && confirmPassword !== "" && confirmPassword !== password;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) errs.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Please enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password) errs.confirmPassword = "Passwords do not match.";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setConfirmTouched(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0 && agreedToTerms) {
      onSignup();
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#0B1B2E",
    marginBottom: "6px",
    fontFamily: "Inter, sans-serif",
  };

  const errorStyle: React.CSSProperties = {
    color: "#DC2626",
    fontSize: "12px",
    marginTop: "5px",
  };

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
          overflowY: "auto",
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
            Create your account
          </h1>
          <p style={{ fontSize: "15px", color: "#64748B", marginBottom: "32px" }}>
            Join 180,000+ learners growing their skills every day.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Full name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (submitted) setErrors((p) => ({ ...p, fullName: "" }));
                }}
                style={inputStyle(!!(submitted && errors.fullName))}
                onFocus={(e) => (e.target.style.borderColor = "#112A46")}
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    submitted && errors.fullName ? "#DC2626" : "#E2E8F0")
                }
              />
              {submitted && errors.fullName && (
                <p style={errorStyle}>{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitted) setErrors((p) => ({ ...p, email: "" }));
                }}
                style={inputStyle(!!(submitted && errors.email))}
                onFocus={(e) => (e.target.style.borderColor = "#112A46")}
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    submitted && errors.email ? "#DC2626" : "#E2E8F0")
                }
              />
              {submitted && errors.email && (
                <p style={errorStyle}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: "8px" }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (submitted) setErrors((p) => ({ ...p, password: "" }));
                  }}
                  style={{ ...inputStyle(!!(submitted && errors.password)), paddingRight: "50px" }}
                  onFocus={(e) => (e.target.style.borderColor = "#112A46")}
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      submitted && errors.password ? "#DC2626" : "#E2E8F0")
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
              {submitted && errors.password && (
                <p style={errorStyle}>{errors.password}</p>
              )}
            </div>

            {/* Strength bar */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    style={{
                      flex: 1,
                      height: "5px",
                      borderRadius: "99px",
                      backgroundColor:
                        strength >= seg ? strengthInfo.color : "#E2E8F0",
                      transition: "background-color 0.2s",
                    }}
                  />
                ))}
              </div>
              {password.length > 0 && (
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: strengthInfo.color,
                    margin: 0,
                  }}
                >
                  {strengthInfo.label}
                  {strength < 4 && (
                    <span style={{ fontWeight: 400, color: "#64748B" }}>
                      {strength === 1 && " — try 6+ characters"}
                      {strength === 2 && " — add a number"}
                      {strength === 3 && " — add a special character"}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Confirm password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (submitted) setErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  onBlur={() => setConfirmTouched(true)}
                  style={{
                    ...inputStyle(!!(submitted && errors.confirmPassword) || confirmMismatch),
                    paddingRight: "50px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#112A46")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
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
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {confirmMismatch && (
                <p style={errorStyle}>Passwords do not match.</p>
              )}
              {submitted && errors.confirmPassword && !confirmMismatch && (
                <p style={errorStyle}>{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                cursor: "pointer",
                marginBottom: "28px",
              }}
            >
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{
                  accentColor: "#112A46",
                  width: "16px",
                  height: "16px",
                  marginTop: "2px",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "14px", color: "#0B1B2E", lineHeight: "1.5" }}>
                I agree to the{" "}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: "#112A46", fontWeight: 600, textDecoration: "none" }}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{ color: "#112A46", fontWeight: 600, textDecoration: "none" }}
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Create Account button */}
            <button
              type="submit"
              disabled={!agreedToTerms}
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: agreedToTerms ? "#112A46" : "#94A3B8",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                cursor: agreedToTerms ? "pointer" : "not-allowed",
                letterSpacing: "0.2px",
                transition: "background-color 0.15s",
                marginBottom: "28px",
              }}
              onMouseEnter={(e) => {
                if (agreedToTerms) e.currentTarget.style.backgroundColor = "#1a3d63";
              }}
              onMouseLeave={(e) => {
                if (agreedToTerms) e.currentTarget.style.backgroundColor = "#112A46";
              }}
            >
              Create Account
            </button>

            {/* Sign in link */}
            <p style={{ textAlign: "center", fontSize: "14px", color: "#64748B" }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={onLogin}
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
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
