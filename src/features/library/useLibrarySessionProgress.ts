import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LibrarySessionProgress {
  scrollProgress: number;
  topVerseNumber: number | null;
  audioPositionMs: number;
  lastUpdatedAt: string | null;
}

const EMPTY_PROGRESS: LibrarySessionProgress = {
  scrollProgress: 0,
  topVerseNumber: null,
  audioPositionMs: 0,
  lastUpdatedAt: null,
};

function getStorageKey(sessionKey: string) {
  return `pon_library_progress_v1_${sessionKey}`;
}

export function createLibrarySessionKey(date: Date, surahNumber: number) {
  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  return `${dateKey}_${surahNumber}`;
}

export function useLibrarySessionProgress(sessionKey: string | null) {
  const [progress, setProgress] = useState<LibrarySessionProgress>(EMPTY_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);
  const progressRef = useRef(EMPTY_PROGRESS);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<LibrarySessionProgress | null>(null);

  const storageKey = useMemo(
    () => (sessionKey ? getStorageKey(sessionKey) : null),
    [sessionKey],
  );

  useEffect(() => {
    progressRef.current = EMPTY_PROGRESS;
    setProgress(EMPTY_PROGRESS);
    setIsLoaded(false);

    if (!storageKey) {
      setIsLoaded(true);
      return;
    }

    let isMounted = true;

    async function loadProgress() {
      const currentStorageKey = storageKey;
      if (!currentStorageKey) return;

      try {
        const stored = await AsyncStorage.getItem(currentStorageKey);
        if (!stored) {
          if (isMounted) {
            setProgress(EMPTY_PROGRESS);
          }
          return;
        }

        const parsed = JSON.parse(stored) as Partial<LibrarySessionProgress>;
        const nextProgress: LibrarySessionProgress = {
          scrollProgress: parsed.scrollProgress ?? 0,
          topVerseNumber: parsed.topVerseNumber ?? null,
          audioPositionMs: parsed.audioPositionMs ?? 0,
          lastUpdatedAt: parsed.lastUpdatedAt ?? null,
        };

        if (isMounted) {
          progressRef.current = nextProgress;
          setProgress(nextProgress);
        }
      } catch (error) {
        console.error("Failed to load library session progress:", error);
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    }

    void loadProgress();

    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      if (storageKey && pendingSaveRef.current) {
        void AsyncStorage.setItem(
          storageKey,
          JSON.stringify(pendingSaveRef.current),
        ).catch((error) => {
          console.error("Failed to flush library session progress:", error);
        });
        pendingSaveRef.current = null;
      }
    };
  }, [storageKey]);

  const queueSave = useCallback(
    (updates: Partial<LibrarySessionProgress>) => {
      if (!storageKey) return;

      const nextProgress: LibrarySessionProgress = {
        ...progressRef.current,
        ...updates,
        lastUpdatedAt: new Date().toISOString(),
      };

      progressRef.current = nextProgress;
      pendingSaveRef.current = nextProgress;
      setProgress(nextProgress);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const currentStorageKey = storageKey;
        if (!currentStorageKey) return;

        void AsyncStorage.setItem(currentStorageKey, JSON.stringify(nextProgress)).catch(
          (error) => {
            console.error("Failed to save library session progress:", error);
          },
        );
        pendingSaveRef.current = null;
        saveTimeoutRef.current = null;
      }, 250);
    },
    [storageKey],
  );

  return {
    progress,
    isLoaded,
    queueSave,
  };
}
