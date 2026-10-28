'use client';

import React, { useState, useEffect } from 'react';
import { Navigation, NavTab } from '../components/Navigation';
import { StartScreen } from '../components/StartScreen';
import { ActiveTimer } from '../components/ActiveTimer';
import { BreakScreen } from '../components/BreakScreen';
import { CompletionModal } from '../components/CompletionModal';
import { HistoryScreen } from '../components/HistoryScreen';
import { ProfileScreen } from '../components/ProfileScreen';
import { AuthModal } from '../components/AuthModal';
import { UserPreferences, UserProfile, DEFAULT_PREFERENCES } from '../lib/types';
import { storage } from '../lib/storage';
import { getSupabaseClient } from '../lib/supabase';

type AppSessionState = 'idle' | 'focus' | 'reflecting' | 'break';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>('timer');
  const [sessionState, setSessionState] = useState<AppSessionState>('idle');

  // Focus interval state
  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(25);
  const [currentTaskTitle, setCurrentTaskTitle] = useState<string>('Focus interval');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // Completed session info for reflection modal
  const [lastCompletedSeconds, setLastCompletedSeconds] = useState<number>(0);
  const [distractionNotes, setDistractionNotes] = useState<string[]>([]);

  // User Profile & Preferences
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PREFERENCES as unknown as UserProfile);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Initialize and check for restored active session
  useEffect(() => {
    const loadedPrefs = storage.getPreferences();
    const loadedProfile = storage.getProfile();
    setPreferences(loadedPrefs);
    setProfile(loadedProfile);
    storage.savePreferences(loadedPrefs); // applies data attributes

    // Check if active session was in progress
    const active = storage.getActiveSessionState();
    if (active) {
      if (active.mode === 'focus') {
        setFocusDurationMinutes(Math.round(active.totalDurationSeconds / 60));
        setCurrentTaskTitle(active.taskTitle);
        setCurrentTaskId(active.taskId || null);
        setSessionState('focus');
      } else if (active.mode === 'break') {
        setSessionState('break');
      }
    }

    // Supabase auth listener
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const userProfile: UserProfile = {
              id: session.user.id,
              email: session.user.email || null,
              displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
              focusArea: 'General Study',
              isGuest: false,
              preferences: loadedPrefs,
            };
            setProfile(userProfile);
            storage.saveProfile(userProfile);
            await storage.syncLocalSessionsToCloud(session.user.id);
          }
        }
      );
      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    setIsMounted(true);
  }, []);

  const handleStartFocus = (minutes: number, taskTitle: string, taskId?: string) => {
    setFocusDurationMinutes(minutes);
    setCurrentTaskTitle(taskTitle);
    setCurrentTaskId(taskId || null);
    setDistractionNotes([]);
    setSessionState('focus');
    setCurrentTab('timer');
  };

  const handleFocusCompleted = async (
    actualSeconds: number,
    notes: string[],
    taskTitle: string
  ) => {
    storage.saveActiveSessionState(null);
    setLastCompletedSeconds(actualSeconds);
    setDistractionNotes(notes);
    setCurrentTaskTitle(taskTitle);

    // Save session record
    await storage.saveSession({
      userId: profile.id || 'guest_user',
      taskTitle,
      taskId: currentTaskId,
      durationMinutes: focusDurationMinutes,
      actualSeconds,
      completed: true,
      sessionType: 'focus',
      distractionNotes: notes,
    });

    if (currentTaskId) {
      await storage.updateTaskFocus(currentTaskId, actualSeconds);
    }

    setSessionState('reflecting');
  };

  const handleFocusCancelled = async (
    actualSeconds: number,
    notes: string[],
    taskTitle: string
  ) => {
    storage.saveActiveSessionState(null);
    if (actualSeconds >= 5) {
      await storage.saveSession({
        userId: profile.id || 'guest_user',
        taskTitle,
        taskId: currentTaskId,
        durationMinutes: focusDurationMinutes,
        actualSeconds,
        completed: false,
        sessionType: 'focus',
        distractionNotes: notes,
      });

      if (currentTaskId) {
        await storage.updateTaskFocus(currentTaskId, actualSeconds);
      }
    }
    setDistractionNotes(notes);
    setSessionState('idle');
    setCurrentTab('history');
  };

  const handleSaveReflectionAndNext = async (reflectionNote?: string) => {
    if (reflectionNote) {
      const sessions = await storage.getSessions();
      if (sessions.length > 0) {
        sessions[0].reflectionNote = reflectionNote;
        if (typeof window !== 'undefined') {
          localStorage.setItem('study_timer_sessions', JSON.stringify(sessions));
        }
      }
    }
    setSessionState('break');
  };

  const handleSkipReflectionToBreak = () => {
    setSessionState('break');
  };

  const handleStartNextFocus = () => {
    storage.saveActiveSessionState(null);
    setSessionState('idle');
    setCurrentTab('timer');
  };

  const handleFinishEverything = () => {
    storage.saveActiveSessionState(null);
    setSessionState('idle');
    setCurrentTab('history');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors pb-20 md:pb-10">
      {/* Top / Bottom Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        isTimerActive={sessionState === 'focus' || sessionState === 'break'}
        onOpenAuth={() => setIsAuthOpen(true)}
        isGuest={profile.isGuest}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 w-full">
        {/* If user is in an active focus session */}
        {sessionState === 'focus' && (
          <ActiveTimer
            initialDurationMinutes={focusDurationMinutes}
            initialTaskTitle={currentTaskTitle}
            taskId={currentTaskId}
            onSessionComplete={handleFocusCompleted}
            onSessionCancel={handleFocusCancelled}
            soundEnabled={preferences.soundEnabled}
            lowStimulation={preferences.lowStimulation}
            onToggleLowStimulation={() => {
              const updated = { ...preferences, lowStimulation: !preferences.lowStimulation };
              setPreferences(updated);
              storage.savePreferences(updated);
            }}
          />
        )}

        {/* If user is in a guided break */}
        {sessionState === 'break' && (
          <BreakScreen
            defaultBreakDurationMinutes={preferences.defaultBreakDuration}
            distractionNotes={distractionNotes}
            onStartNextFocus={handleStartNextFocus}
            onFinishEverything={handleFinishEverything}
            soundEnabled={preferences.soundEnabled}
          />
        )}

        {/* If idle, show currently selected tab */}
        {sessionState === 'idle' && (
          <>
            {currentTab === 'timer' && (
              <StartScreen
                onStartFocus={handleStartFocus}
                defaultDuration={preferences.defaultFocusDuration}
              />
            )}

            {currentTab === 'history' && <HistoryScreen />}

            {currentTab === 'profile' && (
              <ProfileScreen
                onOpenAuth={() => setIsAuthOpen(true)}
                onPreferencesChange={(newPrefs) => setPreferences(newPrefs)}
              />
            )}
          </>
        )}

        {/* If user just completed focus and is on the reflection screen */}
        {sessionState === 'reflecting' && (
          <CompletionModal
            taskTitle={currentTaskTitle}
            actualSeconds={lastCompletedSeconds}
            onSaveReflectionAndNext={handleSaveReflectionAndNext}
            onSkipAndTakeBreak={handleSkipReflectionToBreak}
            encouragementStyle={preferences.encouragementStyle}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(newProfile) => {
          setProfile(newProfile);
        }}
      />
    </div>
  );
}
