import {
  type CreateInterventionRequest,
  type InterventionType,
  InterventionTypeSchema,
} from "@imaan/contracts"
import { z } from "zod"

import {
  createOpenRouterStructuredOutput,
  OpenRouterConfigurationError,
  OpenRouterStructuredOutputError,
  OpenRouterUpstreamError,
} from "./openrouter.js"

const InterventionClassificationSchema = z.object({
  interventionType: InterventionTypeSchema,
})

const InterventionClassificationJsonSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    interventionType: {
      type: "string",
      enum: [...InterventionTypeSchema.options],
    },
  },
  required: ["interventionType"],
}

const RetrievalConfigSchema = z.object({
  matchCount: z.number().int().min(1).max(10),
})

export type InterventionClassification = {
  interventionType: InterventionType
  retrievalConfig: z.infer<typeof RetrievalConfigSchema>
}

export class InterventionClassificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InterventionClassificationError"
  }
}

function buildClassificationSystemPrompt(): string {
  return [
    "Classify the user's request for imaan.app.",
    "Return strict JSON with this key only: interventionType.",
    "Allowed values are contextual_anchor, quick_validation, concise_ruling.",
    "Use concise_ruling only when the user is explicitly asking for permissibility, a ruling, or moral/legal judgment.",
    "Use contextual_anchor for distress, fear, grief, shame, guilt, overwhelm, loneliness, or emotional grounding.",
    "Use quick_validation for lighter directional support, reminder-style help, or brief validation that does not require a ruling.",
    "Do not include explanations or extra keys.",
  ].join(" ")
}

function buildClassificationUserPrompt(input: CreateInterventionRequest): string {
  return JSON.stringify(
    {
      userInput: input.inputText,
      locale: input.locale ?? null,
      entrySource: input.entrySource ?? null,
    },
    null,
    2
  )
}

function getRetrievalConfig(
  interventionType: InterventionType
): z.infer<typeof RetrievalConfigSchema> {
  switch (interventionType) {
    case "contextual_anchor":
      return RetrievalConfigSchema.parse({ matchCount: 4 })
    case "quick_validation":
      return RetrievalConfigSchema.parse({ matchCount: 3 })
    case "concise_ruling":
      return RetrievalConfigSchema.parse({ matchCount: 5 })
  }
}

export async function classifyIntervention(
  input: CreateInterventionRequest
): Promise<InterventionClassification> {
  try {
    const parsed = await createOpenRouterStructuredOutput({
      temperature: 0,
      messages: [
        {
          role: "system",
          content: buildClassificationSystemPrompt(),
        },
        {
          role: "user",
          content: buildClassificationUserPrompt(input),
        },
      ],
      outputSchema: InterventionClassificationSchema,
      responseFormat: {
        name: "intervention_classification",
        description: "Classify the intervention request into one allowed type.",
        schema: InterventionClassificationJsonSchema,
        strict: true,
      },
    })

    return {
      interventionType: parsed.interventionType,
      retrievalConfig: getRetrievalConfig(parsed.interventionType),
    }
  } catch (error) {
    if (error instanceof OpenRouterConfigurationError) {
      throw new InterventionClassificationError(
        "Intervention classification is unavailable because OpenRouter is not configured."
      )
    }

    if (error instanceof OpenRouterStructuredOutputError) {
      throw new InterventionClassificationError(
        "Intervention classification returned invalid structured output."
      )
    }

    if (error instanceof OpenRouterUpstreamError) {
      throw new InterventionClassificationError(
        "Intervention classification failed because OpenRouter did not return a successful response."
      )
    }

    throw new InterventionClassificationError(
      error instanceof Error
        ? `Intervention classification failed: ${error.message}`
        : "Intervention classification failed."
    )
  }
}
