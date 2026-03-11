import AsyncStorage from "@react-native-async-storage/async-storage"

import type { AuthSessionSnapshot } from "@/src/lib/auth/types"

const SESSION_STORAGE_KEY = "@imaan/auth/session-snapshot"

export type AuthenticatedBackendActor = {
  userId: string
  accessToken: string
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
    return null
  }

  return {
    userId: snapshot.profile.id,
    accessToken: snapshot.accessToken,
  }
}
