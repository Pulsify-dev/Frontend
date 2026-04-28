import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { authService, getLoginRateLimit } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSocialToken,
  getAvailableProviders,
} from "@/services/socialAuthHelper";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
//added
const USE_MOCKS =
  String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === "true";

const buildMockUser = (role = "listener") => ({
  user_id: `mock-${role.toLowerCase()}-1`,
  username: `mock${role.toLowerCase()}`,
  email: `${role.toLowerCase()}@mock.pulsify.local`,
  display_name: `Mock ${role.charAt(0).toUpperCase() + role.slice(1)}`,
  tier: role === "artist" ? "Pro" : "Free",
  role: role,
  avatar_url: null,
});

const formatLoginCooldownLabel = (expiresAt) => {
  const remainingSeconds = Math.max(
    Math.ceil((Number(expiresAt) - Date.now()) / 1000),
    0,
  );

  if (!remainingSeconds) return "0s";

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (!minutes) {
    return `${seconds}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

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

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zm-2.02-15.03c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [loginRateLimit, setLoginRateLimit] = useState(() => getLoginRateLimit());
  const recaptchaRef = useRef(null);
  const submitGuardRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const availableProviders = getAvailableProviders();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/home";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (!loginRateLimit?.expiresAt) return undefined;

    const timerId = window.setInterval(() => {
      setLoginRateLimit(getLoginRateLimit());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [loginRateLimit?.expiresAt]);

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitGuardRef.current || isLoading) return;

    setError("");
    setSuccess("");

    const activeRateLimit = getLoginRateLimit();
    if (activeRateLimit) {
      setLoginRateLimit(activeRateLimit);
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    if (showCaptcha && !captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }

    submitGuardRef.current = true;
    setIsLoading(true);
    try {
      const result = await authService.login(trimmedEmail, password);

      setSuccess("Login successful! Redirecting...");
      setLoginRateLimit(getLoginRateLimit());
      login(result.user, result.access_token, result.refresh_token);
      setFailedAttempts(0);

      setTimeout(() => {
        const from = location.state?.from?.pathname || "/home";
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      if (err?.status === 429) {
        const nextRateLimit = getLoginRateLimit();
        setLoginRateLimit(nextRateLimit);
        return;
      }

      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 2 && RECAPTCHA_SITE_KEY) {
        setShowCaptcha(true);
      }
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaToken(null);

      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      submitGuardRef.current = false;
      setIsLoading(false);
    }
  };
  // added
  const handleMockLogin = (role = "listener") => {
    const mockUser = buildMockUser(role);
    const mockAccessToken = `mock-access-token-${role}`;
    const mockRefreshToken = `mock-refresh-token-${role}`;

    localStorage.setItem("userId", mockUser.user_id);
    localStorage.setItem("user_id", mockUser.user_id);
    localStorage.setItem("username", mockUser.username);
    localStorage.setItem("display_name", mockUser.display_name);

    login(mockUser, mockAccessToken, mockRefreshToken);

    const from = role === "Admin" ? "/admin" : (location.state?.from?.pathname || "/followers");
    navigate(from, { replace: true });
  };

  /**
   * Social login handler
   * 1. Get token from provider SDK (opens popup)
   * 2. Send token to backend POST /auth/social/:provider
   * 3. Backend returns access_token + refresh_token + user
   * 4. Log the user in via AuthContext
   */
  const handleOAuthLogin = async (provider) => {
    setError("");
    setSuccess("");
    setOauthLoading(provider);

    try {
      // Step 1: Get provider token via SDK popup
      const providerToken = await getSocialToken(provider);

      // Step 2: Send to backend
      const result = await authService.socialLogin(provider, providerToken);

      // Step 3: Login via AuthContext
      setSuccess(`Signed in with ${provider}! Redirecting...`);
      login(result.user, result.access_token, result.refresh_token);

      setTimeout(() => {
        const from = location.state?.from?.pathname || "/home";
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      setError(err?.message || `${provider} login failed. Please try again.`);
    } finally {
      setOauthLoading("");
    }
  };

  const isFormValid =
    email.trim() && password && (!showCaptcha || captchaToken);
  const loginCooldownLabel = loginRateLimit?.expiresAt
    ? formatLoginCooldownLabel(loginRateLimit.expiresAt)
    : "";
  const loginRateLimitMessage =
    loginRateLimit?.expiresAt && loginCooldownLabel
      ? `${loginRateLimit.message} Try again in ${loginCooldownLabel}.`
      : "";
  const anyLoading = isLoading || !!oauthLoading;

  return (
    <div className="auth-page">
      <div className="auth-bg-blob auth-bg-blob--tr" />
      <div className="auth-bg-blob auth-bg-blob--bl" />

      <div className="auth-card">
        <h1 className="auth-title">Sign in to Pulsify</h1>
        <p className="auth-subtitle">
          By signing in, you agree to Pulsify's{" "}
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
        {loginRateLimitMessage && (
          <div className="auth-alert auth-alert--error">
            {loginRateLimitMessage}
          </div>
        )}
        {error && <div className="auth-alert auth-alert--error">{error}</div>}

        {/* OAuth buttons — shown if any provider is configured */}
        {availableProviders.length > 0 && (
          <>
            <div className="auth-oauth-group">
              {availableProviders.includes("facebook") && (
                <button
                  className="auth-oauth-btn auth-oauth-btn--facebook"
                  onClick={() => handleOAuthLogin("facebook")}
                  disabled={anyLoading}
                  type="button"
                >
                  {oauthLoading === "facebook" ? (
                    <>
                      <LoadingSpinner /> Connecting...
                    </>
                  ) : (
                    <>
                      <FacebookIcon /> Continue with Facebook
                    </>
                  )}
                </button>
              )}
              {availableProviders.includes("google") && (
                <button
                  className="auth-oauth-btn auth-oauth-btn--google"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={anyLoading}
                  type="button"
                >
                  {oauthLoading === "google" ? (
                    <>
                      <LoadingSpinner /> Connecting...
                    </>
                  ) : (
                    <>
                      <GoogleIcon /> Continue with Google
                    </>
                  )}
                </button>
              )}
              {availableProviders.includes("apple") && (
                <button
                  className="auth-oauth-btn auth-oauth-btn--apple"
                  onClick={() => handleOAuthLogin("apple")}
                  disabled={anyLoading}
                  type="button"
                >
                  {oauthLoading === "apple" ? (
                    <>
                      <LoadingSpinner /> Connecting...
                    </>
                  ) : (
                    <>
                      <AppleIcon /> Continue with Apple
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="auth-divider">
              <span>or</span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-fields">
            <div className="auth-field">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={anyLoading}
                className="auth-input"
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={anyLoading}
                className="auth-input"
                autoComplete="current-password"
              />
            </div>
          </div>

          {showCaptcha && RECAPTCHA_SITE_KEY && (
            <div className="auth-captcha">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                onExpired={handleCaptchaExpired}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || anyLoading || !!loginRateLimitMessage}
            className={`auth-submit-btn${
              !isFormValid || anyLoading || !!loginRateLimitMessage
                ? " disabled"
                : ""
            }`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner /> Signing in...
              </>
            ) : loginRateLimitMessage ? (
              `Try again in ${loginCooldownLabel}`
            ) : (
              "Sign in"
            )}
          </button>
          {/* added */}
          {USE_MOCKS && (
            <div className="auth-footer-row" style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={() => handleMockLogin("listener")}
                disabled={anyLoading}
                className="auth-link"
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Continue as mock listener
              </button>
              <button
                type="button"
                onClick={() => handleMockLogin("artist")}
                disabled={anyLoading}
                className="auth-link"
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Continue as mock artist
              </button>
              <button
                type="button"
                onClick={() => handleMockLogin("Admin")}
                disabled={anyLoading}
                className="auth-link"
                style={{
                  background: "none",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Continue as mock admin
              </button>
            </div>
          )}
        </form>

        <div className="auth-footer-row">
          <Link to="/forgot-password" className="auth-link">
            Forgot your password?
          </Link>
          <Link to="/register" className="auth-link">
            Create account
          </Link>
        </div>

        <div className="auth-help-row">
          <a href="#" className="auth-link auth-link--muted">
            Need help?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
