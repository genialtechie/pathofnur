export type ServerConfig = {
  port: number
  allowedOrigin: string | null
  supabaseUrl: string | null
  supabaseServiceRoleKey: string | null
  openRouterApiKey: string | null
  openRouterModel: string
  openRouterBaseUrl: string
  embeddingProvider: "google" | "openai_compatible"
  embeddingApiKey: string | null
  embeddingModel: string
  embeddingBaseUrl: string | null
  embeddingDimensions: number
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
    embeddingProvider:
      readEnv("EMBEDDING_PROVIDER") === "openai_compatible"
        ? "openai_compatible"
        : "google",
    embeddingApiKey:
      readEnv("EMBEDDING_API_KEY") || readEnv("GOOGLE_GENERATIVE_AI_API_KEY"),
    embeddingModel:
      readEnv("EMBEDDING_MODEL") ||
      (readEnv("EMBEDDING_PROVIDER") === "openai_compatible"
        ? "text-embedding-3-small"
        : "text-embedding-004"),
    embeddingBaseUrl:
      readEnv("EMBEDDING_BASE_URL") ||
      (readEnv("EMBEDDING_PROVIDER") === "openai_compatible"
        ? "https://api.openai.com/v1"
        : "https://generativelanguage.googleapis.com/v1beta"),
    embeddingDimensions: Number(readEnv("EMBEDDING_DIMENSIONS") || "768"),
  }
}

export function requireServerSecret(
  key: keyof Pick<
    ServerConfig,
    | "supabaseUrl"
    | "supabaseServiceRoleKey"
    | "openRouterApiKey"
    | "embeddingApiKey"
  >
): string {
  const value = getServerConfig()[key]
  if (!value) {
    throw new Error(`${key} is required but not configured`)
  }
  return value
}
