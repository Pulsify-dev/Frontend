/**
 * Register Page
 * SoundCloud-style registration page with OAuth and email registration
 * Enhanced with animations and mock service integration
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mockRegister, mockOAuthLogin } from "@/mocks/mockService";

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GoogleIcon = () => (
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

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Check Icon for valid input
function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

  // Validation helpers
  const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const isPasswordMatch = password && confirmPassword && password === confirmPassword;
  const isDisplayNameValid = displayName.trim().length >= 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nextEmail = email.trim();
    const nextPassword = password.trim();
    const nextConfirm = confirmPassword.trim();
    const nextDisplayName = displayName.trim();

    if (!nextEmail || !nextPassword || !nextConfirm || !nextDisplayName) {
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
      nextDisplayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 16) || nextEmail.split("@")[0];

    setIsLoading(true);

    try {
      const result = await mockRegister({
        email: nextEmail,
        password: nextPassword,
        username: usernameBase,
        displayName: nextDisplayName,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
      });
      setSuccess(result.message);
      
      setTimeout(() => {
        console.log("Registered as:", result.user);
      }, 1500);
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
      
      setTimeout(() => {
        console.log("OAuth registered as:", result.user);
      }, 1500);
    } catch (err) {
      setError(err?.message || `Unable to sign up with ${provider}. Please try again.`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 bg-[#111111]">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-tr from-orange-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div 
        className="w-full max-w-[560px] border border-[#2b2b2b] bg-[#111111]/95 backdrop-blur-sm rounded-sm px-14 py-12 text-white relative z-10"
        style={{ animation: 'fadeInUp 0.5s ease-out' }}
      >
        <h1 className="text-[28px] font-bold text-white mb-4 tracking-tight animate-slideDown">
          Create your account
        </h1>
        <p className="text-[13px] text-[#bdbdbd] mb-6 leading-relaxed opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          By signing up, you agree to SoundCloud&apos;s{" "}
          <a href="#" className="text-[#2f88ff] hover:underline transition-colors">
            Terms of Use
          </a>{" "}
          and acknowledge our{" "}
          <a href="#" className="text-[#2f88ff] hover:underline transition-colors">
            Privacy Policy.
          </a>
        </p>

        {/* Success Message */}
        {success && (
          <div className="mb-4 rounded-sm border border-green-500/30 bg-green-500/10 px-3 py-2 text-[13px] text-green-400 animate-slideDown flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-sm border border-[#3a1a1a] bg-[#221010] px-3 py-2 text-[13px] text-[#ffb4b4] animate-shake">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthSignup('facebook')}
            disabled={loadingProvider !== null}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-sm bg-[#2f5bd7] text-white font-semibold text-sm hover:bg-[#274fbf] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loadingProvider === 'facebook' ? <LoadingSpinner /> : <><FacebookIcon /> Sign up with Facebook</>}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignup('google')}
            disabled={loadingProvider !== null}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-sm bg-[#2f2f2f] text-white font-semibold text-sm hover:bg-[#242424] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loadingProvider === 'google' ? <LoadingSpinner /> : <><GoogleIcon /> Sign up with Google</>}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignup('apple')}
            disabled={loadingProvider !== null}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-sm bg-black text-white font-semibold text-sm hover:bg-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-[#333] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loadingProvider === 'apple' ? <LoadingSpinner /> : <><AppleIcon /> Sign up with Apple</>}
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-[#2b2b2b]" />
          <span className="text-[13px] text-[#bdbdbd]">or</span>
          <div className="flex-1 h-px bg-[#2b2b2b]" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 mb-6">
            {/* Email */}
            <div className="relative">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full h-10 px-3 pr-10 rounded-sm bg-[#2a2a2a] text-white placeholder-[#9b9b9b] text-sm border border-[#2b2b2b] focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:border-[#ff5500] transition-all duration-200 disabled:opacity-60"
              />
              {isEmailValid && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-fadeIn">
                  <CheckIcon />
                </span>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full h-10 px-3 pr-10 rounded-sm bg-[#2a2a2a] text-white placeholder-[#9b9b9b] text-sm border border-[#2b2b2b] focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:border-[#ff5500] transition-all duration-200 disabled:opacity-60"
              />
              {isPasswordValid && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-fadeIn">
                  <CheckIcon />
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={`w-full h-10 px-3 pr-10 rounded-sm bg-[#2a2a2a] text-white placeholder-[#9b9b9b] text-sm border focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:border-[#ff5500] transition-all duration-200 disabled:opacity-60 ${
                  confirmPassword && !isPasswordMatch ? 'border-red-500/50' : 'border-[#2b2b2b]'
                }`}
              />
              {isPasswordMatch && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-fadeIn">
                  <CheckIcon />
                </span>
              )}
            </div>

            {/* Display Name */}
            <div className="relative">
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                className="w-full h-10 px-3 pr-10 rounded-sm bg-[#2a2a2a] text-white placeholder-[#9b9b9b] text-sm border border-[#2b2b2b] focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:border-[#ff5500] transition-all duration-200 disabled:opacity-60"
              />
              {isDisplayNameValid && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-fadeIn">
                  <CheckIcon />
                </span>
              )}
            </div>

            {/* Age and Gender */}
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Age (optional)"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                disabled={isLoading}
                min="13"
                max="120"
                className="w-1/2 h-10 px-3 rounded-sm bg-[#2a2a2a] text-white placeholder-[#9b9b9b] text-sm border border-[#2b2b2b] focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:border-[#ff5500] transition-all duration-200 disabled:opacity-60"
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={isLoading}
                className="w-1/2 h-10 px-3 rounded-sm bg-[#2a2a2a] text-white text-sm border border-[#2b2b2b] focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:border-[#ff5500] transition-all duration-200 disabled:opacity-60"
              >
                <option value="" disabled className="text-[#9b9b9b] bg-[#111111]">
                  Gender (optional)
                </option>
                <option value="male" className="bg-[#111111]">Male</option>
                <option value="female" className="bg-[#111111]">Female</option>
                <option value="custom" className="bg-[#111111]">Custom</option>
                <option value="prefer-not" className="bg-[#111111]">Prefer not to say</option>
              </select>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-[#2b2b2b] bg-[#2a2a2a] accent-[#ff5500] disabled:opacity-60 transition-all"
                />
              </div>
              <span className="text-xs text-[#bdbdbd] group-hover:text-white transition-colors">
                I agree to receive marketing communications from SoundCloud. I
                can unsubscribe at any time as described in the{" "}
                <a href="#" className="text-[#2f88ff] hover:underline">
                  Privacy Policy
                </a>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-10 rounded-sm font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 ${
              !isLoading
                ? "bg-gradient-to-r from-[#ff5500] to-[#ff7700] hover:from-[#ff6600] hover:to-[#ff8800] hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-[#ff5500]/25 cursor-pointer"
                : "bg-[#6b6b6b]/70 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-6">
          <a href="#" className="text-[13px] text-[#2f88ff] hover:underline transition-colors">
            Need help?
          </a>
          <Link to="/login" className="text-[13px] text-[#2f88ff] hover:underline transition-colors">
            Already have an account? Sign in
          </Link>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideDown {
          animation: slideDown 0.4s ease-out forwards;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default Register;
