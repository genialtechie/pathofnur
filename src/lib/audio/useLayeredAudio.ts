import { useCallback } from "react";

import { useExpoAudioPlayer, type TogglePlaybackResult } from "./useExpoAudioPlayer";
import { useAmbientPlayer, type AmbientType } from "./useAmbientPlayer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LayeredAudioState {
  /** Quran / recitation playback state */
  quran: {
    activeTrackId: string | null;
    isPlaying: boolean;
    isBuffering: boolean;
    error: string | null;
  };
  /** Ambient loop state */
  ambient: {
    activeType: AmbientType;
    isPlaying: boolean;
    volume: number;
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Combines the Quran recitation player and ambient loop player into
 * a single coordinated API so both layers can play simultaneously.
 */
export function useLayeredAudio() {
  const { playbackState, togglePlayback, unload: unloadQuran } = useExpoAudioPlayer();
  const {
    ambientState,
    setAmbient,
    setAmbientVolume,
    pauseAmbient,
    playAmbient,
    unloadAmbient,
  } = useAmbientPlayer();

  /** Toggle Quran recitation track (delegates to useExpoAudioPlayer) */
  const toggleQuran = useCallback(
    async (trackId: string, url: string): Promise<TogglePlaybackResult> => {
      return togglePlayback(trackId, url);
    },
    [togglePlayback],
  );

  /** Combined state for consumers */
  const state: LayeredAudioState = {
    quran: playbackState,
    ambient: ambientState,
  };

  return {
    state,
    toggleQuran,
    setAmbient,
    setAmbientVolume,
    pauseAmbient,
    playAmbient,
    unloadQuran,
    unloadAmbient,
  };
}
