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

function getTodayKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDelayUntilNextDay(date = new Date()) {
  const nextDay = new Date(date);
  nextDay.setHours(24, 0, 0, 0);
  return Math.max(1_000, nextDay.getTime() - date.getTime());
}

export function useIslamicDate(
  latitude: number | undefined,
  longitude: number | undefined
): UseIslamicDateReturn {
  const [date, setDate] = useState<IslamicDate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState(() => getTodayKey());

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTodayKey(getTodayKey());
    }, getDelayUntilNextDay());

    return () => {
      clearTimeout(timeoutId);
    };
  }, [todayKey]);

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
  }, [latitude, longitude, todayKey]);

  return { date, isLoading, error };
}
