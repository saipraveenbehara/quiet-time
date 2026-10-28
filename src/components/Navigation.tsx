'use client';

import React from 'react';
import { Timer, Clock, User, ShieldAlert } from 'lucide-react';

export type NavTab = 'timer' | 'history' | 'profile';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isTimerActive: boolean;
  onOpenAuth?: () => void;
  isGuest: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  isTimerActive,
  onOpenAuth,
  isGuest,
}) => {
  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 md:static md:bottom-auto border-t md:border-t-0 md:border-b border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-md px-4 py-2 md:py-3 transition-colors"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* App Title / Logo for Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-focus)] text-white flex items-center justify-center font-editorial-serif text-base font-semibold shadow-xs">
            st
          </div>
          <span className="font-editorial-serif text-lg tracking-tight font-medium text-[var(--text-primary)]">
            Quiet Study
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 mx-auto md:mx-0 w-full md:w-auto justify-around md:justify-end">
          <button
            onClick={() => onSelectTab('timer')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'timer'
                ? 'bg-[var(--accent-focus-light)] text-[var(--accent-focus)] font-semibold shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
            }`}
            aria-current={currentTab === 'timer' ? 'page' : undefined}
          >
            <Timer className="w-4 h-4" />
            <span>Focus</span>
            {isTimerActive && currentTab !== 'timer' && (
              <span className="w-2 h-2 rounded-full bg-[var(--accent-focus)] animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'history'
                ? 'bg-[var(--accent-focus-light)] text-[var(--accent-focus)] font-semibold shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
            }`}
            aria-current={currentTab === 'history' ? 'page' : undefined}
          >
            <Clock className="w-4 h-4" />
            <span>Effort Log</span>
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'profile'
                ? 'bg-[var(--accent-focus-light)] text-[var(--accent-focus)] font-semibold shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
            }`}
            aria-current={currentTab === 'profile' ? 'page' : undefined}
          >
            <User className="w-4 h-4" />
            <span>Profile & Settings</span>
          </button>

          {isGuest && onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="hidden lg:flex items-center gap-1.5 ml-3 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)] transition-colors"
            >
              <span>Sign In / Sync</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
