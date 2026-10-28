'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Sliders,
  Volume2,
  VolumeX,
  Eye,
  Activity,
  Sun,
  Moon,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Save,
  Check,
  Sparkles,
} from 'lucide-react';
import { UserProfile, UserPreferences } from '../lib/types';
import { storage } from '../lib/storage';
import { soundService } from '../lib/sound';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';

interface ProfileScreenProps {
  onOpenAuth: () => void;
  onPreferencesChange: (newPrefs: UserPreferences) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenAuth,
  onPreferencesChange,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => storage.getProfile());
  const [preferences, setPreferences] = useState<UserPreferences>(() => storage.getPreferences());
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(isSupabaseConfigured());

  useEffect(() => {
    setProfile(storage.getProfile());
    setPreferences(storage.getPreferences());
    setSupabaseConnected(isSupabaseConfigured());
  }, []);

  const handlePreferenceUpdate = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    storage.savePreferences(updated);
    onPreferencesChange(updated);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...profile, preferences };
    setProfile(updated);
    storage.saveProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTestSound = () => {
    soundService.playCompletionChime();
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    const guestProfile: UserProfile = {
      id: 'guest_user',
      email: null,
      displayName: 'Student',
      focusArea: 'Preparing for Exams & Projects',
      isGuest: true,
      preferences,
    };
    setProfile(guestProfile);
    storage.saveProfile(guestProfile);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-300">
      {/* Title */}
      <div className="mb-8">
        <h1 className="font-editorial-serif text-3xl font-normal text-[var(--text-primary)]">
          Profile &amp; Preferences
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
          Tailor timer intervals, sensory stimulation, and encouragement style to your workflow.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account / Sync Status Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[var(--accent-focus-light)] text-[var(--accent-focus)] flex items-center justify-center font-editorial-serif text-lg font-semibold">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium text-sm sm:text-base text-[var(--text-primary)]">
                  {profile.displayName}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {profile.email || 'Local Offline Mode (No cloud account required)'}
                </p>
              </div>
            </div>

            {profile.isGuest ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-focus)] text-white text-xs font-medium hover:opacity-95 transition-all shadow-2xs"
              >
                Sign In / Sync
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-red-600 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          {/* Supabase Status Pill */}
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>
                {supabaseConnected
                  ? 'Supabase Cloud Sync: Connected & Ready'
                  : 'Supabase Cloud: Local Offline Fallback Active'}
              </span>
            </div>
            {!supabaseConnected && (
              <span className="text-[11px] text-[var(--text-secondary)] italic">
                Optional: Add keys to .env.local to enable cloud sync
              </span>
            )}
          </div>
        </div>

        {/* Profile Details Form */}
        <form
          onSubmit={handleProfileSave}
          className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-editorial-serif text-lg font-medium text-[var(--text-primary)]">
              Study Details
            </h3>
            {isSaved && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1"
              >
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:ring-1 focus:ring-[var(--accent-focus)]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-focus"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1"
              >
                Primary Focus Area
              </label>
              <input
                id="profile-focus"
                type="text"
                value={profile.focusArea}
                onChange={(e) => setProfile({ ...profile, focusArea: e.target.value })}
                placeholder="e.g. MCAT Prep, Thesis, Computer Science"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:ring-1 focus:ring-[var(--accent-focus)]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[var(--accent-focus)] text-white text-xs font-medium hover:opacity-90 flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Details</span>
            </button>
          </div>
        </form>

        {/* Preferences Section */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xs space-y-6">
          <h3 className="font-editorial-serif text-lg font-medium text-[var(--text-primary)]">
            Timer &amp; Sensory Preferences
          </h3>

          {/* 1. Default Durations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Default Focus Duration
              </label>
              <select
                value={preferences.defaultFocusDuration}
                onChange={(e) => handlePreferenceUpdate('defaultFocusDuration', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)]"
              >
                <option value={15}>15 minutes (Quick start)</option>
                <option value={25}>25 minutes (Standard rhythm)</option>
                <option value={45}>45 minutes (Deep study)</option>
                <option value={60}>60 minutes (Long block)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Default Break Duration
              </label>
              <select
                value={preferences.defaultBreakDuration}
                onChange={(e) => handlePreferenceUpdate('defaultBreakDuration', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)]"
              >
                <option value={3}>3 minutes (Micro-break)</option>
                <option value={5}>5 minutes (Standard break)</option>
                <option value={10}>10 minutes (Restorative break)</option>
              </select>
            </div>
          </div>

          {/* 2. Audio Chime */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border)]">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-[var(--text-primary)] block">
                Completion Bell Sound
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                Gentle singing bowl tone at the end of each focus interval
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestSound}
                className="px-2.5 py-1 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Test Chime
              </button>

              <button
                type="button"
                onClick={() => handlePreferenceUpdate('soundEnabled', !preferences.soundEnabled)}
                className={`p-2 rounded-xl transition-colors ${
                  preferences.soundEnabled
                    ? 'bg-[var(--accent-focus)] text-white'
                    : 'bg-[var(--border)] text-[var(--text-muted)]'
                }`}
                aria-label="Toggle sound chime"
              >
                {preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3. Encouragement Style */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Encouragement Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['warm', 'neutral', 'minimal'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handlePreferenceUpdate('encouragementStyle', style)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize text-center transition-all ${
                    preferences.encouragementStyle === style
                      ? 'border-[var(--accent-focus)] bg-[var(--accent-focus-light)] text-[var(--accent-focus)] font-semibold'
                      : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 italic">
              {preferences.encouragementStyle === 'warm' && 'Offers gentle, affirming phrases recognizing your showing up.'}
              {preferences.encouragementStyle === 'neutral' && 'State-focused, straightforward session summaries.'}
              {preferences.encouragementStyle === 'minimal' && 'Numbers and timer countdown only, zero commentary.'}
            </p>
          </div>

          {/* 4. Sensory & Accessibility: Low Stimulation & Reduced Motion */}
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)] block">
                  Low-Stimulation Mode
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Mutes contrast, softens colors, and reduces sensory visual clutter.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.lowStimulation}
                onChange={(e) => handlePreferenceUpdate('lowStimulation', e.target.checked)}
                className="w-5 h-5 accent-[var(--accent-focus)] rounded cursor-pointer"
                aria-label="Toggle low stimulation mode"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)] block">
                  Reduced Motion
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Disables smooth transitions and breathing pulses for vestibular comfort.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) => handlePreferenceUpdate('reducedMotion', e.target.checked)}
                className="w-5 h-5 accent-[var(--accent-focus)] rounded cursor-pointer"
                aria-label="Toggle reduced motion"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)] block">
                  Color Appearance
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Warm paper light mode or soothing ink dark mode.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePreferenceUpdate('theme', 'light')}
                  className={`p-2 rounded-lg border ${
                    preferences.theme === 'light'
                      ? 'border-[var(--accent-focus)] bg-[var(--accent-focus-light)] text-[var(--accent-focus)]'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                  aria-label="Light mode"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePreferenceUpdate('theme', 'dark')}
                  className={`p-2 rounded-lg border ${
                    preferences.theme === 'dark'
                      ? 'border-[var(--accent-focus)] bg-[var(--accent-focus-light)] text-[var(--accent-focus)]'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                  aria-label="Dark mode"
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
