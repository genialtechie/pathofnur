import {
  type Citation,
  type CreateInterventionRequest,
  type InterventionPayload,
  type InterventionType,
  InterventionPayloadSchema,
  type RetrievedPassage,
} from "@imaan/contracts"
import { z } from "zod"

import type { AuthenticatedActor } from "./auth.js"
import {
  classifyIntervention,
  InterventionClassificationError,
} from "./intervention-classifier.js"
import { persistInterventionRecord } from "./intervention-store.js"
import {
  createOpenRouterChatCompletion,
  extractJsonObject,
  getOpenRouterCompletionText,
} from "./openrouter.js"
import { retrievePassages } from "./retrieve-passages.js"

const InterventionDraftSchema = z.object({
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

export class InterventionRetrievalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InterventionRetrievalError"
  }
}

export class NoSupportingPassagesError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NoSupportingPassagesError"
  }
}

export class InterventionGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InterventionGenerationError"
  }
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

function buildSystemPrompt(): string {
  return [
    "You are writing a calm, grounded Muslim support response for imaan.app.",
    "The interventionType provided to you is already classified and locked.",
    "You may only use the provided passages and their metadata.",
    "Do not invent citations, rulings, or source claims.",
    "Return strict JSON with these keys only:",
    "title, validationCopy, primaryText, dua, repeatCount, followupSuggested, ledgerSummary",
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
  interventionType: InterventionType,
  matches: RetrievedPassage[]
): string {
  return JSON.stringify(
    {
      userInput: input.inputText,
      interventionType,
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
  interventionType: InterventionType,
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
        content: buildUserPrompt(input, interventionType, matches),
      },
    ],
  })

  const content = getOpenRouterCompletionText(response)
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
  actor: AuthenticatedActor,
  input: CreateInterventionRequest
): Promise<InterventionPayload> {
  let classification
  try {
    classification = await classifyIntervention(input)
  } catch (error) {
    if (error instanceof InterventionClassificationError) {
      throw error
    }

    throw new InterventionClassificationError(
      error instanceof Error
        ? `Intervention classification failed: ${error.message}`
        : "Intervention classification failed."
    )
  }

  let retrieval
  try {
    retrieval = await retrievePassages({
      inputText: input.inputText,
      matchCount: classification.retrievalConfig.matchCount,
    })
  } catch (error) {
    throw new InterventionRetrievalError(
      error instanceof Error
        ? `Intervention retrieval failed: ${error.message}`
        : "Intervention retrieval failed."
    )
  }
  const matches = retrieval.matches

  if (!matches.length) {
    throw new NoSupportingPassagesError(
      "No supporting passages were found for this intervention."
    )
  }

  let draft: InterventionDraft
  try {
    draft = await generateDraftWithOpenRouter(
      input,
      classification.interventionType,
      matches
    )
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

  const payload = InterventionPayloadSchema.parse({
    id: crypto.randomUUID(),
    type: classification.interventionType,
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

  await persistInterventionRecord(
    {
      userId: actor.userId,
      request: input,
    },
    payload
  )

  return payload
}
