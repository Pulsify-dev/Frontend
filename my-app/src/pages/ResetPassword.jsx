import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

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

function CheckIcon() {
  return (
    <svg
      className="auth-check-icon"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation
  const isPasswordValid = password.length >= 8;
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }

    if (!password) {
      setError("Please enter a new password");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password");
      return;
    }

    if (!isPasswordMatch) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { 
          state: { message: "Password reset successful. Please sign in with your new password." }
        });
      }, 3000);
    } catch (err) {
      setError(err?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  // No token state
  if (!token) {
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

            <h1 className="auth-title">Invalid Reset Link</h1>
            <p className="auth-subtitle">
              This password reset link is invalid or has expired.
            </p>

            <Link
              to="/forgot-password"
              className="auth-submit-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                marginTop: "16px",
              }}
            >
              Request new link
            </Link>

            <div className="auth-footer-row" style={{ marginTop: "16px" }}>
              <Link to="/login" className="auth-link">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
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

            <h1 className="auth-title">Password Reset Complete</h1>
            <p className="auth-subtitle">
              Your password has been successfully reset.
            </p>
            <p className="auth-subtitle">
              Redirecting you to sign in...
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
              Sign in now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob--tr" />
      <div className="auth-bg-blob auth-bg-blob--bl" />

      <div className="auth-card">
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

        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">
          Enter your new password below. Make sure it's at least 8 characters.
        </p>

        {error && <div className="auth-alert auth-alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-fields">
            <div className="auth-field auth-field--icon">
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="auth-input"
                autoComplete="new-password"
                autoFocus
              />
              {password && isPasswordValid && (
                <span className="auth-field-check">
                  <CheckIcon />
                </span>
              )}
            </div>
            {password && !isPasswordValid && (
              <p className="auth-field-hint auth-field-hint--error">
                Password must be at least 8 characters
              </p>
            )}

            <div className="auth-field auth-field--icon">
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`auth-input${confirmPassword && !isPasswordMatch ? " auth-input--error" : ""}`}
                autoComplete="new-password"
              />
              {confirmPassword && isPasswordMatch && (
                <span className="auth-field-check">
                  <CheckIcon />
                </span>
              )}
            </div>
            {confirmPassword && !isPasswordMatch && (
              <p className="auth-field-hint auth-field-hint--error">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isPasswordValid || !isPasswordMatch || isLoading}
            className={`auth-submit-btn${!isPasswordValid || !isPasswordMatch || isLoading ? " disabled" : ""}`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner /> Resetting password...
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
