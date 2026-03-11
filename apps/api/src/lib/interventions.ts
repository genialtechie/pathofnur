import {
  type Citation,
  type CreateInterventionRequest,
  type InterventionPayload,
  type InterventionType,
  InterventionPayloadSchema,
  InterventionTypeSchema,
  type RetrievedPassage,
} from "@imaan/contracts"
import { z } from "zod"

import { getServerConfig } from "../config.js"
import { createOpenRouterChatCompletion } from "./openrouter.js"
import { retrievePassages } from "./retrieve-passages.js"

const InterventionDraftSchema = z.object({
  type: InterventionTypeSchema,
  title: z.string().min(1),
  validationCopy: z.string().min(1),
  primaryText: z.string().min(1),
  dua: z
    .object({
      arabic: z.string().min(1).nullable(),
      transliteration: z.string().min(1).nullable(),
      translation: z.string().min(1).nullable(),
    })
    .nullable(),
  repeatCount: z.number().int().min(1).nullable(),
  followupSuggested: z.boolean(),
  ledgerSummary: z.string().min(1),
})

type InterventionDraft = z.infer<typeof InterventionDraftSchema>

export class InterventionGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InterventionGenerationError"
  }
}

function assertGenerationConfigured(): void {
  if (!getServerConfig().openRouterApiKey) {
    throw new InterventionGenerationError(
      "Intervention generation is unavailable because OpenRouter is not configured."
    )
  }
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

const rulingSignals = [
  "halal",
  "haram",
  "permissible",
  "allowed",
  "forbidden",
  "sinful",
  "is it okay",
  "can i",
  "should i",
]

const distressSignals = [
  "anxious",
  "anxiety",
  "afraid",
  "fear",
  "terrified",
  "panic",
  "overwhelmed",
  "stressed",
  "sad",
  "lonely",
  "angry",
  "ashamed",
  "guilty",
  "grief",
]

function classifyInterventionType(inputText: string): InterventionType {
  const normalized = inputText.toLowerCase()

  if (rulingSignals.some((signal) => normalized.includes(signal))) {
    return "concise_ruling"
  }

  if (distressSignals.some((signal) => normalized.includes(signal))) {
    return "contextual_anchor"
  }

  return "quick_validation"
}

function toCitations(matches: RetrievedPassage[]): Citation[] {
  return matches.map((match) => ({
    id: match.id,
    sourceKind: match.sourceType,
    title: match.title,
    reference: match.reference,
    excerpt: match.excerpt,
  }))
}

function extractJsonObject(text: string): string {
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

function getCompletionText(payload: unknown): string {
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

function buildSystemPrompt(): string {
  return [
    "You are writing a calm, grounded Muslim support response for imaan.app.",
    "You may only use the provided passages and their metadata.",
    "Do not invent citations, rulings, or source claims.",
    "Return strict JSON with these keys only:",
    "type, title, validationCopy, primaryText, dua, repeatCount, followupSuggested, ledgerSummary",
    "Keep title short.",
    "Keep validationCopy to one sentence.",
    "Keep primaryText concise and warm, no more than two short paragraphs.",
    "If the retrieved passages do not support a firm ruling, say that gently and avoid certainty.",
    "Set dua to null unless one is directly present in the provided passages.",
    "Set repeatCount to null unless the passages clearly support a repeated supplication.",
  ].join(" ")
}

function buildUserPrompt(
  input: CreateInterventionRequest,
  suggestedType: InterventionType,
  matches: RetrievedPassage[]
): string {
  return JSON.stringify(
    {
      userInput: input.inputText,
      suggestedType,
      retrievedPassages: matches.map((match) => ({
        title: match.title,
        reference: match.reference,
        englishTranslation: match.englishTranslation,
        arabicText: match.arabicText,
        contextSummary: match.contextSummary,
        emotionalTags: match.emotionalTags,
      })),
    },
    null,
    2
  )
}

async function generateDraftWithOpenRouter(
  input: CreateInterventionRequest,
  suggestedType: InterventionType,
  matches: RetrievedPassage[]
) : Promise<InterventionDraft> {
  const response = await createOpenRouterChatCompletion({
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(),
      },
      {
        role: "user",
        content: buildUserPrompt(input, suggestedType, matches),
      },
    ],
  })

  const content = getCompletionText(response)
  const json = extractJsonObject(content)
  try {
    return InterventionDraftSchema.parse(JSON.parse(json))
  } catch (error) {
    throw new InterventionGenerationError(
      error instanceof Error
        ? `Intervention generation returned invalid structured output: ${error.message}`
        : "Intervention generation returned invalid structured output."
    )
  }
}

export async function createIntervention(
  input: CreateInterventionRequest
): Promise<InterventionPayload> {
  assertGenerationConfigured()

  const suggestedType = classifyInterventionType(input.inputText)
  const retrieval = await retrievePassages({
    inputText: input.inputText,
    matchCount: 3,
  })
  const matches = retrieval.matches

  if (!matches.length) {
    throw new Error("No supporting passages were found for this intervention.")
  }

  let draft: InterventionDraft
  try {
    draft = await generateDraftWithOpenRouter(input, suggestedType, matches)
  } catch (error) {
    if (error instanceof InterventionGenerationError) {
      throw error
    }

    throw new InterventionGenerationError(
      error instanceof Error
        ? `Intervention generation failed: ${error.message}`
        : "Intervention generation failed."
    )
  }

  return InterventionPayloadSchema.parse({
    id: crypto.randomUUID(),
    type: draft.type,
    title: draft.title,
    validationCopy: draft.validationCopy,
    primaryText: draft.primaryText,
    dua: draft.dua,
    repeatCount: draft.repeatCount,
    citations: toCitations(matches),
    followupSuggested: draft.followupSuggested,
    ledgerSummary: draft.ledgerSummary,
    createdAtUtc: new Date().toISOString(),
  })
}
