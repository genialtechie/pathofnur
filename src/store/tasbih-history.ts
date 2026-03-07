import AsyncStorage from "@react-native-async-storage/async-storage";

export const TASBIH_HISTORY_KEY = "@pathofnur/tasbih_history_v1";
export const TASBIH_STATE_KEY = "@pathofnur/tasbih_state_v2";
export const LEGACY_TASBIH_KEY = "tasbih_count";
export const TASBIH_LOOP_LENGTH = 33;

export type TasbihHistoryState = {
  activeCount: number;
  lifetimeCount: number;
  dailyCounts: Record<string, number>;
  lastUpdatedDate: string | null;
};

export type TasbihHistorySnapshot = TasbihHistoryState & {
  todayKey: string;
  yesterdayKey: string;
  todayCount: number;
  yesterdayCount: number;
  activeLoopProgress: number;
  activeCompletedLoops: number;
  lifetimeCompletedLoops: number;
};

export const EMPTY_TASBIH_HISTORY_STATE: TasbihHistoryState = {
  activeCount: 0,
  lifetimeCount: 0,
  dailyCounts: {},
  lastUpdatedDate: null,
};

function normalizeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function normalizeDailyCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((accumulator, [key, rawValue]) => {
    const normalizedValue = normalizeCount(rawValue);
    if (normalizedValue > 0) {
      accumulator[key] = normalizedValue;
    }
    return accumulator;
  }, {});
}

function sanitizeState(value: unknown): TasbihHistoryState {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_TASBIH_HISTORY_STATE };
  }

  const candidate = value as Partial<TasbihHistoryState>;

  return {
    activeCount: normalizeCount(candidate.activeCount),
    lifetimeCount: normalizeCount(candidate.lifetimeCount),
    dailyCounts: normalizeDailyCounts(candidate.dailyCounts),
    lastUpdatedDate: typeof candidate.lastUpdatedDate === "string" ? candidate.lastUpdatedDate : null,
  };
}

export function getTasbihDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousDateKey(date = new Date()): string {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  return getTasbihDateKey(previousDate);
}

function createMigratedState(legacyCount: number, date = new Date()): TasbihHistoryState {
  if (legacyCount <= 0) {
    return { ...EMPTY_TASBIH_HISTORY_STATE };
  }

  const todayKey = getTasbihDateKey(date);

  return {
    activeCount: legacyCount,
    lifetimeCount: legacyCount,
    dailyCounts: {
      [todayKey]: legacyCount,
    },
    lastUpdatedDate: todayKey,
  };
}

export async function persistTasbihHistoryState(state: TasbihHistoryState): Promise<void> {
  await AsyncStorage.setItem(TASBIH_HISTORY_KEY, JSON.stringify(state));
}

export async function loadTasbihHistoryState(date = new Date()): Promise<TasbihHistoryState> {
  try {
    const storedHistory = await AsyncStorage.getItem(TASBIH_HISTORY_KEY);
    if (storedHistory) {
      return sanitizeState(JSON.parse(storedHistory));
    }

    const storedState = await AsyncStorage.getItem(TASBIH_STATE_KEY);
    if (storedState) {
      const parsedState = JSON.parse(storedState) as { count?: unknown };
      const migratedFromState = createMigratedState(normalizeCount(parsedState.count), date);
      await persistTasbihHistoryState(migratedFromState);
      return migratedFromState;
    }

    const legacyCount = await AsyncStorage.getItem(LEGACY_TASBIH_KEY);
    const migratedFromLegacy = createMigratedState(
      legacyCount ? Number.parseInt(legacyCount, 10) : 0,
      date
    );
    await persistTasbihHistoryState(migratedFromLegacy);
    return migratedFromLegacy;
  } catch {
    return { ...EMPTY_TASBIH_HISTORY_STATE };
  }
}

export function createEmptyTasbihHistoryState(): TasbihHistoryState {
  return { ...EMPTY_TASBIH_HISTORY_STATE };
}

export function createIncrementedTasbihHistoryState(
  state: TasbihHistoryState,
  date = new Date()
): TasbihHistoryState {
  const todayKey = getTasbihDateKey(date);

  return {
    activeCount: state.activeCount + 1,
    lifetimeCount: state.lifetimeCount + 1,
    dailyCounts: {
      ...state.dailyCounts,
      [todayKey]: (state.dailyCounts[todayKey] ?? 0) + 1,
    },
    lastUpdatedDate: todayKey,
  };
}

export function createResetTasbihHistoryState(
  state: TasbihHistoryState,
  date = new Date()
): TasbihHistoryState {
  return {
    ...state,
    activeCount: 0,
    lastUpdatedDate: getTasbihDateKey(date),
  };
}

export function getTasbihHistorySnapshot(
  state: TasbihHistoryState,
  date = new Date()
): TasbihHistorySnapshot {
  const todayKey = getTasbihDateKey(date);
  const yesterdayKey = getPreviousDateKey(date);
  const todayCount = state.dailyCounts[todayKey] ?? 0;
  const yesterdayCount = state.dailyCounts[yesterdayKey] ?? 0;

  return {
    ...state,
    todayKey,
    yesterdayKey,
    todayCount,
    yesterdayCount,
    activeLoopProgress: state.activeCount === 0 ? 0 : ((state.activeCount - 1) % TASBIH_LOOP_LENGTH) + 1,
    activeCompletedLoops: Math.floor(state.activeCount / TASBIH_LOOP_LENGTH),
    lifetimeCompletedLoops: Math.floor(state.lifetimeCount / TASBIH_LOOP_LENGTH),
  };
}
