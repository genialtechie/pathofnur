/**
 * User preferences collected during onboarding.
 * Persisted to AsyncStorage after each step.
 */
export type UserPreferences = {
  completedOnboarding: boolean;
  intent: string[];
  journeyStage: string;
  prayerConsistency: string;
  quranTime: string;
  planGoals: string[];
  dailyMinutes: string;
  notificationsEnabled: boolean;
  locationGranted: boolean;
  coords?: { lat: number; lng: number };
  city?: string;
  timezone?: string;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  completedOnboarding: false,
  intent: [],
  journeyStage: "",
  prayerConsistency: "",
  quranTime: "",
  planGoals: [],
  dailyMinutes: "",
  notificationsEnabled: false,
  locationGranted: false,
};

export const PREFERENCES_STORAGE_KEY = "@pathofnur/user_preferences";
