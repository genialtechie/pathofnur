import {
  type AppendMomentMessageRequest,
  type CreateMomentRequest,
  type MomentArtifactKind,
  type MomentMessage,
} from "@imaan/contracts"
import { z } from "zod"

import type { AuthenticatedActor } from "./auth.js"
import {
  appendMomentExchange,
  createMomentExchange,
  getRecentMomentMessages,
  type ArtifactDraft,
} from "./moment-store.js"
import {
  createOpenRouterStructuredOutput,
  OpenRouterConfigurationError,
  OpenRouterStructuredOutputError,
  OpenRouterUpstreamError,
} from "./openrouter.js"
import { retrievePassages } from "./retrieve-passages.js"

const MomentChatDraftSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  assistantText: z.string().min(1),
})

const MomentChatDraftJsonSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1 },
    summary: { type: "string", minLength: 1 },
    assistantText: { type: "string", minLength: 1 },
  },
  required: ["title", "summary", "assistantText"],
}

type MomentChatDraft = z.infer<typeof MomentChatDraftSchema>

type SourceSupportResult = {
  artifacts: ArtifactDraft[]
  requiresSourceSupport: boolean
}

export class MomentChatGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MomentChatGenerationError"
  }
}

export class MomentChatRetrievalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MomentChatRetrievalError"
  }
}

function requiresIslamicSourceSupport(text: string): boolean {
  return /\b(allah|islam|islamic|muslim|quran|qur'an|ayah|ayat|surah|verse|hadith|hadeeth|sunnah|dua|du'a|dhikr|salah|salat|prayer|pray|prayed|fast|fasting|ramadan|zakat|hajj|umrah|wudu|ghusl|janabah|halal|haram|sin|sinned|punishment|reward|jannah|jahannam|hell|paradise|forgive|forgiveness|repent|tawbah|ruling|fatwa|scholar|madhhab|fiqh|islamic source|evidence|citation|cite)\b/i.test(
    text
  )
}

function getRequestedSourceTypes(text: string): Array<"quran" | "hadith"> | undefined {
  const asksForQuran = /\b(quran|qur'an|ayah|ayat|surah|verse)\b/i.test(text)
  const asksForHadith = /\b(hadith|hadeeth|sunnah)\b/i.test(text)

  if (asksForQuran && !asksForHadith) {
    return ["quran"]
  }

  if (asksForHadith && !asksForQuran) {
    return ["hadith"]
  }

  return undefined
}

function buildSystemPrompt(input: {
  hasSources: boolean
  requiresSourceSupport: boolean
}): string {
  return [
    "You are imaan.app, a calm Muslim companion for one concrete user moment.",
    "Be warm, concise, and zero-judgment.",
    "Do not present yourself as a scholar or therapist.",
    "Truthfulness is mandatory. Warm delivery must never soften, hide, or replace what the sources actually say.",
    "Do not invent Islamic citations, hadith, ayat, duas, punishments, rewards, or legal rulings.",
    input.hasSources
      ? "Use only the provided Quran and hadith source support for Islamic claims. Cite references naturally in the answer. Do not add established interpretation, scholarly consensus, fiqh conclusions, or common rulings unless they are directly supported by the provided source text."
      : input.requiresSourceSupport
        ? "This user message requires Islamic source support, but none was provided. Do not answer the religious substance. Say you cannot answer it with authority until source support is available."
        : "Answer as normal supportive conversation. Avoid source claims unless the user provided them.",
    "When sources are provided, answer only what those sources clearly establish. If the provided source support is partial, irrelevant, or does not prove a claim, say that clearly and stop instead of filling the gap from memory.",
    "For Quran and hadith questions, prefer direct source wording and close paraphrase over broad legal summary.",
    "Use the source wording for religious categories. Do not parenthetically define source terms, for example People of the Scripture, unless that definition appears in sourceSupport.",
    "Do not convert source terms such as believers, polytheistic, People of the Scripture, disbelievers, or before you into modern labels or broader explanations unless the provided sourceSupport itself does that.",
    "Do not write phrases like 'established interpretation beyond the given excerpts' or 'based on sources not provided.' If it is not in sourceSupport, do not include it.",
    "Never issue a personal fatwa. For detailed rulings, tell the user to ask a qualified scholar while still sharing what the provided sources clearly establish.",
    "Return strict JSON with title, summary, and assistantText.",
    "The title must be short and stable for a saved thread.",
    "The summary must be one plain sentence for the Journey list.",
    "The assistantText should be no more than two short paragraphs unless the user asks for detail.",
  ].join(" ")
}

function buildUserPrompt(input: {
  currentText: string
  recentMessages: MomentMessage[]
  sourceSupport: ArtifactDraft[]
  requiresSourceSupport: boolean
}) {
  return JSON.stringify(
    {
      currentUserMessage: input.currentText,
      requiresIslamicSourceSupport: input.requiresSourceSupport,
      recentMessages: input.recentMessages.map((message) => ({
        role: message.role,
        text: message.text,
      })),
      sourceSupport: input.sourceSupport,
    },
    null,
    2
  )
}

function artifactKindForSource(sourceType: "quran" | "hadith"): MomentArtifactKind {
  return sourceType === "quran" ? "ayah" : "hadith"
}

function buildUnsupportedSourceDraft(text: string): MomentChatDraft {
  return MomentChatDraftSchema.parse({
    title: "Needs Source Support",
    summary: "This moment needs Quran or hadith support before giving a religious answer.",
    assistantText: [
      "I should not answer that from assumption or memory. This needs to be grounded in Quran and authenticated hadith first.",
      "I could not retrieve source support for this message right now, so I cannot state the ruling, punishment, or religious consequence with authority. Try again in a moment, or ask a qualified scholar for a specific ruling.",
    ].join("\n\n"),
  })
}

async function getSourceSupport(text: string): Promise<SourceSupportResult> {
  const requiresSourceSupport = requiresIslamicSourceSupport(text)

  if (!requiresSourceSupport) {
    return {
      artifacts: [],
      requiresSourceSupport,
    }
  }

  try {
    const response = await retrievePassages({
      inputText: text,
      matchCount: 5,
      sourceTypes: getRequestedSourceTypes(text),
    })

    return {
      artifacts: response.matches.map((match) => ({
        kind: artifactKindForSource(match.sourceType),
        title: match.title,
        reference: match.reference,
        content: match.englishTranslation,
      })),
      requiresSourceSupport,
    }
  } catch (error) {
    throw new MomentChatRetrievalError(
      error instanceof Error
        ? `Source retrieval failed: ${error.message}`
        : "Source retrieval failed."
    )
  }
}

async function generateMomentReply(input: {
  text: string
  recentMessages: MomentMessage[]
  sourceSupport: ArtifactDraft[]
  requiresSourceSupport: boolean
}): Promise<MomentChatDraft> {
  if (input.requiresSourceSupport && input.sourceSupport.length === 0) {
    return buildUnsupportedSourceDraft(input.text)
  }

  try {
    return await createOpenRouterStructuredOutput({
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt({
            hasSources: input.sourceSupport.length > 0,
            requiresSourceSupport: input.requiresSourceSupport,
          }),
        },
        {
          role: "user",
          content: buildUserPrompt({
            currentText: input.text,
            recentMessages: input.recentMessages,
            sourceSupport: input.sourceSupport,
            requiresSourceSupport: input.requiresSourceSupport,
          }),
        },
      ],
      outputSchema: MomentChatDraftSchema,
      responseFormat: {
        name: "moment_chat_reply",
        description: "Generate a concise assistant reply and saved moment metadata.",
        schema: MomentChatDraftJsonSchema,
        strict: true,
      },
    })
  } catch (error) {
    if (error instanceof OpenRouterConfigurationError) {
      throw new MomentChatGenerationError(
        "Moment chat is unavailable because OpenRouter is not configured."
      )
    }

    if (error instanceof OpenRouterStructuredOutputError) {
      throw new MomentChatGenerationError(
        "Moment chat returned invalid structured output."
      )
    }

    if (error instanceof OpenRouterUpstreamError) {
      throw new MomentChatGenerationError(
        "Moment chat failed because OpenRouter did not return a successful response."
      )
    }

    throw new MomentChatGenerationError(
      error instanceof Error
        ? `Moment chat failed: ${error.message}`
        : "Moment chat failed."
    )
  }
}

export async function createMomentWithReply(
  actor: AuthenticatedActor,
  request: CreateMomentRequest
) {
  const sourceSupport = await getSourceSupport(request.text)
  const draft = await generateMomentReply({
    text: request.text,
    recentMessages: [],
    sourceSupport: sourceSupport.artifacts,
    requiresSourceSupport: sourceSupport.requiresSourceSupport,
  })
  const occurredAtUtc = new Date().toISOString()

  return createMomentExchange({
    userId: actor.userId,
    momentId: crypto.randomUUID(),
    title: request.title ?? draft.title,
    summary: draft.summary,
    userMessageId: crypto.randomUUID(),
    assistantMessageId: crypto.randomUUID(),
    userText: request.text,
    assistantText: draft.assistantText,
    artifacts: sourceSupport.artifacts,
    occurredAtUtc,
  })
}

export async function appendMomentMessageWithReply(
  actor: AuthenticatedActor,
  momentId: string,
  request: AppendMomentMessageRequest
) {
  const recentMessages = await getRecentMomentMessages({
    userId: actor.userId,
    momentId,
  })
  const sourceSupport = await getSourceSupport(request.text)
  const draft = await generateMomentReply({
    text: request.text,
    recentMessages,
    sourceSupport: sourceSupport.artifacts,
    requiresSourceSupport: sourceSupport.requiresSourceSupport,
  })
  const occurredAtUtc = new Date().toISOString()

  return appendMomentExchange({
    userId: actor.userId,
    momentId,
    title: draft.title,
    summary: draft.summary,
    userMessageId: crypto.randomUUID(),
    assistantMessageId: crypto.randomUUID(),
    userText: request.text,
    assistantText: draft.assistantText,
    artifacts: sourceSupport.artifacts,
    occurredAtUtc,
  })
}
