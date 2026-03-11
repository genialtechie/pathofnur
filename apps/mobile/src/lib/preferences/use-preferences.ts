import { useCallback, useEffect, useState } from "react";

import {
  getPreferences,
  updatePreferences,
} from "./preferences-store";
import { DEFAULT_PREFERENCES, type UserPreferences } from "./types";

/**
 * React hook for reading / writing user preferences.
 * Loads from AsyncStorage on mount; exposes `update` to merge changes.
 */
export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getPreferences().then((p) => {
      setPrefs(p);
      setIsLoading(false);
    });
  }, []);

  const update = useCallback(async (updates: Partial<UserPreferences>) => {
    const merged = await updatePreferences(updates);
    setPrefs(merged);
    return merged;
  }, []);

  return { prefs, update, isLoading } as const;
}
