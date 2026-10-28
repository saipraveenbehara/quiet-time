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

const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: 'guest_user',
  email: null,
  displayName: 'Student',
  focusArea: 'Preparing for Exams & Projects',
  isGuest: true,
  preferences: DEFAULT_PREFERENCES,
};

const isValidUUID = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
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
    const local = this.getLocalSessions();
    const supabase = getSupabaseClient();
    
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.access_token) {
          const user = session.user;
          const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const cloudSessions: StudySession[] = data.map((d) => ({
              id: d.id,
              userId: d.user_id,
              taskTitle: d.task_title || 'Untitled focus',
              taskId: d.task_id,
              durationMinutes: d.duration_minutes,
              actualSeconds: d.actual_seconds,
              completed: d.completed,
              reflectionNote: d.reflection_note,
              sessionType: (d.session_type as 'focus' | 'break') || 'focus',
              createdAt: d.created_at,
            }));

            // Merge cloud and any unsynced local sessions
            const cloudIds = new Set(cloudSessions.map((s) => s.id));
            const unsyncedLocal = local.filter((s) => !cloudIds.has(s.id));
            return [...cloudSessions, ...unsyncedLocal];
          }
        }
      } catch (e) {
        console.error('Supabase getSessions error, falling back to local', e);
      }
    }

    return local;
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
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (authSession?.user && authSession.access_token) {
          const user = authSession.user;
          // Verify taskId is a valid UUID that exists in Supabase before attaching foreign key
          let safeTaskId: string | null = null;
          if (isValidUUID(newSession.taskId)) {
            const { data: taskRow } = await supabase
              .from('tasks')
              .select('id')
              .eq('id', newSession.taskId)
              .maybeSingle();
            if (taskRow) {
              safeTaskId = taskRow.id;
            }
          }

          const { data, error } = await supabase
            .from('sessions')
            .insert({
              user_id: user.id,
              task_title: newSession.taskTitle,
              task_id: safeTaskId,
              duration_minutes: newSession.durationMinutes,
              actual_seconds: newSession.actualSeconds,
              completed: newSession.completed,
              reflection_note: newSession.reflectionNote || null,
              session_type: newSession.sessionType,
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase session insert error:', error.message, error.details);
          } else if (data) {
            newSession.id = data.id;
            newSession.userId = data.user_id;
          }
        } else {
          console.log('User is in Guest mode. Session saved locally to browser storage.');
        }
      } catch (e) {
        console.error('Supabase session insert exception:', e);
      }
    }

    // Always mirror to localStorage for offline access and guest sessions
    if (typeof window !== 'undefined') {
      try {
        const current = this.getLocalSessions();
        const updated = [newSession, ...current.filter((s) => s.id !== newSession.id)];
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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.access_token) {
          const user = session.user;
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

    const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}`;
    const newTask: Task = {
      id: generatedId,
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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.access_token) {
          const user = session.user;
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
    if (supabase && isValidUUID(taskId)) {
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

  // Sync any unsynced local sessions to Supabase when a user signs in
  async syncLocalSessionsToCloud(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const localSessions = this.getLocalSessions();
    if (localSessions.length === 0) return;

    for (const session of localSessions) {
      try {
        await supabase.from('sessions').insert({
          user_id: userId,
          task_title: session.taskTitle,
          duration_minutes: session.durationMinutes,
          actual_seconds: session.actualSeconds,
          completed: session.completed,
          reflection_note: session.reflectionNote || null,
          session_type: session.sessionType,
          created_at: session.createdAt,
        });
      } catch (e) {
        console.error('Error syncing local session to cloud:', e);
      }
    }
  },

  // --- Active Session Persistence for Tab Refresh / Backgrounding ---
  saveActiveSessionState(state: {
    mode: 'focus' | 'break';
    taskTitle: string;
    taskId?: string | null;
    totalDurationSeconds: number;
    endTimestamp: number | null;
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
