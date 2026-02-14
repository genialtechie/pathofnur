import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ramadan_2026_progress';
const TOTAL_DAYS = 30;

export const useJourneyProgress = () => {
  const [completedDays, setCompletedDays] = useState<boolean[]>(Array(TOTAL_DAYS).fill(false));
  const [isLoading, setIsLoading] = useState(true);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCompletedDays(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load journey progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (newProgress: boolean[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Failed to save journey progress:', error);
    }
  };

  const toggleDay = useCallback(async (dayIndex: number) => {
    if (dayIndex < 0 || dayIndex >= TOTAL_DAYS) return;

    setCompletedDays(prev => {
      const newProgress = [...prev];
      newProgress[dayIndex] = !newProgress[dayIndex];
      saveProgress(newProgress); // Save side-effect
      return newProgress;
    });
  }, []);

  const streak = useMemo(() => {
    let currentStreak = 0;
    // Calculate streak from beginning or based on consecutive?
    // Usually streak is consecutive days completed up to "today".
    // But for a 30-day fixed grid, we can just count consecutive checks?
    // Let's assume simple count of completed days for now, or consecutive from day 1.
    // Given the requirement "consecutive completed days", let's count from day 1.
    
    for (let i = 0; i < TOTAL_DAYS; i++) {
        if (completedDays[i]) {
            currentStreak++;
        } else {
            // Break on first missing day? 
            // Or is it "accumulated streak"? 
            // Let's count *total completed* for now as it's more robust for a tracker
            // unless strict order is enforced.
            // Requirement says "Streak Logic: Calculate consecutive completed days."
            // If day 1 is done, day 2 is skipped, day 3 is done -> Streak 1 (or 0?).
            // Let's stick to: consecutive from the start, or max consecutive?
            // "Current streak" usually implies until a break.
            break; 
        }
    }
    return currentStreak;
  }, [completedDays]);

  return {
    completedDays,
    isLoading,
    toggleDay,
    streak,
  };
};
