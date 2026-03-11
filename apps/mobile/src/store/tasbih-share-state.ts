import AsyncStorage from "@react-native-async-storage/async-storage";

export const TASBIH_SHARE_STATE_KEY = "@pathofnur/tasbih_share_state_v1";

export type TasbihShareState = {
  handledMilestones: string[];
};

const EMPTY_TASBIH_SHARE_STATE: TasbihShareState = {
  handledMilestones: [],
};

function sanitizeState(value: unknown): TasbihShareState {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_TASBIH_SHARE_STATE };
  }

  const candidate = value as Partial<TasbihShareState>;
  const handledMilestones = Array.isArray(candidate.handledMilestones)
    ? candidate.handledMilestones.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];

  return {
    handledMilestones: Array.from(new Set(handledMilestones)),
  };
}

export function createEmptyTasbihShareState(): TasbihShareState {
  return { ...EMPTY_TASBIH_SHARE_STATE };
}

export async function loadTasbihShareState(): Promise<TasbihShareState> {
  try {
    const stored = await AsyncStorage.getItem(TASBIH_SHARE_STATE_KEY);
    if (!stored) {
      return { ...EMPTY_TASBIH_SHARE_STATE };
    }

    return sanitizeState(JSON.parse(stored));
  } catch {
    return { ...EMPTY_TASBIH_SHARE_STATE };
  }
}

export async function persistTasbihShareState(state: TasbihShareState): Promise<void> {
  await AsyncStorage.setItem(TASBIH_SHARE_STATE_KEY, JSON.stringify(state));
}

export function hasHandledTasbihShare(state: TasbihShareState, milestoneKey: string): boolean {
  return state.handledMilestones.includes(milestoneKey);
}

export function markTasbihShareHandled(
  state: TasbihShareState,
  milestoneKey: string
): TasbihShareState {
  if (!milestoneKey || state.handledMilestones.includes(milestoneKey)) {
    return state;
  }

  return {
    handledMilestones: [...state.handledMilestones, milestoneKey],
  };
}
