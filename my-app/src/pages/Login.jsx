/**
 * Login Page
 * SoundCloud-style sign in page with OAuth and email login
 * Enhanced with animations and mock service integration
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockLogin, mockOAuthLogin } from "@/mocks/mockService";

function FacebookIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
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

function AppleIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

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

const Login = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const navigate = useNavigate();

  const handleContinue = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nextEmail = email.trim();
    if (!nextEmail) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nextEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const result = await mockLogin(nextEmail);
      setSuccess(result.message);
      
      // Simulate redirect after success
      setTimeout(() => {
        // In a real app, this would navigate to dashboard
        console.log("Logged in as:", result.user);
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError("");
    setSuccess("");
    setLoadingProvider(provider);

    try {
      const result = await mockOAuthLogin(provider);
      setSuccess(result.message);
      
      setTimeout(() => {
        console.log("OAuth logged in as:", result.user);
      }, 1500);
    } catch (err) {
      setError(err?.message || `Unable to sign in with ${provider}. Please try again.`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 bg-[#111111]">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-500/20 to-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div 
        className="w-full max-w-[560px] border border-[#2b2b2b] bg-[#111111]/95 backdrop-blur-sm rounded-sm px-14 py-12 text-white relative z-10 animate-fadeIn"
        style={{
          animation: 'fadeInUp 0.5s ease-out'
        }}
      >
        <h1 className="text-[28px] font-bold text-white mb-4 tracking-tight animate-slideDown">
          Sign in or create an account
        </h1>
        <p className="text-[13px] text-[#bdbdbd] mb-6 leading-relaxed opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          By clicking on any of the 'Continue' buttons below, you agree to
          SoundCloud's{" "}
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
            onClick={() => handleOAuthLogin('facebook')}
            disabled={loadingProvider !== null}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-sm bg-[#2f5bd7] text-white font-semibold text-sm hover:bg-[#274fbf] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ animationDelay: '0.15s' }}
          >
            {loadingProvider === 'facebook' ? (
              <LoadingSpinner />
            ) : (
              <>
                <FacebookIcon className="w-5 h-5 shrink-0" />
                Continue with Facebook
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loadingProvider !== null}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-sm bg-[#2f2f2f] text-white font-semibold text-sm hover:bg-[#242424] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ animationDelay: '0.2s' }}
          >
            {loadingProvider === 'google' ? (
              <LoadingSpinner />
            ) : (
              <>
                <GoogleIcon className="w-5 h-5 shrink-0" />
                Continue with Google
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            disabled={loadingProvider !== null}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-sm bg-black text-white font-semibold text-sm hover:bg-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-[#333] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ animationDelay: '0.25s' }}
          >
            {loadingProvider === 'apple' ? (
              <LoadingSpinner />
            ) : (
              <>
                <AppleIcon className="w-5 h-5 shrink-0" />
                Continue with Apple
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-[#2b2b2b]" />
          <span className="text-[13px] text-[#bdbdbd]">or</span>
          <div className="flex-1 h-px bg-[#2b2b2b]" />
        </div>

        <form onSubmit={handleContinue}>
          <div className="relative mb-3">
            <input
              type="email"
              placeholder="Your email address or profile URL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full h-10 px-3 rounded-sm bg-[#2a2a2a] text-white placeholder-[#9b9b9b] text-sm border border-[#2b2b2b] focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:border-[#ff5500] transition-all duration-200 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={!email.trim() || isLoading}
            className={`w-full h-10 rounded-sm font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 ${
              email.trim() && !isLoading
                ? "bg-gradient-to-r from-[#ff5500] to-[#ff7700] hover:from-[#ff6600] hover:to-[#ff8800] hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-[#ff5500]/25 cursor-pointer"
                : "bg-[#6b6b6b]/70 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Signing in...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between">
          <a href="#" className="text-[13px] text-[#2f88ff] hover:underline transition-colors">
            Need help?
          </a>
          <a 
            href="/register" 
            onClick={(e) => { e.preventDefault(); navigate('/register'); }}
            className="text-[13px] text-[#2f88ff] hover:underline transition-colors"
          >
            Create account
          </a>
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
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

export default Login;
