import { useCallback, useEffect, useRef, useState } from "react";
import { Audio, type AVPlaybackStatus } from "expo-av";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AmbientType = "rain" | "medina_wind" | "silence";

interface AmbientPlayerState {
  activeType: AmbientType;
  isPlaying: boolean;
  volume: number;
}

const DEFAULT_VOLUME = 0.3;

/**
 * Asset map for bundled ambient loops.
 * Uses require() for native compatibility (bundler resolves asset).
 */
const AMBIENT_ASSETS: Record<Exclude<AmbientType, "silence">, any> = {
  rain: require("@/assets/audio/ambient/rain-loop.mp3"),
  medina_wind: require("@/assets/audio/ambient/medina-wind-loop.mp3"),
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAmbientPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<AmbientPlayerState>({
    activeType: "silence",
    isPlaying: false,
    volume: DEFAULT_VOLUME,
  });

  const handleStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setState((prev) => ({ ...prev, isPlaying: status.isPlaying }));
  }, []);

  const unload = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {
      // already unloaded
    }
    soundRef.current = null;
  }, []);

  const setAmbient = useCallback(
    async (type: AmbientType) => {
      // Stop current ambient
      await unload();

      if (type === "silence") {
        setState((prev) => ({ ...prev, activeType: "silence", isPlaying: false }));
        return;
      }

      const source = AMBIENT_ASSETS[type];
      if (!source) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          source,
          {
            shouldPlay: true,
            isLooping: true,
            volume: state.volume,
          },
          handleStatusUpdate,
        );

        soundRef.current = sound;
        setState((prev) => ({ ...prev, activeType: type, isPlaying: true }));
      } catch (error) {
        console.error("Ambient audio error:", error);
        setState((prev) => ({ ...prev, activeType: "silence", isPlaying: false }));
      }
    },
    [handleStatusUpdate, state.volume, unload],
  );

  const setVolume = useCallback(
    async (volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      setState((prev) => ({ ...prev, volume: clamped }));
      if (soundRef.current) {
        try {
          await soundRef.current.setVolumeAsync(clamped);
        } catch {
          // sound may have been unloaded
        }
      }
    },
    [],
  );

  const pause = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.pauseAsync();
    } catch {
      // already paused or unloaded
    }
  }, []);

  const play = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.playAsync();
    } catch {
      // sound may have been unloaded
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void unload();
    };
  }, [unload]);

  return {
    ambientState: state,
    setAmbient,
    setAmbientVolume: setVolume,
    pauseAmbient: pause,
    playAmbient: play,
    unloadAmbient: unload,
  };
}
