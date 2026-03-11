/**
 * Aladhan API Client
 * 
 * Fetches prayer times from Aladhan API with caching
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AladhanResponse, PrayerTimes, IslamicDate } from "./types";

const ALADHAN_BASE_URL = "https://api.aladhan.com/v1/timings";

interface FetchPrayerTimesParams {
  latitude: number;
  longitude: number;
  date?: Date;
}

function getCacheKey(lat: number, lng: number, date: Date): string {
  // Use local date (not UTC) to avoid edge cases near midnight
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  return `prayer_${lat.toFixed(2)}_${lng.toFixed(2)}_${dateStr}`;
}

export async function fetchPrayerTimes({
  latitude,
  longitude,
  date = new Date(),
}: FetchPrayerTimesParams): Promise<{ times: PrayerTimes; islamicDate: IslamicDate }> {
  const cacheKey = getCacheKey(latitude, longitude, date);

  // Try cache first
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const cacheTime = new Date(parsed.cachedAt);
      const now = new Date();
      const hoursSinceCache = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

      // Use cache if less than 24 hours old
      if (hoursSinceCache < 24) {
        return {
          times: parsed.times,
          islamicDate: parsed.islamicDate,
        };
      }
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }

  // Fetch from API
  const timestamp = Math.floor(date.getTime() / 1000);
  const url = `${ALADHAN_BASE_URL}/${timestamp}?latitude=${latitude}&longitude=${longitude}&method=2`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Aladhan API error: ${response.status}`);
  }

  const data: AladhanResponse = await response.json();

  const times: PrayerTimes = {
    Fajr: data.data.timings.Fajr,
    Sunrise: data.data.timings.Sunrise,
    Dhuhr: data.data.timings.Dhuhr,
    Asr: data.data.timings.Asr,
    Maghrib: data.data.timings.Maghrib,
    Isha: data.data.timings.Isha,
  };

  const islamicDate: IslamicDate = {
    hijriDay: parseInt(data.data.date.hijri.day, 10),
    hijriMonth: data.data.date.hijri.month.en,
    hijriMonthNumber: data.data.date.hijri.month.number,
    hijriYear: parseInt(data.data.date.hijri.year, 10),
    formatted: `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} AH`,
  };

  // Cache the result
  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        times,
        islamicDate,
        cachedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Cache write error:", err);
  }

  return { times, islamicDate };
}
