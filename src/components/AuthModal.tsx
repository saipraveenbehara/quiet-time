'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { storage } from '../lib/storage';
import { UserProfile } from '../lib/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (mode !== 'forgot' && (!password || password.length < 6)) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validate()) return;
    setLoading(true);

    const supabase = getSupabaseClient();

    // If Supabase is configured, use real Supabase Auth
    if (supabase) {
      try {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: displayName.trim() || email.split('@')[0],
              },
            },
          });
          if (error) throw error;

          if (data.user) {
            const newProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email || email,
              displayName: displayName.trim() || email.split('@')[0],
              focusArea: 'General Study',
              isGuest: false,
              preferences: storage.getPreferences(),
            };
            storage.saveProfile(newProfile);
            await storage.syncLocalSessionsToCloud(data.user.id);
            setSuccessMessage('Account created! Welcome to Quiet Study.');
            setTimeout(() => {
              onAuthSuccess(newProfile);
              onClose();
            }, 1000);
          }
        } else if (mode === 'signin') {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;

          if (data.user) {
            const updatedProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email || email,
              displayName: data.user.user_metadata?.full_name || email.split('@')[0],
              focusArea: 'General Study',
              isGuest: false,
              preferences: storage.getPreferences(),
            };
            storage.saveProfile(updatedProfile);
            await storage.syncLocalSessionsToCloud(data.user.id);
            setSuccessMessage('Signed in successfully.');
            setTimeout(() => {
              onAuthSuccess(updatedProfile);
              onClose();
            }, 1000);
          }
        } else if (mode === 'forgot') {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          setSuccessMessage('Password reset link sent to your email.');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    } else {
      // Local development simulation fallback when Supabase keys are pending
      setTimeout(() => {
        setLoading(false);
        if (mode === 'forgot') {
          setSuccessMessage('Password recovery request recorded for local account.');
          return;
        }

        const devProfile: UserProfile = {
          id: `local_user_${Date.now()}`,
          email,
          displayName: displayName.trim() || email.split('@')[0],
          focusArea: 'Exam & Assignment Prep',
          isGuest: false,
          preferences: storage.getPreferences(),
        };
        storage.saveProfile(devProfile);
        setSuccessMessage(mode === 'signup' ? 'Local account created!' : 'Signed in locally!');
        setTimeout(() => {
          onAuthSuccess(devProfile);
          onClose();
        }, 800);
      }, 500);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMessage(
        'Google OAuth is available when Supabase keys are configured in .env.local. In the meantime, you can explore freely as a guest!'
      );
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed';
      setErrorMessage(message);
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    const guestProfile = storage.getProfile();
    onAuthSuccess(guestProfile);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-focus-light)] text-[var(--accent-focus)] font-editorial-serif text-lg font-semibold flex items-center justify-center mx-auto mb-2.5">
            st
          </div>
          <h2 className="font-editorial-serif text-2xl font-normal text-[var(--text-primary)]">
            {mode === 'signup'
              ? 'Create your study space'
              : mode === 'forgot'
              ? 'Reset your password'
              : 'Welcome back'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
            {mode === 'signup'
              ? 'Save your progress and access your study history across devices.'
              : mode === 'forgot'
              ? 'Enter your email to receive recovery instructions.'
              : 'Sign in to access your sessions and preferences.'}
          </p>
        </div>

        {/* Tab switch between Sign In and Sign Up */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border)] text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Messages */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1"
              >
                Name / Alias
              </label>
              <input
                id="auth-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we address you?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:ring-1 focus:ring-[var(--accent-focus)]"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:ring-1 focus:ring-[var(--accent-focus)]"
              />
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-[var(--accent-focus)] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:ring-1 focus:ring-[var(--accent-focus)]"
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--accent-focus)] hover:opacity-95 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : mode === 'signup' ? (
              <span>Create Account</span>
            ) : mode === 'forgot' ? (
              <span>Send Recovery Link</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className="text-xs text-[var(--accent-focus)] hover:underline"
            >
              Back to sign in
            </button>
          </div>
        )}

        {/* Google OAuth & Guest Option */}
        <div className="space-y-3 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="w-full py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-center"
          >
            Continue as Guest (No account needed)
          </button>
        </div>
      </div>
    </div>
  );
};
