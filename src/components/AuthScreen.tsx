import React, { useState } from 'react';
import { Shield, KeyRound, User, Lock, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';

export const AuthScreen: React.FC = () => {
  const { authStatus, loginAdmin, setupAdmin, loginGuest } = useLifeOS();

  const isSetup = authStatus === 'needs_setup';

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Username is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isSetup) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      const res = await setupAdmin(cleanUser, password, displayName.trim());
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Failed to complete admin setup.');
      }
    } else {
      setIsSubmitting(true);
      const res = await loginAdmin(cleanUser, password);
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Invalid username or password.');
      }
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginGuest();
    } catch {
      setError('Failed to enter Guest mode.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080b] p-4 text-neutral-100 font-sans antialiased selection:bg-zinc-700 selection:text-white overflow-y-auto">
      {/* God Hands ASCII Art Hero Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 pointer-events-none scale-100 transition-transform duration-1000"
        style={{ backgroundImage: `url('/assets/god_hands_ascii.jpg')` }}
      />
      {/* Cyber/Monochromatic Vignette Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/75 to-[#07080b]/85 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#07080b_85%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      {/* Hero Card with Grey Styling */}
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700/50 bg-zinc-950/85 p-7 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 shadow-sm">
            <Shield className="h-5 w-5 text-zinc-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
              LifeOS v2.0 · Personal Edition
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {isSetup ? 'Initialize LifeOS Admin' : 'Welcome to LifeOS'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {isSetup
                ? 'Create your private administrator credentials to secure your personal system.'
                : 'Sign in to access your personal dashboard, skills, and memory.'}
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. admin"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-zinc-700/70 bg-zinc-900/80 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
              />
            </div>
          </div>

          {isSetup && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Display Name <span className="text-zinc-500 lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full rounded-lg border border-zinc-700/70 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete={isSetup ? 'new-password' : 'current-password'}
                required
                className="w-full rounded-lg border border-zinc-700/70 bg-zinc-900/80 pl-9 pr-10 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSetup && (
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-zinc-700/70 bg-zinc-900/80 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-200 text-zinc-950 font-medium py-2.5 px-4 text-xs hover:bg-white transition-colors shadow-ambient-sm disabled:opacity-50 mt-2"
          >
            <span>{isSetup ? 'Create Admin & Launch' : 'Sign In as Admin'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Guest Mode Option */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-mono uppercase tracking-wider">
            <span className="h-px flex-1 bg-zinc-800" />
            <span>or explore</span>
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/70 hover:bg-zinc-850 text-zinc-300 hover:text-white py-2.5 px-4 text-xs font-medium transition-colors"
          >
            <span>Continue in Guest Mode</span>
          </button>

          <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
            Guest mode runs in an isolated sandbox. Guest sessions cannot view or modify the Admin workspace.
          </p>
        </div>
      </div>
    </div>
  );
};
