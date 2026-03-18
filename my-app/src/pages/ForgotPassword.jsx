/**
 * Forgot Password Page
 * Password recovery flow
 * Enhanced with animations and mock service integration
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { mockForgotPassword } from "@/mocks/mockService";

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

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await mockForgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      // Still show success to prevent email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 bg-[#111111]">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div 
        className="w-full max-w-[560px] border border-[#2b2b2b] bg-[#111111]/95 backdrop-blur-sm rounded-sm px-14 py-12 text-white relative z-10"
        style={{ animation: 'fadeInUp 0.5s ease-out' }}
      >
        {!isSubmitted ? (
          <>
            {/* Back Link */}
            <Link
              to="/login"
              className="flex items-center gap-2 text-[13px] text-[#bdbdbd] hover:text-white mb-6 group transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="group-hover:-translate-x-1 transition-transform"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to sign in
            </Link>

            <h1 className="text-2xl font-bold text-foreground mb-2 animate-slideDown">
              Reset your password
            </h1>

            <p className="text-[13px] text-[#bdbdbd] mb-6 leading-relaxed opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            {/* Error Display */}
            {error && (
              <div className="mb-4 rounded-sm border border-[#3a1a1a] bg-[#221010] px-3 py-2 text-[13px] text-[#ffb4b4] animate-shake">
                {error}
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit}>
              <div className="relative mb-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="w-full h-10 px-3 rounded-sm bg-[#2a2a2a] text-white placeholder-[#9b9b9b] text-sm border border-[#2b2b2b] focus:outline-none focus:ring-2 focus:ring-[#ff5500]/50 focus:border-[#ff5500] transition-all duration-200 disabled:opacity-60"
                />
                {/* Email Icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b9b9b]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className={`w-full h-10 rounded-sm font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 ${
                  !isLoading && email.trim()
                    ? "bg-gradient-to-r from-[#ff5500] to-[#ff7700] hover:from-[#ff6600] hover:to-[#ff8800] hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-[#ff5500]/25 cursor-pointer"
                    : "bg-[#6b6b6b]/70 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-[13px] text-[#bdbdbd]">Remember your password? </span>
              <Link to="/login" className="text-[13px] text-[#2f88ff] hover:underline transition-colors">
                Sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="text-center" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {/* Success Icon with Animation */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center animate-bounce-slow">
                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-checkmark"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-3 animate-slideDown">
                Check your email
              </h1>

              <p className="text-[14px] text-[#bdbdbd] mb-2 leading-relaxed">
                If an account exists for
              </p>
              <p className="text-white font-medium mb-4 px-4 py-2 bg-[#2a2a2a] rounded-sm inline-block">
                {email}
              </p>
              <p className="text-[14px] text-[#bdbdbd] mb-6 leading-relaxed">
                you will receive a password reset link shortly.
              </p>

              <div className="bg-[#1a1a1a] rounded-sm p-4 mb-6 border border-[#2b2b2b]">
                <p className="text-xs text-[#bdbdbd] flex items-center gap-2 justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-[#2f88ff] hover:underline font-medium"
                  >
                    try again
                  </button>
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full h-10 rounded-sm font-semibold text-sm text-white bg-gradient-to-r from-[#ff5500] to-[#ff7700] hover:from-[#ff6600] hover:to-[#ff8800] hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-[#ff5500]/25 transition-all duration-200"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
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
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes checkmark {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
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
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-checkmark {
          stroke-dasharray: 100;
          animation: checkmark 0.8s ease-out forwards;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
