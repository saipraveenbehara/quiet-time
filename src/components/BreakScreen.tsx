'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Coffee,
  RotateCw,
  ArrowRight,
  Sparkles,
  Droplet,
  Eye,
  Wind,
  Sun,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import { BREAK_ACTIVITIES, BreakActivity } from '../lib/types';
import { soundService } from '../lib/sound';

interface BreakScreenProps {
  defaultBreakDurationMinutes: number;
  distractionNotes: string[];
  onStartNextFocus: () => void;
  onFinishEverything: () => void;
  soundEnabled: boolean;
}

export const BreakScreen: React.FC<BreakScreenProps> = ({
  defaultBreakDurationMinutes,
  distractionNotes,
  onStartNextFocus,
  onFinishEverything,
  soundEnabled,
}) => {
  // Phase: 'choice' | 'active' | 'overtime'
  const [phase, setPhase] = useState<'choice' | 'active' | 'overtime'>('choice');
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(defaultBreakDurationMinutes || 5);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(breakDurationMinutes * 60);
  const [overtimeSeconds, setOvertimeSeconds] = useState<number>(0);

  // Suggestion rotation
  const [activityIndex, setActivityIndex] = useState<number>(0);
  const currentActivity: BreakActivity = BREAK_ACTIVITIES[activityIndex % BREAK_ACTIVITIES.length];

  // Breathing pacer state
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  const endTimestampRef = useRef<number | null>(null);

  // Handle choice selection to start break
  const handleStartBreak = (minutes: number) => {
    setBreakDurationMinutes(minutes);
    const secs = minutes * 60;
    setSecondsRemaining(secs);
    endTimestampRef.current = Date.now() + secs * 1000;
    setPhase('active');
  };

  // Timer effect for active break
  useEffect(() => {
    if (phase !== 'active' && phase !== 'overtime') return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (endTimestampRef.current) {
        const diff = Math.round((endTimestampRef.current - now) / 1000);
        if (diff > 0) {
          setSecondsRemaining(diff);
        } else {
          setSecondsRemaining(0);
          setPhase('overtime');
          setOvertimeSeconds(Math.abs(diff));
          if (soundEnabled && diff === 0) {
            soundService.playCompletionChime();
          }
        }
      } else if (phase === 'overtime') {
        setOvertimeSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, soundEnabled]);

  // Breathing pacer animation cycle: 4s Inhale, 4s Hold, 6s Exhale
  useEffect(() => {
    if (!isBreathingActive) return;

    let cycleTimeout: NodeJS.Timeout;
    const runCycle = () => {
      setBreathPhase('Inhale');
      cycleTimeout = setTimeout(() => {
        setBreathPhase('Hold');
        cycleTimeout = setTimeout(() => {
          setBreathPhase('Exhale');
          cycleTimeout = setTimeout(() => {
            runCycle();
          }, 6000);
        }, 4000);
      }, 4000);
    };

    runCycle();
    return () => clearTimeout(cycleTimeout);
  }, [isBreathingActive]);

  const handleNextActivity = () => {
    setActivityIndex((prev) => (prev + 1) % BREAK_ACTIVITIES.length);
  };

  const minutesLeft = Math.floor(secondsRemaining / 60);
  const secondsLeft = secondsRemaining % 60;
  const formattedCountdown = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Eye':
        return <Eye className="w-5 h-5 text-[var(--accent-break)]" />;
      case 'Droplet':
        return <Droplet className="w-5 h-5 text-[var(--accent-break)]" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-[var(--accent-break)]" />;
      case 'Sun':
        return <Sun className="w-5 h-5 text-[var(--accent-break)]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[var(--accent-break)]" />;
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-300">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-xs text-center space-y-6">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase bg-[var(--accent-break-light)] text-[var(--accent-break)]">
          <Coffee className="w-3.5 h-3.5" />
          <span>Rest &amp; Reset</span>
        </div>

        {/* Phase 1: Choice before break starts */}
        {phase === 'choice' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="font-editorial-serif text-3xl font-normal text-[var(--text-primary)]">
                Session complete.
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                Step away to let your eyes rest and tension release, or proceed directly to your next step.
              </p>
            </div>

            {/* Break Preset Buttons */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-3">
                Choose Break Duration
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[3, 5, 10].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleStartBreak(mins)}
                    className="py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent-break)] hover:bg-[var(--accent-break-light)] text-[var(--text-primary)] font-medium text-sm transition-all"
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartNextFocus}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--text-primary)] text-sm font-medium transition-colors"
              >
                Keep focusing (+ new session)
              </button>
              <button
                type="button"
                onClick={onFinishEverything}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[var(--accent-focus)] text-white text-sm font-medium hover:opacity-90 transition-all shadow-xs"
              >
                Done for now
              </button>
            </div>
          </div>
        )}

        {/* Phase 2 & 3: Active Break or Overtime */}
        {(phase === 'active' || phase === 'overtime') && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Countdown or Overtime Indicator */}
            <div>
              <div className="font-editorial-serif text-5xl sm:text-6xl font-light text-[var(--accent-break)] tracking-tight tabular-nums">
                {phase === 'active' ? formattedCountdown : `+${Math.floor(overtimeSeconds / 60)}:${String(overtimeSeconds % 60).padStart(2, '0')}`}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                {phase === 'active' ? 'Break in progress' : 'Break ended whenever you are ready'}
              </p>
            </div>

            {/* Guided Activity Suggestion Card */}
            <div className="p-5 rounded-2xl bg-[var(--accent-break-light)]/60 border border-[var(--accent-break-border)] text-left relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--bg-card)] shadow-2xs">
                    {renderIcon(currentActivity.icon)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                      {currentActivity.title}
                    </h4>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">
                      Estimated: {currentActivity.durationLabel}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextActivity}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors flex items-center gap-1 text-xs font-medium"
                  title="Show another idea"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {currentActivity.instruction}
              </p>

              {/* Interactive Breathing Companion if category is breathing */}
              {currentActivity.category === 'breathing' && (
                <div className="mt-4 pt-4 border-t border-[var(--accent-break-border)] text-center">
                  <button
                    type="button"
                    onClick={() => setIsBreathingActive(!isBreathingActive)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[var(--accent-break)] text-[var(--accent-break)] hover:bg-[var(--accent-break)] hover:text-white transition-colors"
                  >
                    {isBreathingActive ? 'Stop Guided Rhythm' : 'Follow Breathing Rhythm'}
                  </button>

                  {isBreathingActive && (
                    <div className="mt-4 flex flex-col items-center justify-center">
                      <div
                        className={`w-24 h-24 rounded-full border-2 border-[var(--accent-break)] flex items-center justify-center transition-all duration-3000 ease-in-out ${
                          breathPhase === 'Inhale'
                            ? 'scale-125 bg-[var(--accent-break)]/20'
                            : breathPhase === 'Hold'
                            ? 'scale-125 bg-[var(--accent-break)]/30'
                            : 'scale-90 bg-[var(--accent-break)]/5'
                        }`}
                      >
                        <span className="text-xs font-semibold text-[var(--accent-break)]">
                          {breathPhase}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] mt-2">
                        {breathPhase === 'Inhale' ? 'Inhale gently (4s)' : breathPhase === 'Hold' ? 'Hold softly (4s)' : 'Slow exhale (6s)'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Parked Distraction Notes Glance */}
            {distractionNotes.length > 0 && (
              <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border)] text-left text-xs">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium mb-2">
                  <ListTodo className="w-3.5 h-3.5 text-[var(--accent-focus)]" />
                  <span>Thoughts parked during focus ({distractionNotes.length})</span>
                </div>
                <ul className="space-y-1">
                  {distractionNotes.map((note, i) => (
                    <li key={i} className="text-[var(--text-primary)] list-disc list-inside">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Break Navigation Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartNextFocus}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--accent-focus)] text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-xs"
              >
                <span>Ready to focus again</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onFinishEverything}
                className="w-full sm:w-auto px-4 py-3 text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Done for today
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
