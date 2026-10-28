import {
  StudySession,
  Task,
  UserProfile,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PROFILE: 'study_timer_profile',
  PREFERENCES: 'study_timer_preferences',
  SESSIONS: 'study_timer_sessions',
  TASKS: 'study_timer_tasks',
  ACTIVE_SESSION: 'study_timer_active_state',
};

// Default Guest Profile
const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: 'guest_user',
  email: null,
  displayName: 'Student',
  focusArea: 'Preparing for Exams & Projects',
  isGuest: true,
  preferences: DEFAULT_PREFERENCES,
};

export const storage = {
  // --- Profile & Preferences ---
  getProfile(): UserProfile {
    if (typeof window === 'undefined') return DEFAULT_GUEST_PROFILE;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed reading profile from storage', e);
    }
    return DEFAULT_GUEST_PROFILE;
  },

  saveProfile(profile: UserProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed saving profile', e);
    }
  },

  getPreferences(): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed reading preferences', e);
    }
    return DEFAULT_PREFERENCES;
  },

  savePreferences(prefs: UserPreferences): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
      // Apply theme and low-stimulation classes immediately
      if (document.documentElement) {
        document.documentElement.setAttribute('data-theme', prefs.theme);
        document.documentElement.setAttribute('data-low-stimulation', prefs.lowStimulation ? 'true' : 'false');
        document.documentElement.setAttribute('data-reduced-motion', prefs.reducedMotion ? 'true' : 'false');
      }
    } catch (e) {
      console.error('Failed saving preferences', e);
    }
  },

  // --- Sessions ---
  async getSessions(): Promise<StudySession[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return data.map((d) => ({
              id: d.id,
              userId: d.user_id,
              taskTitle: d.task_title || 'Untitled focus',
              taskId: d.task_id,
              durationMinutes: d.duration_minutes,
              actualSeconds: d.actual_seconds,
              completed: d.completed,
              reflectionNote: d.reflection_note,
              sessionType: d.session_type || 'focus',
              createdAt: d.created_at,
            }));
          }
        }
      } catch (e) {
        console.error('Supabase getSessions error, falling back to local', e);
      }
    }

    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed reading sessions from localStorage', e);
      return [];
    }
  },

  async saveSession(session: Omit<StudySession, 'id' | 'createdAt'>): Promise<StudySession> {
    const newSession: StudySession = {
      ...session,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('sessions')
            .insert({
              user_id: user.id,
              task_title: newSession.taskTitle,
              task_id: newSession.taskId,
              duration_minutes: newSession.durationMinutes,
              actual_seconds: newSession.actualSeconds,
              completed: newSession.completed,
              reflection_note: newSession.reflectionNote,
              session_type: newSession.sessionType,
            })
            .select()
            .single();

          if (!error && data) {
            newSession.id = data.id;
          }
        }
      } catch (e) {
        console.error('Supabase session insert error', e);
      }
    }

    // Always mirror to localStorage for offline access and guest sessions
    if (typeof window !== 'undefined') {
      try {
        const current = await this.getLocalSessions();
        const updated = [newSession, ...current];
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed writing session to localStorage', e);
      }
    }

    return newSession;
  },

  getLocalSessions(): StudySession[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // --- Tasks ---
  async getTasks(): Promise<Task[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (!error && data) {
            return data.map((t) => ({
              id: t.id,
              userId: t.user_id,
              title: t.title,
              isCompleted: t.is_completed,
              totalFocusSeconds: t.total_focus_seconds,
              createdAt: t.created_at,
              updatedAt: t.updated_at,
            }));
          }
        }
      } catch (e) {
        console.error('Supabase getTasks error', e);
      }
    }

    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async saveTask(title: string): Promise<Task> {
    const trimmed = title.trim();
    const currentTasks = await this.getTasks();
    const existing = currentTasks.find((t) => t.title.toLowerCase() === trimmed.toLowerCase() && !t.isCompleted);
    if (existing) return existing;

    const newTask: Task = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}`,
      userId: 'guest_user',
      title: trimmed,
      isCompleted: false,
      totalFocusSeconds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          newTask.userId = user.id;
          const { data, error } = await supabase
            .from('tasks')
            .insert({
              user_id: user.id,
              title: trimmed,
            })
            .select()
            .single();

          if (!error && data) {
            newTask.id = data.id;
          }
        }
      } catch (e) {
        console.error('Supabase task insert error', e);
      }
    }

    if (typeof window !== 'undefined') {
      const tasks = [newTask, ...currentTasks];
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }

    return newTask;
  },

  async updateTaskFocus(taskId: string, additionalSeconds: number): Promise<void> {
    const tasks = await this.getTasks();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          totalFocusSeconds: t.totalFocusSeconds + additionalSeconds,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const target = updated.find((t) => t.id === taskId);
        if (target) {
          await supabase
            .from('tasks')
            .update({
              total_focus_seconds: target.totalFocusSeconds,
              updated_at: new Date().toISOString(),
            })
            .eq('id', taskId);
        }
      } catch (e) {
        console.error('Supabase updateTaskFocus error', e);
      }
    }
  },

  async getLastUnfinishedTask(): Promise<Task | null> {
    const tasks = await this.getTasks();
    const unfinished = tasks.filter((t) => !t.isCompleted);
    return unfinished.length > 0 ? unfinished[0] : null;
  },

  // --- Active Session Persistence for Tab Refresh / Backgrounding ---
  saveActiveSessionState(state: {
    mode: 'focus' | 'break';
    taskTitle: string;
    taskId?: string | null;
    totalDurationSeconds: number;
    endTimestamp: number | null; // epoch ms
    secondsRemaining: number;
    isPaused: boolean;
    startedAt: string;
  } | null): void {
    if (typeof window === 'undefined') return;
    if (state === null) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(state));
    }
  },

  getActiveSessionState() {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  clearAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  },

  exportDataJson(): string {
    const data = {
      profile: this.getProfile(),
      preferences: this.getPreferences(),
      sessions: this.getLocalSessions(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },
};
