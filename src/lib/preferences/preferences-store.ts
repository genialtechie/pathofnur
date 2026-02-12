import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  type UserPreferences,
} from "./types";

/**
 * Read preferences from AsyncStorage.
 * Returns defaults if nothing stored yet.
 */
export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Merge partial updates into stored preferences.
 */
export async function updatePreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getPreferences();
  const merged = { ...current, ...updates };
  await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

/**
 * Clear all preferences (for dev/testing).
 */
export async function clearPreferences(): Promise<void> {
  await AsyncStorage.removeItem(PREFERENCES_STORAGE_KEY);
}
