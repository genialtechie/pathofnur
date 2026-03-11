import { useState, useEffect, useCallback } from "react";
import { fetchSurah, fetchTranslation, fetchSurahAudio } from "./api-client";
import type { Surah } from "./types";

export interface DailyRecommendation {
  surah: Surah | null;
  translation: { verses: { number: number; text: string }[] } | null;
  audioUrl: string | null;
  surahNumber: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getSurahForDay(dayOfYear: number): number {
  return (dayOfYear % 114) + 1;
}

export function useDailyRecommendation(date?: Date): DailyRecommendation {
  const targetDate = date || new Date();
  const dayOfYear = getDayOfYear(targetDate);
  const surahNumber = getSurahForDay(dayOfYear);

  const [surah, setSurah] = useState<Surah | null>(null);
  const [translation, setTranslation] = useState<{ verses: { number: number; text: string }[] } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSurah = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [arabicData, translationData, audio] = await Promise.all([
        fetchSurah(surahNumber),
        fetchTranslation(surahNumber),
        fetchSurahAudio(surahNumber),
      ]);

      setSurah(arabicData);
      setTranslation(translationData);
      setAudioUrl(audio);
    } catch (err) {
      console.error("Failed to load surah:", err);
      setError(err instanceof Error ? err.message : "Failed to load surah");
    } finally {
      setIsLoading(false);
    }
  }, [surahNumber]);

  useEffect(() => {
    loadSurah();
  }, [loadSurah]);

  return {
    surah,
    translation,
    audioUrl,
    surahNumber,
    isLoading,
    error,
    refresh: loadSurah,
  };
}
