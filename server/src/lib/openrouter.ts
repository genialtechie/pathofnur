import { getServerConfig, requireServerSecret } from "../config.js"

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type OpenRouterChatRequest = {
  messages: OpenRouterMessage[]
  temperature?: number
}

export async function createOpenRouterChatCompletion(
  request: OpenRouterChatRequest
): Promise<unknown> {
  const config = getServerConfig()
  const apiKey = requireServerSecret("openRouterApiKey")

  const response = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.openRouterModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`OpenRouter request failed (${response.status}): ${body}`)
  }

  return response.json()
}
