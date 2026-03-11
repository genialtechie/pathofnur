import { loadLocalEnv } from "./lib/env.js"

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

loadLocalEnv()

function readEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }

  return null
}

export function getServerConfig(): ServerConfig {
  const portValue = Number(process.env.PORT || 3001)
  const embeddingProvider =
    readEnv("EMBEDDING_PROVIDER") === "google"
      ? "google"
      : "openai_compatible"

  return {
    port: Number.isFinite(portValue) ? portValue : 3001,
    allowedOrigin: readEnv("ALLOWED_ORIGIN"),
    supabaseUrl: readEnv("SUPABASE_URL", "SUPABASE_PROJECT_URL"),
    supabaseServiceRoleKey: readEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SECRET_KEY"
    ),
    openRouterApiKey: readEnv("OPENROUTER_API_KEY"),
    openRouterModel:
      readEnv("OPENROUTER_MODEL") || "openai/gpt-4.1-mini",
    openRouterBaseUrl:
      readEnv("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1",
    embeddingProvider,
    embeddingApiKey:
      embeddingProvider === "openai_compatible"
        ? readEnv("EMBEDDING_API_KEY", "OPENROUTER_API_KEY")
        : readEnv(
            "EMBEDDING_API_KEY",
            "GOOGLE_GENERATIVE_AI_API_KEY",
            "GOOGLE_API_KEY"
          ),
    embeddingModel:
      readEnv("EMBEDDING_MODEL") ||
      (embeddingProvider === "openai_compatible"
        ? "text-embedding-3-small"
        : "gemini-embedding-001"),
    embeddingBaseUrl:
      readEnv("EMBEDDING_BASE_URL") ||
      (embeddingProvider === "openai_compatible"
        ? readEnv("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1"
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
