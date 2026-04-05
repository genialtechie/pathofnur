import AsyncStorage from "@react-native-async-storage/async-storage"

import type { AuthSessionSnapshot } from "@/src/lib/auth/types"
import { getBackendPublicConfig } from "@/src/lib/backend/config"

const SESSION_STORAGE_KEY = "@imaan/auth/session-snapshot"

export type AuthenticatedBackendActor = {
  kind: "session" | "development"
  userId: string
  accessToken: string
}

function getDevelopmentBackendActor(): AuthenticatedBackendActor | null {
  const config = getBackendPublicConfig()
  if (!config.useDevelopmentBearerToken) {
    return null
  }

  if (!config.developmentBearerToken || !config.developmentActorUserId) {
    throw new Error(
      "EXPO_PUBLIC_IMAAN_USE_DEV_BEARER_TOKEN=1 requires EXPO_PUBLIC_IMAAN_DEV_BEARER_TOKEN and EXPO_PUBLIC_IMAAN_DEV_ACTOR_ID."
    )
  }

  return {
    kind: "development",
    userId: config.developmentActorUserId,
    accessToken: config.developmentBearerToken,
  }
}

export async function getSessionSnapshot(): Promise<AuthSessionSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSessionSnapshot
  } catch {
    return null
  }
}

export async function setSessionSnapshot(
  snapshot: AuthSessionSnapshot
): Promise<void> {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot))
}

export async function clearSessionSnapshot(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY)
}

export async function getAuthenticatedBackendActor(): Promise<AuthenticatedBackendActor | null> {
  const snapshot = await getSessionSnapshot()
  if (!snapshot?.accessToken || !snapshot.profile.id) {
    return getDevelopmentBackendActor()
  }

  return {
    kind: "session",
    userId: snapshot.profile.id,
    accessToken: snapshot.accessToken,
  }
}
