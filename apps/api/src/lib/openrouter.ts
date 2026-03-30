import { getServerConfig } from "../config.js"
import { z } from "zod"

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

type OpenRouterJsonSchema = Record<string, unknown>

type OpenRouterResponseFormat = {
  type: "json_schema"
  json_schema: {
    name: string
    description?: string
    schema: OpenRouterJsonSchema
    strict?: boolean
  }
}

type OpenRouterPlugin = {
  id: "response-healing"
  enabled?: boolean
}

type OpenRouterProviderPreferences = {
  require_parameters?: boolean
}

export type OpenRouterStructuredOutputRequest<TSchema extends z.ZodTypeAny> = {
  messages: OpenRouterMessage[]
  outputSchema: TSchema
  responseFormat: OpenRouterResponseFormat["json_schema"]
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

export class OpenRouterConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenRouterConfigurationError"
  }
}

export class OpenRouterUpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: string
  ) {
    super(message)
    this.name = "OpenRouterUpstreamError"
  }
}

export class OpenRouterStructuredOutputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpenRouterStructuredOutputError"
  }
}

function getOpenRouterCompletionText(payload: unknown): string {
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

export async function createOpenRouterStructuredOutput<
  TSchema extends z.ZodTypeAny,
>(
  request: OpenRouterStructuredOutputRequest<TSchema>
): Promise<z.infer<TSchema>> {
  const config = getServerConfig()
  const apiKey = config.openRouterApiKey
  if (!apiKey) {
    throw new OpenRouterConfigurationError("OpenRouter is not configured.")
  }

  const plugins: OpenRouterPlugin[] = [{ id: "response-healing" }]
  const provider: OpenRouterProviderPreferences = {
    require_parameters: true,
  }

  let response: Response
  try {
    response = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.openRouterModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.3,
        stream: false,
        response_format: {
          type: "json_schema",
          json_schema: {
            ...request.responseFormat,
            strict: request.responseFormat.strict ?? true,
          },
        },
        plugins,
        provider,
      }),
    })
  } catch (error) {
    throw new OpenRouterUpstreamError(
      error instanceof Error
        ? `OpenRouter request could not be completed: ${error.message}`
        : "OpenRouter request could not be completed."
    )
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new OpenRouterUpstreamError(
      "OpenRouter request failed.",
      response.status,
      body
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    throw new OpenRouterStructuredOutputError(
      error instanceof Error
        ? `OpenRouter returned a non-JSON response: ${error.message}`
        : "OpenRouter returned a non-JSON response."
    )
  }

  let content: string
  try {
    content = getOpenRouterCompletionText(payload)
  } catch (error) {
    throw new OpenRouterStructuredOutputError(
      error instanceof Error
        ? `OpenRouter response payload was invalid: ${error.message}`
        : "OpenRouter response payload was invalid."
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new OpenRouterStructuredOutputError(
      error instanceof Error
        ? `OpenRouter returned invalid JSON content: ${error.message}`
        : "OpenRouter returned invalid JSON content."
    )
  }

  try {
    return request.outputSchema.parse(parsed)
  } catch (error) {
    throw new OpenRouterStructuredOutputError(
      error instanceof Error
        ? `OpenRouter returned invalid structured output: ${error.message}`
        : "OpenRouter returned invalid structured output."
    )
  }
}
