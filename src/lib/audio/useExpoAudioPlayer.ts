import { useCallback, useEffect, useRef, useState } from "react";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackStatus,
} from "expo-av";

export interface AudioPlaybackState {
  activeTrackId: string | null;
  isPlaying: boolean;
  isBuffering: boolean;
  error: string | null;
}

export type TogglePlaybackResult = "playing" | "paused" | "error";

let isAudioModeReady = false;

async function ensureAudioMode() {
  if (isAudioModeReady) return;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  });

  isAudioModeReady = true;
}

export function useExpoAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    activeTrackId: null,
    isPlaying: false,
    isBuffering: false,
    error: null,
  });

  const handleStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }

    setPlaybackState((previous) => ({
      ...previous,
      isPlaying: status.isPlaying,
      isBuffering: status.isBuffering,
      activeTrackId: status.didJustFinish ? null : previous.activeTrackId,
    }));
  }, []);

  const unload = useCallback(async () => {
    if (!soundRef.current) return;

    await soundRef.current.unloadAsync();
    soundRef.current = null;
  }, []);

  const togglePlayback = useCallback(
    async (trackId: string, audioUrl: string): Promise<TogglePlaybackResult> => {
      try {
        await ensureAudioMode();

        const activeSound = soundRef.current;
        const isCurrentTrack = playbackState.activeTrackId === trackId;

        if (activeSound && isCurrentTrack) {
          const status = await activeSound.getStatusAsync();
          if (!status.isLoaded) {
            return "error";
          }

          if (status.isPlaying) {
            await activeSound.pauseAsync();
            setPlaybackState((previous) => ({
              ...previous,
              isPlaying: false,
              isBuffering: false,
              error: null,
            }));
            return "paused";
          }

          await activeSound.playAsync();
          setPlaybackState((previous) => ({
            ...previous,
            isPlaying: true,
            isBuffering: false,
            error: null,
          }));
          return "playing";
        }

        await unload();

        setPlaybackState({
          activeTrackId: trackId,
          isPlaying: false,
          isBuffering: true,
          error: null,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 250 },
          handleStatusUpdate
        );

        soundRef.current = sound;

        setPlaybackState({
          activeTrackId: trackId,
          isPlaying: true,
          isBuffering: false,
          error: null,
        });

        return "playing";
      } catch (error) {
        console.error("Audio playback error", error);
        setPlaybackState((previous) => ({
          ...previous,
          isPlaying: false,
          isBuffering: false,
          error: "Playback unavailable. Please try another track.",
        }));
        return "error";
      }
    },
    [handleStatusUpdate, playbackState.activeTrackId, unload]
  );

  useEffect(() => {
    return () => {
      void unload();
    };
  }, [unload]);

  return {
    playbackState,
    togglePlayback,
    unload,
  };
}
