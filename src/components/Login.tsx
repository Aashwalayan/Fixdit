import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigateToSignUp: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToSignUp }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setError('Please enter both your username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailOrUsername.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials provided.');
      }

      setSuccess('Logged in successfully!');
      setTimeout(() => {
        if (rememberMe) {
          localStorage.setItem('fixdit_token', data.token);
        } else {
          sessionStorage.setItem('fixdit_token', data.token);
        }
        onLoginSuccess(data.token, data.user);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-card" className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-[#ea580c] font-black text-2xl tracking-tighter">
          Fd
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back to Fixdit</h2>
        <p className="text-sm text-slate-500 mt-1">Resolve local concerns. Build stronger neighborhoods.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-150 rounded-xl text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Username or Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="text"
              required
              disabled={loading}
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="e.g., citizen_jane or jane@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] rounded-xl text-sm text-slate-800 font-medium outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Password
            </label>
            <button
              type="button"
              onClick={() => alert('Forgot Password: In production, this triggers a secure token-based password reset link sent to your registered email.')}
              className="text-[10px] text-orange-650 hover:text-orange-800 font-bold uppercase hover:underline transition"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] rounded-xl text-sm text-slate-800 font-medium outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-[#ea580c] focus:ring-[#ea580c] border-slate-200"
            />
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition">
              Remember Me
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              Log In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          New to the Fixdit community?{' '}
          <button
            onClick={onNavigateToSignUp}
            className="text-orange-650 hover:text-orange-800 font-extrabold hover:underline transition"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
};
