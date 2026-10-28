export type TimerMode = 'focus' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface FocusPreset {
  id: string;
  minutes: number;
  label: string;
  rationale: string;
}

export interface BreakActivity {
  id: string;
  title: string;
  instruction: string;
  durationLabel: string;
  category: 'eye-rest' | 'movement' | 'breathing' | 'hydration';
  icon: string;
}

export interface DistractionNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  taskTitle: string;
  taskId?: string | null;
  durationMinutes: number;
  actualSeconds: number;
  completed: boolean;
  reflectionNote?: string | null;
  sessionType: 'focus' | 'break';
  distractionNotes?: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  isCompleted: boolean;
  totalFocusSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  defaultFocusDuration: number; // 15, 25, 45, etc.
  defaultBreakDuration: number; // 3, 5, 10
  soundEnabled: boolean;
  encouragementStyle: 'warm' | 'neutral' | 'minimal';
  reducedMotion: boolean;
  lowStimulation: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string;
  focusArea: string;
  isGuest: boolean;
  preferences: UserPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultFocusDuration: 25,
  defaultBreakDuration: 5,
  soundEnabled: true,
  encouragementStyle: 'warm',
  reducedMotion: false,
  lowStimulation: false,
  theme: 'light',
};

export const FOCUS_PRESETS: FocusPreset[] = [
  {
    id: 'sprint',
    minutes: 15,
    label: '15 min',
    rationale: 'Quick start for overcoming initial resistance or low energy',
  },
  {
    id: 'balanced',
    minutes: 25,
    label: '25 min',
    rationale: 'A steady, manageable rhythm for problem sets and reading',
  },
  {
    id: 'deep',
    minutes: 45,
    label: '45 min',
    rationale: 'Longer immersion when deep context-switching is costly',
  },
];

export const BREAK_ACTIVITIES: BreakActivity[] = [
  {
    id: '20-20-20',
    title: 'Rest your eyes (20-20-20)',
    instruction: 'Look at an object at least 20 feet away for 20 seconds to relax your eye muscles.',
    durationLabel: '20 seconds',
    category: 'eye-rest',
    icon: 'Eye',
  },
  {
    id: 'hydrate',
    title: 'Hydrate & change posture',
    instruction: 'Stand up, walk away from your desk, and drink a full glass of cool water.',
    durationLabel: '1 - 2 mins',
    category: 'hydration',
    icon: 'Droplet',
  },
  {
    id: 'shoulder-roll',
    title: 'Gentle neck & shoulder ease',
    instruction: 'Drop your shoulders, gently tilt your head side to side, and loosen jaw clenching.',
    durationLabel: '1 min',
    category: 'movement',
    icon: 'Sparkles',
  },
  {
    id: 'deep-breath',
    title: 'Calm physiological sigh',
    instruction: 'Take two quick deep inhales through your nose, then a long, slow sigh out through your mouth.',
    durationLabel: '1 - 2 mins',
    category: 'breathing',
    icon: 'Wind',
  },
  {
    id: 'stretch',
    title: 'Stand and stretch',
    instruction: 'Reach both arms toward the ceiling, open your chest, and take three expansive breaths.',
    durationLabel: '2 mins',
    category: 'movement',
    icon: 'Sun',
  },
];
