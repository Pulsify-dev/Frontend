import { useState } from "react";
import { Link } from "react-router-dom";
import { mockForgotPassword } from "@/mocks/mockService";

function LoadingSpinner() {
  return (
    <svg
      className="auth-spinner"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="auth-spinner-track"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      await mockForgotPassword(email);
    } catch {
      // show success anyway to prevent email enumeration
    } finally {
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob--tr" />
      <div className="auth-bg-blob auth-bg-blob--bl" />

      <div className="auth-card">
        {!isSubmitted ? (
          <>
            <Link to="/login" className="auth-back-link">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to sign in
            </Link>

            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            {error && (
              <div className="auth-alert auth-alert--error">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-field auth-field--icon">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="auth-input"
                />
                <span className="auth-field-icon-right">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
              </div>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className={`auth-submit-btn${isLoading || !email.trim() ? " disabled" : ""}`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner /> Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>

            <div
              className="auth-footer-row"
              style={{ justifyContent: "center", marginTop: "24px" }}
            >
              <span className="auth-muted-text">Remember your password? </span>
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </div>
          </>
        ) : (
          <div className="auth-success-state">
            <div className="auth-success-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">If an account exists for</p>
            <p className="auth-email-display">{email}</p>
            <p className="auth-subtitle">
              you will receive a password reset link shortly.
            </p>

            <div className="auth-info-box">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="auth-link-btn"
                >
                  try again
                </button>
              </span>
            </div>

            <Link
              to="/login"
              className="auth-submit-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                marginTop: "8px",
              }}
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
