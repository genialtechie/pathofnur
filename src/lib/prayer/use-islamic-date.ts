/**
 * Islamic Date Hook
 * 
 * Returns current Hijri date
 */

import { useState, useEffect } from "react";
import { fetchPrayerTimes } from "./aladhan-client";
import type { IslamicDate } from "./types";

interface UseIslamicDateReturn {
  date: IslamicDate | null;
  isLoading: boolean;
  error: string | null;
}

export function useIslamicDate(
  latitude: number | undefined,
  longitude: number | undefined
): UseIslamicDateReturn {
  const [date, setDate] = useState<IslamicDate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDate() {
      if (latitude === undefined || longitude === undefined) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { islamicDate } = await fetchPrayerTimes({
          latitude,
          longitude,
        });

        setDate(islamicDate);
      } catch (err) {
        console.error("Failed to fetch Islamic date:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch date");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDate();
  }, [latitude, longitude]);

  return { date, isLoading, error };
}
