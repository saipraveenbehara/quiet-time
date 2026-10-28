'use client';

import React, { useState, useEffect } from 'react';
import { Play, ArrowRight, Sparkles, Sliders, History, BookOpen } from 'lucide-react';
import { FOCUS_PRESETS, FocusPreset, Task, StudySession } from '../lib/types';
import { storage } from '../lib/storage';

interface StartScreenProps {
  onStartFocus: (durationMinutes: number, taskTitle: string, taskId?: string) => void;
  defaultDuration: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartFocus,
  defaultDuration,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    const match = FOCUS_PRESETS.find((p) => p.minutes === defaultDuration);
    return match ? match.id : 'custom';
  });
  const [customMinutes, setCustomMinutes] = useState<number>(defaultDuration || 25);
  const [taskInput, setTaskInput] = useState<string>('');
  const [lastUnfinishedTask, setLastUnfinishedTask] = useState<Task | null>(null);
  const [todaySummary, setTodaySummary] = useState<{ count: number; totalMinutes: number }>({
    count: 0,
    totalMinutes: 0,
  });

  useEffect(() => {
    const loadState = async () => {
      const unfinished = await storage.getLastUnfinishedTask();
      setLastUnfinishedTask(unfinished);

      const sessions = await storage.getSessions();
      const today = new Date().toDateString();
      const todaySessions = sessions.filter(
        (s) => new Date(s.createdAt).toDateString() === today && s.sessionType === 'focus'
      );
      const totalSecs = todaySessions.reduce((acc, s) => acc + (s.actualSeconds || 0), 0);
      setTodaySummary({
        count: todaySessions.length,
        totalMinutes: Math.round(totalSecs / 60),
      });
    };
    loadState();
  }, []);

  const getEffectiveMinutes = (): number => {
    if (selectedPresetId === 'custom') return customMinutes;
    const preset = FOCUS_PRESETS.find((p) => p.id === selectedPresetId);
    return preset ? preset.minutes : 25;
  };

  const handleStartWithTask = async () => {
    const minutes = getEffectiveMinutes();
    const title = taskInput.trim() || 'General focus';
    let taskId: string | undefined = undefined;

    if (taskInput.trim()) {
      const created = await storage.saveTask(title);
      taskId = created.id;
    }

    onStartFocus(minutes, title, taskId);
  };

  const handleStartWithoutTask = () => {
    const minutes = getEffectiveMinutes();
    onStartFocus(minutes, 'Focus interval');
  };

  const handleResumeTask = (task: Task) => {
    setTaskInput(task.title);
    const minutes = getEffectiveMinutes();
    onStartFocus(minutes, task.title, task.id);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-300">
      {/* Header & Editorial Welcome */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase bg-[var(--accent-focus-light)] text-[var(--accent-focus)] mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          Evidence-Informed Focus
        </span>
        <h1 className="font-editorial-serif text-3xl sm:text-4xl font-normal text-[var(--text-primary)] tracking-tight">
          One quiet interval at a time.
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          Set a gentle boundary for your attention. Choose a manageable time, name one step, or simply begin.
        </p>
      </div>

      {/* Main Start Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* 1. Duration Presets */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
              Focus Duration
            </label>
            <span className="text-xs text-[var(--text-muted)]">
              {selectedPresetId === 'custom' ? `${customMinutes} minutes` : `${getEffectiveMinutes()} minutes`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {FOCUS_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`py-2.5 px-2 rounded-xl text-center text-sm font-medium transition-all border ${
                    isSelected
                      ? 'border-[var(--accent-focus)] bg-[var(--accent-focus-light)] text-[var(--accent-focus)] font-semibold shadow-2xs'
                      : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-subtle)]'
                  }`}
                  aria-pressed={isSelected}
                >
                  {preset.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedPresetId('custom')}
              className={`py-2.5 px-2 rounded-xl text-center text-sm font-medium transition-all border flex items-center justify-center gap-1 ${
                selectedPresetId === 'custom'
                  ? 'border-[var(--accent-focus)] bg-[var(--accent-focus-light)] text-[var(--accent-focus)] font-semibold shadow-2xs'
                  : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-subtle)]'
              }`}
              aria-pressed={selectedPresetId === 'custom'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom</span>
            </button>
          </div>

          {/* Preset Rationale & Context */}
          <div className="mt-2.5 text-xs text-[var(--text-muted)] italic">
            {selectedPresetId !== 'custom'
              ? FOCUS_PRESETS.find((p) => p.id === selectedPresetId)?.rationale
              : 'Choose any duration from 5 to 90 minutes that matches your energy.'}
          </div>

          {/* Custom Slider Drawer */}
          {selectedPresetId === 'custom' && (
            <div className="mt-3 p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                <span>5 min</span>
                <span className="font-semibold text-[var(--accent-focus)] text-sm">{customMinutes} min</span>
                <span>90 min</span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                step="5"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                className="w-full accent-[var(--accent-focus)] cursor-pointer"
                aria-label="Custom duration in minutes"
              />
            </div>
          )}
        </div>

        {/* 2. Optional Task Definition */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="focus-task-input"
              className="text-xs font-semibold tracking-wider uppercase text-[var(--text-secondary)]"
            >
              One Small Task <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--accent-focus)]" />
              Lowers starting friction
            </span>
          </div>

          <div className="relative">
            <input
              id="focus-task-input"
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleStartWithTask();
                }
              }}
              placeholder="e.g. Read two pages of Chapter 3, or draft email"
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:border-[var(--accent-focus)] focus:ring-1 focus:ring-[var(--accent-focus)] transition-colors"
            />
          </div>

          {/* Resume Last Task Suggestion */}
          {lastUnfinishedTask && !taskInput && (
            <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border)] text-xs">
              <span className="text-[var(--text-secondary)] truncate mr-2">
                Continue last: <strong className="text-[var(--text-primary)] font-medium">{lastUnfinishedTask.title}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleResumeTask(lastUnfinishedTask)}
                className="shrink-0 text-[var(--accent-focus)] font-medium hover:underline flex items-center gap-1"
              >
                <span>Resume</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* 3. Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleStartWithTask}
            className="w-full py-3.5 px-5 rounded-xl bg-[var(--accent-focus)] hover:opacity-95 text-white font-medium text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {taskInput.trim() ? `Focus on "${taskInput.trim().slice(0, 28)}${taskInput.trim().length > 28 ? '...' : ''}"` : 'Start a focus session'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleStartWithoutTask}
            className="w-full py-2.5 px-4 text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-center"
          >
            Start without naming a task
          </button>
        </div>
      </div>

      {/* Honest Effort Summary */}
      <div className="mt-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card-subtle)]/70 text-xs text-[var(--text-secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--accent-focus)]" />
          <span>
            {todaySummary.count > 0 ? (
              <>
                Today&apos;s effort:{' '}
                <strong className="text-[var(--text-primary)] font-medium">
                  {todaySummary.totalMinutes} minutes
                </strong>{' '}
                ({todaySummary.count} {todaySummary.count === 1 ? 'interval' : 'intervals'})
              </>
            ) : (
              'No intervals yet today. A 15-minute start is always enough.'
            )}
          </span>
        </div>
        <span className="text-[var(--text-muted)] text-[11px] hidden sm:inline">
          Rest & recovery built in
        </span>
      </div>
    </div>
  );
};
