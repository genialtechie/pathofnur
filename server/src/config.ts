export type ServerConfig = {
  port: number
  allowedOrigin: string | null
  supabaseUrl: string | null
  supabaseServiceRoleKey: string | null
  openRouterApiKey: string | null
  openRouterModel: string
  openRouterBaseUrl: string
}

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value ? value : null
}

export function getServerConfig(): ServerConfig {
  const portValue = Number(process.env.PORT || 3001)

  return {
    port: Number.isFinite(portValue) ? portValue : 3001,
    allowedOrigin: readEnv("ALLOWED_ORIGIN"),
    supabaseUrl: readEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    openRouterApiKey: readEnv("OPENROUTER_API_KEY"),
    openRouterModel:
      readEnv("OPENROUTER_MODEL") || "openai/gpt-4.1-mini",
    openRouterBaseUrl:
      readEnv("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1",
  }
}

export function requireServerSecret(
  key: keyof Pick<
    ServerConfig,
    "supabaseUrl" | "supabaseServiceRoleKey" | "openRouterApiKey"
  >
): string {
  const value = getServerConfig()[key]
  if (!value) {
    throw new Error(`${key} is required but not configured`)
  }
  return value
}
