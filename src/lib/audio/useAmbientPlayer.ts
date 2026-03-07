import { useEffect, useState } from "react";
import { Audio, type AVPlaybackStatus } from "expo-av";

export type AmbientType = "rain" | "medina_wind" | "silence";

interface AmbientPlayerState {
  activeType: AmbientType;
  isPlaying: boolean;
  volume: number;
}

const DEFAULT_VOLUME = 0.3;

const AMBIENT_ASSETS: Record<Exclude<AmbientType, "silence">, number> = {
  rain: require("@/assets/audio/ambient/rain-loop.mp3"),
  medina_wind: require("@/assets/audio/ambient/medina-wind-loop.mp3"),
};

type AmbientListener = (state: AmbientPlayerState) => void;

let ambientSound: Audio.Sound | null = null;
let ambientStateSnapshot: AmbientPlayerState = {
  activeType: "silence",
  isPlaying: false,
  volume: DEFAULT_VOLUME,
};
let ambientOperation: Promise<void> = Promise.resolve();
let ambientCommandId = 0;

const ambientListeners = new Set<AmbientListener>();

function emitAmbientState() {
  for (const listener of ambientListeners) {
    listener(ambientStateSnapshot);
  }
}

function setAmbientStateSnapshot(
  next:
    | AmbientPlayerState
    | ((previous: AmbientPlayerState) => AmbientPlayerState),
) {
  ambientStateSnapshot =
    typeof next === "function" ? next(ambientStateSnapshot) : next;
  emitAmbientState();
}

function subscribeAmbientState(listener: AmbientListener) {
  ambientListeners.add(listener);
  listener(ambientStateSnapshot);

  return () => {
    ambientListeners.delete(listener);
  };
}

function enqueueAmbientOperation<T>(operation: () => Promise<T>): Promise<T> {
  const run = ambientOperation.catch(() => undefined).then(operation);
  ambientOperation = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function disposeAmbientSound(sound: Audio.Sound | null) {
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

function handleAmbientStatusUpdate(status: AVPlaybackStatus) {
  if (!status.isLoaded) return;

  setAmbientStateSnapshot((previous) => ({
    ...previous,
    isPlaying: status.isPlaying,
  }));
}

async function setAmbientShared(type: AmbientType) {
  const commandId = ++ambientCommandId;

  return enqueueAmbientOperation(async () => {
    const previousSound = ambientSound;
    ambientSound = null;

    await disposeAmbientSound(previousSound);

    if (commandId !== ambientCommandId) {
      return;
    }

    if (type === "silence") {
      setAmbientStateSnapshot((previous) => ({
        ...previous,
        activeType: "silence",
        isPlaying: false,
      }));
      return;
    }

    setAmbientStateSnapshot((previous) => ({
      ...previous,
      activeType: type,
      isPlaying: false,
    }));

    const source = AMBIENT_ASSETS[type];
    const { sound } = await Audio.Sound.createAsync(
      source,
      {
        shouldPlay: true,
        isLooping: true,
        volume: ambientStateSnapshot.volume,
      },
      handleAmbientStatusUpdate,
    );

    if (commandId !== ambientCommandId) {
      await disposeAmbientSound(sound);
      return;
    }

    ambientSound = sound;
    setAmbientStateSnapshot((previous) => ({
      ...previous,
      activeType: type,
      isPlaying: true,
    }));
  });
}

async function setAmbientVolumeShared(volume: number) {
  const clamped = Math.max(0, Math.min(1, volume));

  setAmbientStateSnapshot((previous) => ({
    ...previous,
    volume: clamped,
  }));

  return enqueueAmbientOperation(async () => {
    if (!ambientSound) return;
    await ambientSound.setVolumeAsync(clamped);
  });
}

async function pauseAmbientShared() {
  return enqueueAmbientOperation(async () => {
    if (!ambientSound) return;
    await ambientSound.pauseAsync();
  });
}

async function playAmbientShared() {
  return enqueueAmbientOperation(async () => {
    if (!ambientSound) return;
    await ambientSound.playAsync();
  });
}

async function unloadAmbientShared() {
  const commandId = ++ambientCommandId;

  return enqueueAmbientOperation(async () => {
    const previousSound = ambientSound;
    ambientSound = null;

    await disposeAmbientSound(previousSound);

    if (commandId !== ambientCommandId) {
      return;
    }

    setAmbientStateSnapshot((previous) => ({
      ...previous,
      activeType: "silence",
      isPlaying: false,
    }));
  });
}

export function useAmbientPlayer() {
  const [ambientState, setAmbientState] = useState(ambientStateSnapshot);

  useEffect(() => subscribeAmbientState(setAmbientState), []);

  return {
    ambientState,
    setAmbient: setAmbientShared,
    setAmbientVolume: setAmbientVolumeShared,
    pauseAmbient: pauseAmbientShared,
    playAmbient: playAmbientShared,
    unloadAmbient: unloadAmbientShared,
  };
}
