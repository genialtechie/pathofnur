import { useEffect, useState } from "react";
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackStatus,
} from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOG_KEY = "audio_debug_logs";
let debugLogs: string[] = [];

export async function addDebugLog(message: string): Promise<void> {
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${message}`;
  debugLogs.push(entry);
  if (debugLogs.length > 100) debugLogs.shift();
  try {
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(debugLogs));
  } catch {}
  console.log(entry);
}

export async function getDebugLogs(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(LOG_KEY);
    if (stored) {
      debugLogs = JSON.parse(stored);
    }
  } catch {}
  return debugLogs.join("\n");
}

export async function clearDebugLogs(): Promise<void> {
  debugLogs = [];
  try {
    await AsyncStorage.removeItem(LOG_KEY);
  } catch {}
}

export interface AudioPlaybackState {
  activeTrackId: string | null;
  isPlaying: boolean;
  isBuffering: boolean;
  error: string | null;
}

export type TogglePlaybackResult = "playing" | "paused" | "error";

type AudioListener = (state: AudioPlaybackState) => void;

let isAudioModeReady = false;
let quranSound: Audio.Sound | null = null;
let quranStateSnapshot: AudioPlaybackState = {
  activeTrackId: null,
  isPlaying: false,
  isBuffering: false,
  error: null,
};
let quranOperation: Promise<void> = Promise.resolve();
let quranCommandId = 0;

const audioListeners = new Set<AudioListener>();

function emitQuranState() {
  for (const listener of audioListeners) {
    listener(quranStateSnapshot);
  }
}

function setQuranStateSnapshot(
  next:
    | AudioPlaybackState
    | ((previous: AudioPlaybackState) => AudioPlaybackState),
) {
  quranStateSnapshot =
    typeof next === "function" ? next(quranStateSnapshot) : next;
  emitQuranState();
}

function subscribeQuranState(listener: AudioListener) {
  audioListeners.add(listener);
  listener(quranStateSnapshot);

  return () => {
    audioListeners.delete(listener);
  };
}

function enqueueQuranOperation<T>(operation: () => Promise<T>): Promise<T> {
  const run = quranOperation.catch(() => undefined).then(operation);
  quranOperation = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

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

async function disposeQuranSound(sound: Audio.Sound | null) {
  if (!sound) return;

  sound.setOnPlaybackStatusUpdate(null);

  try {
    await sound.stopAsync();
  } catch {
    // already stopped
  }

  try {
    await sound.unloadAsync();
  } catch {
    // already unloaded
  }
}

function handleQuranStatusUpdate(status: AVPlaybackStatus) {
  if (!status.isLoaded) return;

  setQuranStateSnapshot((previous) => ({
    ...previous,
    isPlaying: status.isPlaying,
    isBuffering: status.isBuffering,
    activeTrackId: status.didJustFinish ? null : previous.activeTrackId,
  }));
}

async function togglePlaybackShared(
  trackId: string,
  audioUrl: string,
): Promise<TogglePlaybackResult> {
  return enqueueQuranOperation(async () => {
    try {
      await ensureAudioMode();

      const currentSound = quranSound;
      const isCurrentTrack = quranStateSnapshot.activeTrackId === trackId;

      if (currentSound && isCurrentTrack) {
        const status = await currentSound.getStatusAsync();
        if (!status.isLoaded) {
          return "error";
        }

        if (status.isPlaying) {
          await currentSound.pauseAsync();
          setQuranStateSnapshot((previous) => ({
            ...previous,
            isPlaying: false,
            isBuffering: false,
            error: null,
          }));
          return "paused";
        }

        await currentSound.playAsync();
        setQuranStateSnapshot((previous) => ({
          ...previous,
          isPlaying: true,
          isBuffering: false,
          error: null,
        }));
        return "playing";
      }

      const commandId = ++quranCommandId;
      const previousSound = quranSound;
      quranSound = null;

      await disposeQuranSound(previousSound);

      if (commandId !== quranCommandId) {
        return "error";
      }

      setQuranStateSnapshot({
        activeTrackId: trackId,
        isPlaying: false,
        isBuffering: true,
        error: null,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        handleQuranStatusUpdate,
      );

      if (commandId !== quranCommandId) {
        await disposeQuranSound(sound);
        return "error";
      }

      quranSound = sound;
      setQuranStateSnapshot({
        activeTrackId: trackId,
        isPlaying: true,
        isBuffering: false,
        error: null,
      });

      return "playing";
    } catch (error) {
      console.error("Audio playback error:", error);
      setQuranStateSnapshot((previous) => ({
        ...previous,
        isPlaying: false,
        isBuffering: false,
        error: "Playback unavailable. Please try another track.",
      }));
      return "error";
    }
  });
}

async function unloadShared() {
  const commandId = ++quranCommandId;

  return enqueueQuranOperation(async () => {
    const previousSound = quranSound;
    quranSound = null;

    await disposeQuranSound(previousSound);

    if (commandId !== quranCommandId) {
      return;
    }

    setQuranStateSnapshot({
      activeTrackId: null,
      isPlaying: false,
      isBuffering: false,
      error: null,
    });
  });
}

export function useExpoAudioPlayer() {
  const [playbackState, setPlaybackState] = useState(quranStateSnapshot);

  useEffect(() => subscribeQuranState(setPlaybackState), []);

  return {
    playbackState,
    togglePlayback: togglePlaybackShared,
    unload: unloadShared,
  };
}
