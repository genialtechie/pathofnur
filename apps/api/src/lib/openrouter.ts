import { getServerConfig, requireServerSecret } from "../config.js"
import { z } from "zod"

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type OpenRouterChatRequest = {
  messages: OpenRouterMessage[]
  temperature?: number
}

const OpenRouterResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.union([
            z.string(),
            z.array(
              z.object({
                type: z.string().optional(),
                text: z.string().optional(),
              })
            ),
          ]),
        }),
      })
    )
    .min(1),
})

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

export function extractJsonObject(text: string): string {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1)
  }

  return text
}

export function getOpenRouterCompletionText(payload: unknown): string {
  const parsed = OpenRouterResponseSchema.parse(payload)
  const content = parsed.choices[0]?.message.content

  if (typeof content === "string") {
    return content
  }

  return content
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join("\n")
}
