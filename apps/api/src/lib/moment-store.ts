import {
  type MomentArtifact,
  type MomentArtifactKind,
  type MomentDetailResponse,
  type MomentMessage,
  type MomentSummary,
  MomentArtifactSchema,
  MomentDetailResponseSchema,
  MomentMessageSchema,
  MomentSummarySchema,
  MomentsListResponseSchema,
  MutationSuccessSchema,
} from "@imaan/contracts"
import { z } from "zod"

import { getSupabaseAdminClient } from "./supabase.js"

const DEFAULT_MOMENTS_LIMIT = 50

const MomentRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable().default(""),
  status: z.enum(["open", "resolved"]),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
  resolved_at: z.string().min(1).nullable(),
})

const MessageRowSchema = z.object({
  id: z.string().min(1),
  moment_id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1),
  created_at: z.string().min(1),
})

const ArtifactRowSchema = z.object({
  id: z.string().min(1),
  moment_id: z.string().min(1),
  kind: z.enum(["ayah", "hadith", "dua", "note"]),
  title: z.string().min(1),
  reference: z.string().min(1).nullable(),
  content: z.string().min(1),
  created_at: z.string().min(1),
})

const ExchangeRowSchema = z.object({
  stored_moment_id: z.string().min(1),
  stored_user_message_id: z.string().min(1),
  stored_assistant_message_id: z.string().min(1),
})

export class MomentNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MomentNotFoundError"
  }
}

export type ArtifactDraft = {
  kind: MomentArtifactKind
  title: string
  reference: string | null
  content: string
}

type ExchangeInput = {
  userId: string
  momentId: string
  title: string
  summary: string
  userMessageId: string
  assistantMessageId: string
  userText: string
  assistantText: string
  artifacts: ArtifactDraft[]
  occurredAtUtc: string
}

function toMoment(row: z.infer<typeof MomentRowSchema>): MomentSummary {
  return MomentSummarySchema.parse({
    id: row.id,
    title: row.title,
    summary: row.summary || "",
    status: row.status,
    createdAtUtc: new Date(row.created_at).toISOString(),
    updatedAtUtc: new Date(row.updated_at).toISOString(),
    resolvedAtUtc: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
  })
}

function toMessage(row: z.infer<typeof MessageRowSchema>): MomentMessage {
  return MomentMessageSchema.parse({
    id: row.id,
    momentId: row.moment_id,
    role: row.role,
    text: row.text,
    createdAtUtc: new Date(row.created_at).toISOString(),
  })
}

function toArtifact(row: z.infer<typeof ArtifactRowSchema>): MomentArtifact {
  return MomentArtifactSchema.parse({
    id: row.id,
    momentId: row.moment_id,
    kind: row.kind,
    title: row.title,
    reference: row.reference,
    content: row.content,
    createdAtUtc: new Date(row.created_at).toISOString(),
  })
}

function buildArtifactRows(artifacts: ArtifactDraft[]) {
  return artifacts.map((artifact) => ({
    id: crypto.randomUUID(),
    kind: artifact.kind,
    title: artifact.title,
    reference: artifact.reference,
    content: artifact.content,
  }))
}

export async function listMoments(input: {
  userId: string
  limit?: number
  status?: "open" | "resolved"
}) {
  const supabase = getSupabaseAdminClient()
  let query = supabase
    .from("moments")
    .select("id,title,summary,status,created_at,updated_at,resolved_at")
    .eq("actor_user_id", input.userId)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(input.limit ?? DEFAULT_MOMENTS_LIMIT)

  if (input.status) {
    query = query.eq("status", input.status)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Failed to list moments: ${error.message}`)
  }

  return MomentsListResponseSchema.parse({
    moments: ((data as unknown[]) ?? []).map((row) =>
      toMoment(MomentRowSchema.parse(row))
    ),
  })
}

export async function getMomentDetail(input: {
  userId: string
  momentId: string
}): Promise<MomentDetailResponse> {
  const supabase = getSupabaseAdminClient()
  const { data: momentData, error: momentError } = await supabase
    .from("moments")
    .select("id,title,summary,status,created_at,updated_at,resolved_at")
    .eq("actor_user_id", input.userId)
    .eq("id", input.momentId)
    .maybeSingle()

  if (momentError) {
    throw new Error(`Failed to read moment: ${momentError.message}`)
  }
  if (!momentData) {
    throw new MomentNotFoundError("No matching moment was found for this actor.")
  }

  const [{ data: messageData, error: messageError }, { data: artifactData, error: artifactError }] =
    await Promise.all([
      supabase
        .from("moment_messages")
        .select("id,moment_id,role,text,created_at")
        .eq("actor_user_id", input.userId)
        .eq("moment_id", input.momentId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("moment_artifacts")
        .select("id,moment_id,kind,title,reference,content,created_at")
        .eq("actor_user_id", input.userId)
        .eq("moment_id", input.momentId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
    ])

  if (messageError) {
    throw new Error(`Failed to read moment messages: ${messageError.message}`)
  }
  if (artifactError) {
    throw new Error(`Failed to read moment artifacts: ${artifactError.message}`)
  }

  return MomentDetailResponseSchema.parse({
    moment: toMoment(MomentRowSchema.parse(momentData)),
    messages: ((messageData as unknown[]) ?? []).map((row) =>
      toMessage(MessageRowSchema.parse(row))
    ),
    artifacts: ((artifactData as unknown[]) ?? []).map((row) =>
      toArtifact(ArtifactRowSchema.parse(row))
    ),
  })
}

export async function getRecentMomentMessages(input: {
  userId: string
  momentId: string
  limit?: number
}): Promise<MomentMessage[]> {
  const supabase = getSupabaseAdminClient()
  const { data: momentData, error: momentError } = await supabase
    .from("moments")
    .select("id")
    .eq("actor_user_id", input.userId)
    .eq("id", input.momentId)
    .maybeSingle()

  if (momentError) {
    throw new Error(`Failed to read moment: ${momentError.message}`)
  }
  if (!momentData) {
    throw new MomentNotFoundError("No matching moment was found for this actor.")
  }

  const { data, error } = await supabase
    .from("moment_messages")
    .select("id,moment_id,role,text,created_at")
    .eq("actor_user_id", input.userId)
    .eq("moment_id", input.momentId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(input.limit ?? 12)

  if (error) {
    throw new Error(`Failed to read recent moment messages: ${error.message}`)
  }

  return ((data as unknown[]) ?? [])
    .map((row) => toMessage(MessageRowSchema.parse(row)))
    .reverse()
}

export async function createMomentExchange(input: ExchangeInput) {
  const supabase = getSupabaseAdminClient()
  const artifactRows = buildArtifactRows(input.artifacts)
  const { data, error } = await supabase.rpc("create_moment_with_exchange", {
    moment_id: input.momentId,
    actor_user_id: input.userId,
    moment_title: input.title,
    moment_summary: input.summary,
    user_message_id: input.userMessageId,
    assistant_message_id: input.assistantMessageId,
    user_text: input.userText,
    assistant_text: input.assistantText,
    occurred_at: input.occurredAtUtc,
    artifact_rows: artifactRows,
  })

  if (error) {
    throw new Error(`Failed to create moment exchange: ${error.message}`)
  }

  const row = ExchangeRowSchema.parse(((data as unknown[]) ?? []).at(0))
  if (
    row.stored_moment_id !== input.momentId ||
    row.stored_user_message_id !== input.userMessageId ||
    row.stored_assistant_message_id !== input.assistantMessageId
  ) {
    throw new Error("Created moment exchange did not match the requested ids.")
  }

  return getMomentDetail({ userId: input.userId, momentId: input.momentId })
}

export async function appendMomentExchange(input: ExchangeInput) {
  const supabase = getSupabaseAdminClient()
  const artifactRows = buildArtifactRows(input.artifacts)
  const { data, error } = await supabase.rpc("append_moment_exchange", {
    target_moment_id: input.momentId,
    actor_user_id: input.userId,
    next_title: input.title,
    next_summary: input.summary,
    user_message_id: input.userMessageId,
    assistant_message_id: input.assistantMessageId,
    user_text: input.userText,
    assistant_text: input.assistantText,
    occurred_at: input.occurredAtUtc,
    artifact_rows: artifactRows,
  })

  if (error) {
    throw new Error(`Failed to append moment exchange: ${error.message}`)
  }

  const row = ((data as unknown[]) ?? []).at(0)
  if (!row) {
    throw new MomentNotFoundError("No matching moment was found for this actor.")
  }

  const parsed = ExchangeRowSchema.parse(row)
  if (
    parsed.stored_moment_id !== input.momentId ||
    parsed.stored_user_message_id !== input.userMessageId ||
    parsed.stored_assistant_message_id !== input.assistantMessageId
  ) {
    throw new Error("Appended moment exchange did not match the requested ids.")
  }

  return getMomentDetail({ userId: input.userId, momentId: input.momentId })
}

export async function resolveMoment(input: {
  userId: string
  momentId: string
}) {
  const resolvedAtUtc = new Date().toISOString()
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("moments")
    .update({
      status: "resolved",
      resolved_at: resolvedAtUtc,
      updated_at: resolvedAtUtc,
    })
    .eq("actor_user_id", input.userId)
    .eq("id", input.momentId)
    .select("id")
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to resolve moment: ${error.message}`)
  }
  if (!data) {
    throw new MomentNotFoundError("No matching moment was found for this actor.")
  }

  return MutationSuccessSchema.parse({ ok: true })
}
