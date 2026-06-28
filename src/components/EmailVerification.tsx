import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onBackToLogin: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onBackToLogin,
}) => {
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setVerified(true);
    } catch (err: any) {
      setError(err.message || "An error occurred during verification.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP.");
      }

      setError("");
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || "Unable to resend verification code.");
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-center animate-fadeIn px-4 mx-auto">
      
      {/* Left/Main Card: Information or Success State */}
      <div className={`${verified ? 'md:col-span-12' : 'md:col-span-7'} bg-white border border-slate-200 rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl`}>
        {!verified ? (
          <div className="space-y-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Check Your Inbox</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                We've sent a 6-digit verification code to <strong className="text-slate-800">{email}</strong>. Enter the code below to verify your account.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
              <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                Next Steps
              </h4>
              <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
                <li>Locate the verification email from <span className="font-semibold text-slate-700">Fixdit Support</span>.</li>
                <li>Click the <span className="font-semibold text-slate-700">Verify Account</span> link inside the email.</li>
                <li>Once verified, you will be redirected to the secure login gateway.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onBackToLogin}
                className="flex-1 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Verified!</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Congratulations! Your email address has been verified successfully. Your Fixdit Civic Profile is now active.
              </p>
            </div>

            <button
              onClick={onBackToLogin}
              className="w-full sm:w-auto px-8 py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-xl text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              Proceed to Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right Card: OTP Input (Hidden when verification is successful) */}
      {!verified && (
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold mb-4">
            Enter Verification Code
          </h3>

          <p className="text-sm text-slate-500 mb-4">
            Enter the 6-digit code sent to your email.
          </p>

          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) =>
              setOtp(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              )
            }
            className="w-full text-center tracking-[0.6em] text-2xl border rounded-xl py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
            placeholder="000000"
          />

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] disabled:bg-slate-300 text-white rounded-xl font-bold transition"
          >
            {verifying ? "Verifying..." : "Verify Email"}
          </button>

          <button
            onClick={handleResendOTP}
            disabled={countdown > 0}
            className="w-full mt-3 border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 text-slate-600 disabled:text-slate-400 rounded-xl py-3 transition text-sm font-medium"
          >
            {countdown > 0
              ? `Resend OTP (${countdown}s)`
              : "Resend OTP"}
          </button>

          {error && (
            <p className="text-red-500 text-sm mt-3 text-center">
              {error}
            </p>
          )}
        </div>
      )}

    </div>
  );
};