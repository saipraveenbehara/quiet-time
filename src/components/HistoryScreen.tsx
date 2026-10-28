'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Download,
  Filter,
  CheckCircle,
  FileText,
  AlertTriangle,
  PenTool,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { StudySession } from '../lib/types';
import { storage } from '../lib/storage';

export const HistoryScreen: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [filter, setFilter] = useState<'all' | 'focus' | 'break'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      const data = await storage.getSessions();
      setSessions(data);
      setIsLoading(false);
    };
    fetchSessions();
  }, []);

  const handleExport = () => {
    const jsonStr = storage.exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiet-study-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    storage.clearAllData();
    setSessions([]);
    setShowClearConfirm(false);
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'focus') return s.sessionType === 'focus';
    if (filter === 'break') return s.sessionType === 'break';
    return true;
  });

  // Calculate honest aggregate metrics
  const totalFocusSeconds = sessions
    .filter((s) => s.sessionType === 'focus')
    .reduce((acc, s) => acc + (s.actualSeconds || 0), 0);
  const totalHours = (totalFocusSeconds / 3600).toFixed(1);
  const totalCompleted = sessions.filter((s) => s.completed && s.sessionType === 'focus').length;

  // Group by date
  const groupedSessions: { [dateStr: string]: StudySession[] } = {};
  filteredSessions.forEach((session) => {
    const dateObj = new Date(session.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let key = dateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (dateObj.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    }

    if (!groupedSessions[key]) {
      groupedSessions[key] = [];
    }
    groupedSessions[key].push(session);
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-300">
      {/* Title & Editorial Description */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial-serif text-3xl font-normal text-[var(--text-primary)]">
            Effort Log
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">
            An honest record of where you directed your attention. Free of moral streaks.
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Download your session data in JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] hover:text-red-600 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Aggregate Overview Card */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Total Focused Time
            </span>
            <div className="font-editorial-serif text-2xl font-normal text-[var(--text-primary)]">
              {totalHours} hrs
            </div>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {Math.round(totalFocusSeconds / 60)} minutes
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Completed Intervals
            </span>
            <div className="font-editorial-serif text-2xl font-normal text-[var(--accent-focus)]">
              {totalCompleted}
            </div>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Full cycles finished
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Average Interval
            </span>
            <div className="font-editorial-serif text-2xl font-normal text-[var(--text-primary)]">
              {totalCompleted > 0 ? Math.round(totalFocusSeconds / totalCompleted / 60) : 0} min
            </div>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Pacing per session
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--border)] pb-3">
        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {(['all', 'focus', 'break'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilter(mode)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
              filter === mode
                ? 'bg-[var(--accent-focus)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
            }`}
          >
            {mode === 'all' ? 'All records' : mode}
          </button>
        ))}
      </div>

      {/* Sessions Content */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[var(--text-muted)]">
          Loading history...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-2xl p-8 bg-[var(--bg-card)]/50">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-card-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-editorial-serif text-lg font-medium text-[var(--text-primary)]">
            No sessions recorded yet
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            When you complete or pause your first focus interval, it will appear here with your task notes and reflections.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([dateLabel, groupSessions]) => (
            <div key={dateLabel} className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
                {dateLabel}
              </h2>

              <div className="space-y-2">
                {groupSessions.map((session) => {
                  const minutes = Math.max(1, Math.round(session.actualSeconds / 60));
                  const isBreak = session.sessionType === 'break';

                  return (
                    <div
                      key={session.id}
                      className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isBreak ? (
                            <span className="p-1 rounded-md bg-[var(--accent-break-light)] text-[var(--accent-break)]">
                              <Coffee className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-md bg-[var(--accent-focus-light)] text-[var(--accent-focus)]">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </span>
                          )}

                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {session.taskTitle}
                          </span>

                          {!session.completed && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              Paused early
                            </span>
                          )}
                        </div>

                        {session.reflectionNote && (
                          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-card-subtle)] p-2 rounded-lg mt-1 italic flex items-start gap-1.5">
                            <FileText className="w-3 h-3 text-[var(--text-muted)] shrink-0 mt-0.5" />
                            <span>&quot;{session.reflectionNote}&quot;</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] shrink-0">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {minutes} min
                        </span>
                        <span>
                          {new Date(session.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-editorial-serif text-lg font-medium text-[var(--text-primary)]">
                Clear all local history?
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This will remove all session records stored in your browser. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Keep history
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700"
              >
                Yes, clear data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
