import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Surah, TranslationResponse, SurahAudioResponse } from "./types";

const API_BASE = "https://api.alquran.cloud/v1";

const TRANSLATION_EDITION = "en.sahih";
const ARABIC_EDITION = "ar.uthmani";

function getCacheKey(type: string, surah: number): string {
  return `quran_${type}_v2_${surah}`;
}

export async function fetchSurah(surahNumber: number): Promise<Surah> {
  const cacheKey = getCacheKey("arabic", surahNumber);

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const cacheTime = new Date(parsed.cachedAt);
      const hoursSinceCache = (Date.now() - cacheTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCache < 24 * 7) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }

  const url = `${API_BASE}/surah/${surahNumber}/${ARABIC_EDITION}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Quran API error: ${response.status}`);
  }

  const data: TranslationResponse = await response.json();

  const surah: Surah = {
    number: data.data.number,
    name: data.data.name,
    englishName: data.data.englishName,
    englishNameTranslation: data.data.englishNameTranslation,
    revelationType: data.data.revelationType,
    verses: data.data.ayahs.map((v) => ({
      number: v.number,
      text: v.text,
    })),
  };

  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ data: surah, cachedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.error("Cache write error:", err);
  }

  return surah;
}

export async function fetchTranslation(surahNumber: number): Promise<{ verses: { number: number; text: string }[] }> {
  const cacheKey = getCacheKey("translation", surahNumber);

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const cacheTime = new Date(parsed.cachedAt);
      const hoursSinceCache = (Date.now() - cacheTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCache < 24 * 7) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }

  const url = `${API_BASE}/surah/${surahNumber}/${TRANSLATION_EDITION}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Quran API error: ${response.status}`);
  }

  const data: TranslationResponse = await response.json();

  const translation = {
    verses: data.data.ayahs.map((v: { number: number; text: string }) => ({
      number: v.number,
      text: v.text,
    })),
  };

  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ data: translation, cachedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.error("Cache write error:", err);
  }

  return translation;
}

const CDN_BASE = "https://cdn.islamic.network/quran/audio-surah";
const AUDIO_BITRATE = "128";
const AUDIO_RECITER = "ar.abdulbasitmurattal";

export async function fetchSurahAudio(surahNumber: number): Promise<string> {
  // Use v3 cache key to invalidate old array-format cached data
  const cacheKey = `quran_audio_v3_${surahNumber}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.data;
    }
  } catch (err) {
    console.error("Cache read error:", err);
  }

  // Use CDN for full surah audio - much more reliable than ayah-by-ayah
  const audioUrl = `${CDN_BASE}/${AUDIO_BITRATE}/${AUDIO_RECITER}/${surahNumber}.mp3`;

  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ data: audioUrl, cachedAt: new Date().toISOString() })
    );
  } catch (err) {
    console.error("Cache write error:", err);
  }

  return audioUrl;
}
