import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "@/services/authService";

function LoadingSpinner() {
  return (
    <svg
      className="auth-spinner auth-spinner--large"
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

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setError("Invalid or missing verification token.");
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err?.message || "Failed to verify email. The link may have expired.");
      }
    };

    verifyEmail();
  }, [token]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="auth-page">
        <div className="auth-bg-blob auth-bg-blob--tr" />
        <div className="auth-bg-blob auth-bg-blob--bl" />

        <div className="auth-card">
          <div className="auth-loading-state">
            <LoadingSpinner />
            <h1 className="auth-title">Verifying your email...</h1>
            <p className="auth-subtitle">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="auth-page">
        <div className="auth-bg-blob auth-bg-blob--tr" />
        <div className="auth-bg-blob auth-bg-blob--bl" />

        <div className="auth-card">
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

            <h1 className="auth-title">Email Verified!</h1>
            <p className="auth-subtitle">
              Your email has been successfully verified.
            </p>
            <p className="auth-subtitle">
              You can now sign in to your Pulsify account.
            </p>

            <Link
              to="/login"
              className="auth-submit-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                marginTop: "16px",
              }}
            >
              Sign in to Pulsify
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob--tr" />
      <div className="auth-bg-blob auth-bg-blob--bl" />

      <div className="auth-card">
        <div className="auth-error-state">
          <div className="auth-error-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          <h1 className="auth-title">Verification Failed</h1>
          <p className="auth-subtitle">{error}</p>

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
              If you're having trouble, try signing in. If your account isn't
              verified, we can send you a new verification email.
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
              marginTop: "16px",
            }}
          >
            Go to Sign In
          </Link>

          <div className="auth-footer-row" style={{ marginTop: "16px" }}>
            <Link to="/register" className="auth-link">
              Create a new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
