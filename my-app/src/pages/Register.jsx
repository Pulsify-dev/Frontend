import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mockRegister, mockOAuthLogin } from "@/mocks/mockService";

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

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);

  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const isPasswordMatch =
    password && confirmPassword && password === confirmPassword;
  const isDisplayNameValid = displayName.trim().length >= 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password || !confirmPassword || !displayName.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email address");
      return;
    }
    if (!isPasswordValid) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!isPasswordMatch) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptTerms) {
      setError("Please accept the terms to continue");
      return;
    }
    const usernameBase =
      displayName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 16) || email.split("@")[0];
    setIsLoading(true);
    try {
      const result = await mockRegister({
        email: email.trim(),
        password,
        username: usernameBase,
        displayName: displayName.trim(),
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
      });
      setSuccess(result.message);
      setTimeout(() => console.log("Registered as:", result.user), 1500);
    } catch (err) {
      setError(err?.message || "Unable to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (provider) => {
    setError("");
    setSuccess("");
    setLoadingProvider(provider);
    try {
      const result = await mockOAuthLogin(provider);
      setSuccess(result.message);
    } catch (err) {
      setError(err?.message || `Unable to sign up with ${provider}.`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob--tl" />
      <div className="auth-bg-blob auth-bg-blob--br" />

      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          By signing up, you agree to SoundCloud's{" "}
          <a href="#" className="auth-link">
            Terms of Use
          </a>{" "}
          and acknowledge our{" "}
          <a href="#" className="auth-link">
            Privacy Policy.
          </a>
        </p>

        {success && (
          <div className="auth-alert auth-alert--success">
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {success}
          </div>
        )}
        {error && <div className="auth-alert auth-alert--error">{error}</div>}

        <div className="auth-oauth-group">
          <button
            className="auth-oauth-btn auth-oauth-btn--facebook"
            onClick={() => handleOAuthSignup("facebook")}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === "facebook" ? (
              <LoadingSpinner />
            ) : (
              <>
                <FacebookIcon /> Sign up with Facebook
              </>
            )}
          </button>
          <button
            className="auth-oauth-btn auth-oauth-btn--google"
            onClick={() => handleOAuthSignup("google")}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === "google" ? (
              <LoadingSpinner />
            ) : (
              <>
                <GoogleIcon /> Sign up with Google
              </>
            )}
          </button>
          <button
            className="auth-oauth-btn auth-oauth-btn--apple"
            onClick={() => handleOAuthSignup("apple")}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === "apple" ? (
              <LoadingSpinner />
            ) : (
              <>
                <AppleIcon /> Sign up with Apple
              </>
            )}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-fields">
            <div className="auth-field auth-field--icon">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="auth-input"
              />
              {isEmailValid && (
                <span className="auth-field-check">
                  <CheckIcon />
                </span>
              )}
            </div>
            <div className="auth-field auth-field--icon">
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="auth-input"
              />
              {isPasswordValid && (
                <span className="auth-field-check">
                  <CheckIcon />
                </span>
              )}
            </div>
            <div className="auth-field auth-field--icon">
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`auth-input${confirmPassword && !isPasswordMatch ? " auth-input--error" : ""}`}
              />
              {isPasswordMatch && (
                <span className="auth-field-check">
                  <CheckIcon />
                </span>
              )}
            </div>
            <div className="auth-field auth-field--icon">
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                className="auth-input"
              />
              {isDisplayNameValid && (
                <span className="auth-field-check">
                  <CheckIcon />
                </span>
              )}
            </div>
            <div className="auth-field-row">
              <input
                type="number"
                placeholder="Age (optional)"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                disabled={isLoading}
                min="13"
                max="120"
                className="auth-input"
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={isLoading}
                className="auth-input auth-select"
              >
                <option value="" disabled>
                  Gender (optional)
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="custom">Custom</option>
                <option value="prefer-not">Prefer not to say</option>
              </select>
            </div>
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={isLoading}
                className="auth-checkbox"
              />
              <span className="auth-checkbox-text">
                I agree to receive marketing communications from SoundCloud. I
                can unsubscribe at any time as described in the{" "}
                <a href="#" className="auth-link">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`auth-submit-btn${isLoading ? " disabled" : ""}`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner /> Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="auth-footer-row">
          <a href="#" className="auth-link">
            Need help?
          </a>
          <Link to="/login" className="auth-link">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
