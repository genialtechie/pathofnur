import {
  type CreateInterventionRequest,
  type InterventionPayload,
  type JourneyMoment,
  type LedgerEntry,
  type ResolutionState,
  JourneyMomentSchema,
  JourneyMomentsResponseSchema,
  LedgerPageResponseSchema,
  LedgerEntrySchema,
  MutationSuccessSchema,
} from "@imaan/contracts"
import { z } from "zod"

import { getSupabaseAdminClient } from "./supabase.js"

const DEFAULT_LEDGER_PAGE_SIZE = 20

const CreateInterventionAndLedgerRowSchema = z.object({
  stored_moment_id: z.string().min(1),
  stored_intervention_id: z.string().min(1),
  stored_ledger_entry_id: z.string().min(1),
  stored_occurred_at: z.string().min(1),
})

const ResolveInterventionRowSchema = z.object({
  updated_intervention_id: z.string().min(1),
  updated_resolution_state: z.enum(["grounded", "done"]),
})

const LedgerRowSchema = z.object({
  id: z.string().min(1),
  intervention_id: z.string().min(1),
  occurred_at: z.string().min(1),
  summary: z.string().min(1),
  intervention_type: z.enum([
    "contextual_anchor",
    "quick_validation",
    "concise_ruling",
  ]),
  resolution_state: z.enum(["grounded", "done"]).nullable(),
  followup_status: z
    .enum(["pending", "sent", "completed", "dismissed", "expired"])
    .nullable(),
})

const JourneyMomentRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(["open", "revisited", "resolved"]),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
  resolved_at: z.string().min(1).nullable(),
  latest_intervention_id: z.string().min(1),
})

type LedgerCursor = {
  occurredAtUtc: string
  id: string
}

function encodeLedgerCursor(cursor: LedgerCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url")
}

function decodeLedgerCursor(cursor: string | undefined): LedgerCursor | null {
  if (!cursor) {
    return null
  }

  let decoded: unknown
  try {
    decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"))
  } catch {
    throw new Error("Ledger cursor is invalid.")
  }

  const parsed = z
    .object({
      occurredAtUtc: z.string().datetime(),
      id: z.string().min(1),
    })
    .safeParse(decoded)

  if (!parsed.success) {
    throw new Error("Ledger cursor is invalid.")
  }

  return parsed.data
}

function toLedgerEntry(row: z.infer<typeof LedgerRowSchema>): LedgerEntry {
  return LedgerEntrySchema.parse({
    id: row.id,
    interventionId: row.intervention_id,
    occurredAtUtc: new Date(row.occurred_at).toISOString(),
    summary: row.summary,
    interventionType: row.intervention_type,
    resolutionState: row.resolution_state,
    followupStatus: row.followup_status,
  })
}

function toJourneyMoment(
  row: z.infer<typeof JourneyMomentRowSchema>
): JourneyMoment {
  return JourneyMomentSchema.parse({
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    createdAtUtc: new Date(row.created_at).toISOString(),
    updatedAtUtc: new Date(row.updated_at).toISOString(),
    resolvedAtUtc: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    latestInterventionId: row.latest_intervention_id,
  })
}

export async function persistInterventionRecord(
  input: {
    userId: string
    request: CreateInterventionRequest
  },
  payload: InterventionPayload
): Promise<void> {
  const supabase = getSupabaseAdminClient()
  const momentId = crypto.randomUUID()
  const ledgerEntryId = crypto.randomUUID()

  const { data, error } = await supabase.rpc("create_moment_intervention_and_ledger", {
    moment_id: momentId,
    intervention_id: payload.id,
    ledger_entry_id: ledgerEntryId,
    actor_user_id: input.userId,
    input_text: input.request.inputText,
    locale: input.request.locale ?? null,
    entry_source: input.request.entrySource ?? null,
    intervention_type: payload.type,
    generated_payload: payload,
    citation_ids: payload.citations.map((citation) => citation.id),
    occurred_at: payload.createdAtUtc,
    moment_title: payload.title,
    moment_summary: payload.ledgerSummary,
    resolution_state: null,
    followup_status: null,
  })

  if (error) {
    throw new Error(`Failed to persist intervention: ${error.message}`)
  }

  const row = CreateInterventionAndLedgerRowSchema.parse(data?.[0])
  if (row.stored_moment_id !== momentId) {
    throw new Error("Persisted moment id did not match the requested moment.")
  }
  if (row.stored_intervention_id !== payload.id) {
    throw new Error("Persisted intervention id did not match the response payload.")
  }
}

export async function listLedgerEntries(input: {
  userId: string
  cursor?: string
  limit?: number
}) {
  const supabase = getSupabaseAdminClient()
  const cursor = decodeLedgerCursor(input.cursor)
  const pageSize = input.limit ?? DEFAULT_LEDGER_PAGE_SIZE

  const { data, error } = await supabase.rpc("list_ledger_entries", {
    actor_user_id: input.userId,
    page_size: pageSize + 1,
    cursor_occurred_at: cursor?.occurredAtUtc ?? null,
    cursor_id: cursor?.id ?? null,
  })

  if (error) {
    throw new Error(`Failed to read ledger entries: ${error.message}`)
  }

  const rows = ((data as unknown[]) ?? []).map((item) => LedgerRowSchema.parse(item))
  const pageRows = rows.slice(0, pageSize)
  const nextRow = rows[pageSize]

  return LedgerPageResponseSchema.parse({
    entries: pageRows.map(toLedgerEntry),
    nextCursor: nextRow
      ? encodeLedgerCursor({
          occurredAtUtc: new Date(nextRow.occurred_at).toISOString(),
          id: nextRow.id,
        })
      : null,
  })
}

export async function listJourneyMoments(input: {
  userId: string
  limit?: number
  windowDays?: number
}) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc("list_journey_moments", {
    actor_user_id: input.userId,
    page_size: input.limit ?? 100,
    window_days: input.windowDays ?? 180,
  })

  if (error) {
    throw new Error(`Failed to read journey moments: ${error.message}`)
  }

  const rows = ((data as unknown[]) ?? []).map((item) =>
    JourneyMomentRowSchema.parse(item)
  )

  return JourneyMomentsResponseSchema.parse({
    moments: rows.map(toJourneyMoment),
  })
}

export class InterventionResolutionNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InterventionResolutionNotFoundError"
  }
}

export async function resolveInterventionRecord(input: {
  userId: string
  interventionId: string
  resolution: ResolutionState
}) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.rpc("resolve_intervention_for_actor", {
    target_intervention_id: input.interventionId,
    actor_user_id: input.userId,
    next_resolution_state: input.resolution,
  })

  if (error) {
    throw new Error(`Failed to resolve intervention: ${error.message}`)
  }

  const row = ((data as unknown[]) ?? []).at(0)
  if (!row) {
    throw new InterventionResolutionNotFoundError(
      "No matching intervention was found for this actor."
    )
  }

  const parsed = ResolveInterventionRowSchema.parse(row)
  if (
    parsed.updated_intervention_id !== input.interventionId ||
    parsed.updated_resolution_state !== input.resolution
  ) {
    throw new Error("Resolved intervention payload did not match the requested update.")
  }

  return MutationSuccessSchema.parse({
    ok: true,
  })
}
