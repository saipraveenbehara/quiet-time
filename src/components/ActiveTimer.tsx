'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
  PenTool,
  Check,
  Edit2,
  Sparkles,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { soundService } from '../lib/sound';
import { storage } from '../lib/storage';
import { DistractionModal } from './DistractionModal';

interface ActiveTimerProps {
  initialDurationMinutes: number;
  initialTaskTitle: string;
  taskId?: string | null;
  onSessionComplete: (actualSeconds: number, distractionNotes: string[], taskTitle: string) => void;
  onSessionCancel: (actualSeconds: number, distractionNotes: string[], taskTitle: string) => void;
  soundEnabled: boolean;
  lowStimulation: boolean;
  onToggleLowStimulation?: () => void;
}

export const ActiveTimer: React.FC<ActiveTimerProps> = ({
  initialDurationMinutes,
  initialTaskTitle,
  taskId,
  onSessionComplete,
  onSessionCancel,
  soundEnabled: initialSoundEnabled,
  lowStimulation: initialLowStimulation,
  onToggleLowStimulation,
}) => {
  const totalSeconds = initialDurationMinutes * 60;

  // Check if we have an existing persistent active state
  const restoredState = useRef(storage.getActiveSessionState()).current;
  const initialSecondsLeft = restoredState && restoredState.mode === 'focus'
    ? (restoredState.endTimestamp
        ? Math.max(0, Math.round((restoredState.endTimestamp - Date.now()) / 1000))
        : restoredState.secondsRemaining)
    : totalSeconds;

  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSecondsLeft);
  const [isPaused, setIsPaused] = useState<boolean>(restoredState?.isPaused || false);
  const [taskTitle, setTaskTitle] = useState<string>(restoredState?.taskTitle || initialTaskTitle);
  const [isEditingTask, setIsEditingTask] = useState<boolean>(false);
  const [taskDraft, setTaskDraft] = useState<string>(taskTitle);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialSoundEnabled);
  const [lowStimulation, setLowStimulation] = useState<boolean>(initialLowStimulation);

  const [distractionNotes, setDistractionNotes] = useState<string[]>([]);
  const [isDistractionOpen, setIsDistractionOpen] = useState<boolean>(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState<boolean>(false);

  const endTimestampRef = useRef<number | null>(
    restoredState?.endTimestamp || (restoredState?.isPaused ? null : Date.now() + initialSecondsLeft * 1000)
  );

  const startedAtRef = useRef<string>(restoredState?.startedAt || new Date().toISOString());

  // Save state to storage
  const persistState = useCallback(
    (remaining: number, paused: boolean, currentEndTs: number | null) => {
      storage.saveActiveSessionState({
        mode: 'focus',
        taskTitle,
        taskId: taskId || null,
        totalDurationSeconds: totalSeconds,
        endTimestamp: currentEndTs,
        secondsRemaining: remaining,
        isPaused: paused,
        startedAt: startedAtRef.current,
      });
    },
    [taskTitle, taskId, totalSeconds]
  );

  // Sound completion notification
  const handleComplete = useCallback(() => {
    storage.saveActiveSessionState(null);
    if (soundEnabled) {
      soundService.playCompletionChime();
    }
    const actualSeconds = totalSeconds - secondsRemaining;
    onSessionComplete(Math.max(1, actualSeconds), distractionNotes, taskTitle);
  }, [distractionNotes, onSessionComplete, secondsRemaining, soundEnabled, taskTitle, totalSeconds]);

  // Main high-precision interval
  useEffect(() => {
    if (isPaused) {
      endTimestampRef.current = null;
      persistState(secondsRemaining, true, null);
      return;
    }

    if (!endTimestampRef.current) {
      endTimestampRef.current = Date.now() + secondsRemaining * 1000;
    }

    persistState(secondsRemaining, false, endTimestampRef.current);

    const interval = setInterval(() => {
      if (!endTimestampRef.current) return;
      const now = Date.now();
      const diff = Math.max(0, Math.round((endTimestampRef.current - now) / 1000));

      setSecondsRemaining(diff);
      persistState(diff, false, endTimestampRef.current);

      if (diff <= 0) {
        clearInterval(interval);
        handleComplete();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPaused, persistState, secondsRemaining, handleComplete]);

  // Toggle pause/resume
  const handleTogglePause = () => {
    if (isPaused) {
      endTimestampRef.current = Date.now() + secondsRemaining * 1000;
      setIsPaused(false);
      persistState(secondsRemaining, false, endTimestampRef.current);
    } else {
      setIsPaused(true);
      endTimestampRef.current = null;
      persistState(secondsRemaining, true, null);
    }
  };

  // Add distraction note
  const handleSaveDistraction = (note: string) => {
    setDistractionNotes((prev) => [...prev, note]);
  };

  // Early end / cancellation confirmation
  const handleConfirmEndEarly = () => {
    storage.saveActiveSessionState(null);
    const elapsed = totalSeconds - secondsRemaining;
    onSessionCancel(elapsed, distractionNotes, taskTitle);
  };

  // Formatting
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage
  const fractionElapsed = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const strokeDashoffset = 753.98 * (1 - fractionElapsed); // 2 * PI * 120 ≈ 753.98

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-300">
      {/* Visual Anchor Container */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-xs relative text-center">
        {/* Top low-distraction utility bar */}
        <div className="flex items-center justify-between mb-6 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-focus)] animate-pulse" />
            <span className="font-medium tracking-wide uppercase text-[11px] text-[var(--accent-focus)]">
              {isPaused ? 'Session Paused' : 'Focus Interval'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title={soundEnabled ? 'Chime sound is on' : 'Chime sound is muted'}
              aria-label={soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !lowStimulation;
                setLowStimulation(next);
                if (onToggleLowStimulation) onToggleLowStimulation();
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                lowStimulation
                  ? 'bg-[var(--accent-focus-light)] text-[var(--accent-focus)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
              }`}
              title="Toggle low stimulation mode"
              aria-label="Toggle low stimulation mode"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Name Anchor */}
        <div className="mb-6 max-w-md mx-auto">
          {isEditingTask ? (
            <div className="flex items-center gap-2 justify-center">
              <input
                type="text"
                autoFocus
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--accent-focus)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTaskTitle(taskDraft.trim() || 'Focus interval');
                    setIsEditingTask(false);
                  }
                }}
              />
              <button
                onClick={() => {
                  setTaskTitle(taskDraft.trim() || 'Focus interval');
                  setIsEditingTask(false);
                }}
                className="p-1.5 rounded-lg bg-[var(--accent-focus)] text-white"
                aria-label="Save task title"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card-subtle)] border border-[var(--border)] max-w-full">
              <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">
                {taskTitle}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTaskDraft(taskTitle);
                  setIsEditingTask(true);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                title="Edit task name"
                aria-label="Edit task name"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Circular Countdown Ring */}
        <div className="relative inline-flex items-center justify-center my-2 sm:my-4">
          {!lowStimulation ? (
            <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90" viewBox="0 0 260 260">
              {/* Background ring */}
              <circle
                cx="130"
                cy="130"
                r="115"
                className="stroke-[var(--border)]"
                strokeWidth="6"
                fill="none"
              />
              {/* Animated Progress ring */}
              <circle
                cx="130"
                cy="130"
                r="115"
                className="stroke-[var(--accent-focus)] transition-all duration-300 ease-linear"
                strokeWidth="6"
                strokeDasharray="722.56"
                strokeDashoffset={722.56 * (1 - fractionElapsed)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          ) : (
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-[var(--border)] flex items-center justify-center bg-[var(--bg-card-subtle)]/40" />
          )}

          {/* Center Digital Countdown */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              aria-live="polite"
              className="font-editorial-serif text-5xl sm:text-6xl font-light text-[var(--text-primary)] tracking-tight tabular-nums select-none"
            >
              {formattedTime}
            </span>
            <span className="mt-1 text-xs text-[var(--text-muted)] tracking-wider uppercase font-medium">
              {isPaused ? 'Paused' : `${Math.round(fractionElapsed * 100)}% complete`}
            </span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="mt-8 flex items-center justify-center gap-4">
          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={handleTogglePause}
            className="h-13 px-7 rounded-2xl bg-[var(--accent-focus)] hover:opacity-95 text-white font-medium text-sm flex items-center gap-2 shadow-xs transition-transform active:scale-95"
            aria-label={isPaused ? 'Resume focus timer' : 'Pause focus timer'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Quick Distraction Note Button */}
          <button
            type="button"
            onClick={() => setIsDistractionOpen(true)}
            className="h-13 px-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--text-primary)] text-sm font-medium flex items-center gap-2 transition-colors relative"
            title="Park a distracting thought"
          >
            <PenTool className="w-4 h-4 text-[var(--accent-focus)]" />
            <span className="hidden sm:inline">Park a thought</span>
            {distractionNotes.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--accent-focus)] text-white text-[11px] font-bold flex items-center justify-center">
                {distractionNotes.length}
              </span>
            )}
          </button>

          {/* End Early Button */}
          <button
            type="button"
            onClick={() => setIsCancelConfirmOpen(true)}
            className="h-13 px-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-red-300 hover:text-red-600 text-[var(--text-secondary)] text-sm font-medium flex items-center gap-1.5 transition-colors"
            title="End session"
            aria-label="End session"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End</span>
          </button>
        </div>

        {/* Gentle Encouragement Cue */}
        <p className="mt-6 text-xs text-[var(--text-muted)] italic max-w-sm mx-auto">
          Need to step away or stop early? You can pause or end at any time. Effort spent still counts.
        </p>
      </div>

      {/* Distraction Notes Modal */}
      <DistractionModal
        isOpen={isDistractionOpen}
        onClose={() => setIsDistractionOpen(false)}
        onSaveNote={handleSaveDistraction}
        existingNotes={distractionNotes}
      />

      {/* Gentle End Confirmation Modal */}
      {isCancelConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4 text-left">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <AlertCircle className="w-5 h-5 text-[var(--accent-break)]" />
              <h3 className="font-editorial-serif text-lg font-medium">
                Finish or pause this interval?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              You have completed{' '}
              <strong className="text-[var(--text-primary)]">
                {Math.round((totalSeconds - secondsRemaining) / 60)} minutes
              </strong>{' '}
              so far. We will record your effort honestly without penalty.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Keep focusing
              </button>
              <button
                type="button"
                onClick={handleConfirmEndEarly}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[var(--accent-break)] text-white text-xs font-medium hover:opacity-90"
              >
                Record &amp; take a break
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
