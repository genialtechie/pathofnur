import { useCallback, useEffect, useRef, useState } from "react";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackStatus,
} from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

// File-based logging for remote debugging
const LOG_KEY = "audio_debug_logs";
let debugLogs: string[] = [];

export async function addDebugLog(message: string): Promise<void> {
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${message}`;
  debugLogs.push(entry);
  if (debugLogs.length > 100) debugLogs.shift();
  try {
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(debugLogs));
  } catch (e) {}
  console.log(entry);
}

export async function getDebugLogs(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(LOG_KEY);
    if (stored) {
      debugLogs = JSON.parse(stored);
    }
  } catch (e) {}
  return debugLogs.join("\n");
}

export async function clearDebugLogs(): Promise<void> {
  debugLogs = [];
  try {
    await AsyncStorage.removeItem(LOG_KEY);
  } catch (e) {}
}

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

  const togglePlayback = useCallback(
    async (trackId: string, audioUrl: string): Promise<TogglePlaybackResult> => {
      // Debug logging disabled - uncomment below for troubleshooting
      // void addDebugLog(`togglePlayback called: ${trackId}`);
      try {
        await ensureAudioMode();

        const activeSound = soundRef.current;
        const isCurrentTrack = playbackState.activeTrackId === trackId;

        // If same track is loaded, toggle play/pause
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

        // Load new track
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }

        setPlaybackState({
          activeTrackId: trackId,
          isPlaying: false,
          isBuffering: true,
          error: null,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;
            setPlaybackState((previous) => ({
              ...previous,
              isPlaying: status.isPlaying,
              isBuffering: status.isBuffering,
              activeTrackId: status.didJustFinish ? null : previous.activeTrackId,
            }));
          }
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
        console.error("Audio playback error:", error);
        setPlaybackState((previous) => ({
          ...previous,
          isPlaying: false,
          isBuffering: false,
          error: "Playback unavailable. Please try another track.",
        }));
        return "error";
      }
    },
    [playbackState.activeTrackId]
  );

  const unload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlaybackState({
      activeTrackId: null,
      isPlaying: false,
      isBuffering: false,
      error: null,
    });
  }, []);

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
