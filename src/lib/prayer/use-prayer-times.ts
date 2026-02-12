/**
 * Prayer Times Hook
 * 
 * Returns prayer times with current/next prayer and countdown
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchPrayerTimes } from "./aladhan-client";
import type { PrayerTimes, PrayerName, PrayerTimeInfo } from "./types";

interface UsePrayerTimesReturn {
  times: PrayerTimes | null;
  currentPrayer: PrayerName | null;
  nextPrayer: PrayerName | null;
  countdown: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Only actual prayers - Sunrise is a marker, not a prayer
const PRAYER_ORDER: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function parseTime(timeStr: string): Date {
  // Strip timezone suffix like "(BST)" or "(CEST)" before parsing
  const clean = timeStr.replace(/\s*\(.*\)$/, "");
  const [hours, minutes] = clean.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatCountdown(targetTime: Date): string {
  const now = new Date();
  const diff = targetTime.getTime() - now.getTime();

  if (diff <= 0) {
    return "Now";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function usePrayerTimes(
  latitude: number | undefined,
  longitude: number | undefined
): UsePrayerTimesReturn {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<PrayerName | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerName | null>(null);
  const [countdown, setCountdown] = useState<string>("--:--");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calculateCurrentAndNext = useCallback((prayerTimes: PrayerTimes) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let current: PrayerName | null = null;
    let next: PrayerName | null = null;
    let nextTime: Date | null = null;

    for (let i = 0; i < PRAYER_ORDER.length; i++) {
      const prayerName = PRAYER_ORDER[i];
      const prayerTime = parseTime(prayerTimes[prayerName]);
      const prayerMinutes = prayerTime.getHours() * 60 + prayerTime.getMinutes();

      if (currentMinutes >= prayerMinutes) {
        current = prayerName;
      } else if (!next) {
        next = prayerName;
        nextTime = prayerTime;
        break;
      }
    }

    // If no next prayer today, next is Fajr tomorrow
    if (!next) {
      next = "Fajr";
      nextTime = parseTime(prayerTimes.Fajr);
      nextTime.setDate(nextTime.getDate() + 1);
    }

    setCurrentPrayer(current);
    setNextPrayer(next);

    if (nextTime) {
      setCountdown(formatCountdown(nextTime));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (latitude === undefined || longitude === undefined) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { times: prayerTimes } = await fetchPrayerTimes({
        latitude,
        longitude,
      });

      setTimes(prayerTimes);
      calculateCurrentAndNext(prayerTimes);
    } catch (err) {
      console.error("Failed to fetch prayer times:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch prayer times");
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, calculateCurrentAndNext]);

  // Initial fetch
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      refresh();
    }
  }, [latitude, longitude, refresh]);

  // Update countdown every 60 seconds
  useEffect(() => {
    if (times) {
      // Initial calculation
      calculateCurrentAndNext(times);

      // Set up interval
      intervalRef.current = setInterval(() => {
        calculateCurrentAndNext(times);
      }, 60000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [times, calculateCurrentAndNext]);

  return {
    times,
    currentPrayer,
    nextPrayer,
    countdown,
    isLoading,
    error,
    refresh,
  };
}
