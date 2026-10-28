'use client';

import React, { useState } from 'react';
import { X, Check, PenTool } from 'lucide-react';

interface DistractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (note: string) => void;
  existingNotes: string[];
}

export const DistractionModal: React.FC<DistractionModalProps> = ({
  isOpen,
  onClose,
  onSaveNote,
  existingNotes,
}) => {
  const [noteText, setNoteText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onSaveNote(noteText.trim());
    setNoteText('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="distraction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-focus-light)] text-[var(--accent-focus)]">
              <PenTool className="w-4 h-4" />
            </div>
            <h3 id="distraction-modal-title" className="font-editorial-serif text-lg font-medium text-[var(--text-primary)]">
              Clear your mind
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          Did an off-topic thought pop up? Park it here so your brain can let it go, and attend to it during your break.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            autoFocus
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Email prof about lab partner, buy groceries..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:ring-1 focus:ring-[var(--accent-focus)]"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!noteText.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--accent-focus)] hover:opacity-90 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Park thought</span>
            </button>
          </div>
        </form>

        {existingNotes.length > 0 && (
          <div className="pt-3 border-t border-[var(--border)]">
            <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium block mb-2">
              Captured this session ({existingNotes.length})
            </span>
            <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {existingNotes.map((note, index) => (
                <li
                  key={index}
                  className="text-xs p-2 rounded-lg bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] flex items-start gap-2"
                >
                  <span className="text-[var(--accent-focus)] font-bold">•</span>
                  <span className="break-words">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
