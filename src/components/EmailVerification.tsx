import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ArrowRight, RefreshCw, Sparkles, Inbox, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface EmailVerificationProps {
  verificationToken: string;
  email: string;
  onBackToLogin: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  verificationToken,
  email,
  onBackToLogin,
}) => {
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      const response = await fetch(`/api/auth/verify-email/${verificationToken}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed. Token may be invalid or expired.');
      }

      setVerified(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-center animate-fadeIn px-4">
      {/* Informational Card */}
      <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl">
        {!verified ? (
          <div className="space-y-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Check Your Inbox</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                We've sent an account verification link to <strong className="text-slate-800">{email}</strong>.
                Please verify your email address to log in and join the Fixdit community.
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

      {/* Interactive Sandbox Simulator Panel */}
      <div className="md:col-span-5 bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl self-stretch flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-widest">
              Fixdit Sandbox Simulator
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-400" />
              Developer Email Log
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Since SMTP relays are disabled in this sandboxed preview container, we intercept outgoing verification emails and print them here instantly for full testing.
            </p>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 space-y-2 select-all relative overflow-hidden">
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-500 uppercase font-sans font-bold">
                E-mail Mock
              </div>
              <p className="text-slate-500"><span className="text-slate-400 font-bold">From:</span> info@fixdit.civic</p>
              <p className="text-slate-500"><span className="text-slate-400 font-bold">To:</span> {email}</p>
              <p className="text-slate-500"><span className="text-slate-400 font-bold">Subject:</span> Verify Account</p>
              <div className="border-t border-slate-900 my-2 pt-2 text-slate-400">
                Hi there, click to confirm registration:
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800/80 break-all text-blue-400 select-all font-semibold">
                /api/auth/verify-email/{verificationToken.substring(0, 16)}...
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800">
          {!verified ? (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5" />
                  Simulate Email Link Click
                </>
              )}
            </button>
          ) : (
            <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/45 border border-emerald-900/50 rounded-xl">
              ✓ Token Successfully Consumed!
            </div>
          )}
          {error && (
            <p className="text-[10px] text-red-400 font-medium mt-2 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
