import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

interface SignUpProps {
  onRegisterSuccess: (token: string, email: string) => void;
  onNavigateToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Client-side validation states
  const isUsernameValid = username.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const isPasswordMatch = password === confirmPassword && password.length > 0;

  // Simple password strength scoring
  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' };
    if (score === 2) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset feedback
    setError(null);
    setSuccess(null);

    // Validation checks
    if (!isUsernameValid) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!isEmailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!isPasswordMatch) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess('Account created successfully!');
      setTimeout(() => {
        // Pass token to display verification simulator
        onRegisterSuccess(data.verificationToken, email.trim());
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="signup-card" className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl animate-fadeIn">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-[#ea580c] font-black text-2xl tracking-tighter">
          Fd
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Fixdit Account</h2>
        <p className="text-sm text-slate-500 mt-1">Connect with neighbors. Fix community concerns.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-150 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              required
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="e.g., citizen_jane"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] rounded-xl text-sm text-slate-800 font-medium outline-none transition"
            />
          </div>
          {username && !isUsernameValid && (
            <p className="text-[10px] text-red-500 font-medium">Must be at least 3 characters long.</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., jane@example.com"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] rounded-xl text-sm text-slate-800 font-medium outline-none transition"
            />
          </div>
          {email && !isEmailValid && (
            <p className="text-[10px] text-red-500 font-medium">Please enter a valid email format.</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Password
          </label>
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
              className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] rounded-xl text-sm text-slate-800 font-medium outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Strength:</span>
                <span className={`text-[10px] font-bold ${strength.text}`}>{strength.label}</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{
                    width:
                      strength.label === 'Weak' ? '33%' : strength.label === 'Medium' ? '66%' : '100%',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c] rounded-xl text-sm text-slate-800 font-medium outline-none transition"
            />
          </div>
          {confirmPassword && !isPasswordMatch && (
            <p className="text-[10px] text-red-500 font-medium">Passwords do not match.</p>
          )}
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={loading || !isUsernameValid || !isEmailValid || !isPasswordValid || !isPasswordMatch}
          className="w-full mt-2 py-3 bg-[#ea580c] hover:bg-[#c2410c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      {/* Navigation back to login */}
      <button
        onClick={onNavigateToLogin}
        disabled={loading}
        className="w-full mt-6 py-2.5 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </button>
    </div>
  );
};
