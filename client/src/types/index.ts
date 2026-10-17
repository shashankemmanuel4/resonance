import {
  ActivityCategory,
  Lighting,
  PeoplePresent,
  CreateMomentInput,
} from "../../../shared/schemas/moment.schema.js";

export type { ActivityCategory, Lighting, PeoplePresent, CreateMomentInput };

export interface Moment {
  _id: string;
  userId: string;
  timestamp: string;
  durationMinutes: number;
  activity: {
    category: ActivityCategory;
    taskName: string;
  };
  environment: {
    location: string;
    noiseLevel: number;
    lighting: Lighting;
    peoplePresent: PeoplePresent;
  };
  experience: {
    focusScore: number;
    energyScore: number;
    moodScore: number;
    distractions: string[];
  };
  reflection: string;
  resonanceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface MomentsResponse {
  moments: Moment[];
  total: number;
  page: number;
  pages: number;
}

export interface PulseWeekStats {
  sessionCount: number;
  totalLoggedMinutes: number;
  avgFocus: number;
  avgEnergy: number;
  avgResonance: number;
}

export interface PulseTopLocation {
  location: string;
  avgResonance: number;
  count: number;
}

export interface PulseDailyTrendItem {
  date: string;
  avgFocus: number;
  avgEnergy: number;
  sessions: number;
}

export interface PulseData {
  weekStats: PulseWeekStats | null;
  topLocation: PulseTopLocation | null;
  dailyTrend: PulseDailyTrendItem[];
}

export interface MatrixItem {
  location: string;
  lighting: string;
  noiseLevel: number;
  sessionCount: number;
  totalMinutes: number;
  avgFocus: number;
  avgEnergy: number;
  avgResonance: number;
}

export interface ChronobiologyItem {
  hour: number;
  momentCount: number;
  totalDuration: number;
  avgFocus: number;
  avgEnergy: number;
}

export interface DistractionItem {
  distraction: string;
  occurrences: number;
  avgFocus: number;
  baselineFocus: number;
  totalSessions: number;
  focusDelta: number;
}

export interface AnalyticsSummary {
  totalMoments: number;
  totalMinutes: number;
  avgFocus: number;
  avgEnergy: number;
  avgResonance: number;
}

export interface UserPreferences {
  timezone: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    details: unknown[];
  };
}
