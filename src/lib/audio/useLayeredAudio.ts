import { useCallback } from "react";

import { useExpoAudioPlayer, type TogglePlaybackResult } from "./useExpoAudioPlayer";
import { useAmbientPlayer, type AmbientType } from "./useAmbientPlayer";

export interface LayeredAudioState {
  quran: {
    activeTrackId: string | null;
    isPlaying: boolean;
    isBuffering: boolean;
    error: string | null;
  };
  ambient: {
    activeType: AmbientType;
    isPlaying: boolean;
    volume: number;
  };
}

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

  const toggleQuran = useCallback(
    async (trackId: string, url: string): Promise<TogglePlaybackResult> => {
      return togglePlayback(trackId, url);
    },
    [togglePlayback]
  );

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
