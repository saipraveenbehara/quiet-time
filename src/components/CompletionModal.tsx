'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, Coffee, Sparkles } from 'lucide-react';

interface CompletionModalProps {
  taskTitle: string;
  actualSeconds: number;
  onSaveReflectionAndNext: (reflectionNote?: string) => void;
  onSkipAndTakeBreak: () => void;
  encouragementStyle?: 'warm' | 'neutral' | 'minimal';
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  taskTitle,
  actualSeconds,
  onSaveReflectionAndNext,
  onSkipAndTakeBreak,
  encouragementStyle = 'warm',
}) => {
  const [reflection, setReflection] = useState('');
  const minutes = Math.max(1, Math.round(actualSeconds / 60));

  const getGreeting = () => {
    if (encouragementStyle === 'minimal') {
      return `${minutes} minutes recorded.`;
    }
    if (encouragementStyle === 'neutral') {
      return `Session complete: ${minutes} minutes on ${taskTitle}.`;
    }
    return `Solid effort. You gave ${minutes} dedicated minutes to ${taskTitle}.`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflectionAndNext(reflection.trim() || undefined);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-focus-light)] text-[var(--accent-focus)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-editorial-serif text-2xl font-normal text-[var(--text-primary)]">
            Effort Recorded
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {getGreeting()}
          </p>
        </div>

        {/* Optional Reflection Field */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label
              htmlFor="reflection-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
            >
              Progress Note <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <textarea
              id="reflection-input"
              rows={2}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you understand better or move forward?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:ring-1 focus:ring-[var(--accent-focus)]"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onSkipAndTakeBreak}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 order-2 sm:order-1"
            >
              <Coffee className="w-3.5 h-3.5 text-[var(--accent-break)]" />
              <span>Go to break</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--accent-focus)] hover:opacity-95 text-white text-xs font-medium flex items-center justify-center gap-1.5 order-1 sm:order-2 shadow-xs"
            >
              <span>Save &amp; Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
