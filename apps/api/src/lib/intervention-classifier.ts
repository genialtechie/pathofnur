import {
  type CreateInterventionRequest,
  type InterventionType,
  InterventionTypeSchema,
} from "@imaan/contracts"
import { z } from "zod"

import {
  createOpenRouterChatCompletion,
  extractJsonObject,
  getOpenRouterCompletionText,
} from "./openrouter.js"

const InterventionClassificationSchema = z.object({
  interventionType: InterventionTypeSchema,
})

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
  let response: unknown
  try {
    response = await createOpenRouterChatCompletion({
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
    })
  } catch (error) {
    throw new InterventionClassificationError(
      error instanceof Error
        ? `Intervention classification failed: ${error.message}`
        : "Intervention classification failed."
    )
  }

  try {
    const content = getOpenRouterCompletionText(response)
    const json = extractJsonObject(content)
    const parsed = InterventionClassificationSchema.parse(JSON.parse(json))

    return {
      interventionType: parsed.interventionType,
      retrievalConfig: getRetrievalConfig(parsed.interventionType),
    }
  } catch (error) {
    throw new InterventionClassificationError(
      error instanceof Error
        ? `Intervention classification returned invalid structured output: ${error.message}`
        : "Intervention classification returned invalid structured output."
    )
  }
}
