export type BackendPublicConfig = {
  apiBaseUrl: string | null
  supabaseUrl: string | null
  supabaseAnonKey: string | null
}

function normalizeUrl(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.replace(/\/+$/, "")
}

export function getBackendPublicConfig(): BackendPublicConfig {
  return {
    apiBaseUrl: normalizeUrl(process.env.EXPO_PUBLIC_IMAAN_API_BASE_URL),
    supabaseUrl: normalizeUrl(process.env.EXPO_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || null,
  }
}

export function getRequiredApiBaseUrl(): string {
  const { apiBaseUrl } = getBackendPublicConfig()
  if (!apiBaseUrl) {
    throw new Error(
      "EXPO_PUBLIC_IMAAN_API_BASE_URL is not configured. Point the app at the Azure backend."
    )
  }
  return apiBaseUrl
}
