import {
  type CreateInterventionRequest,
  type InterventionPayload,
  type LedgerEntry,
  LedgerPageResponseSchema,
  LedgerEntrySchema,
} from "@imaan/contracts"
import { z } from "zod"

import { getSupabaseAdminClient } from "./supabase.js"

const DEFAULT_LEDGER_PAGE_SIZE = 20

const CreateInterventionAndLedgerRowSchema = z.object({
  stored_intervention_id: z.string().min(1),
  stored_ledger_entry_id: z.string().min(1),
  stored_occurred_at: z.string().min(1),
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

export async function persistInterventionRecord(
  request: CreateInterventionRequest,
  payload: InterventionPayload
): Promise<void> {
  const supabase = getSupabaseAdminClient()
  const ledgerEntryId = crypto.randomUUID()

  const { data, error } = await supabase.rpc("create_intervention_and_ledger", {
    intervention_id: payload.id,
    ledger_entry_id: ledgerEntryId,
    actor_session_id: request.sessionId,
    input_text: request.inputText,
    locale: request.locale ?? null,
    entry_source: request.entrySource ?? null,
    intervention_type: payload.type,
    generated_payload: payload,
    citation_ids: payload.citations.map((citation) => citation.id),
    occurred_at: payload.createdAtUtc,
    summary: payload.ledgerSummary,
    resolution_state: null,
    followup_status: null,
  })

  if (error) {
    throw new Error(`Failed to persist intervention: ${error.message}`)
  }

  const row = CreateInterventionAndLedgerRowSchema.parse(data?.[0])
  if (row.stored_intervention_id !== payload.id) {
    throw new Error("Persisted intervention id did not match the response payload.")
  }
}

export async function listLedgerEntries(input: {
  sessionId: string
  cursor?: string
  limit?: number
}) {
  const supabase = getSupabaseAdminClient()
  const cursor = decodeLedgerCursor(input.cursor)
  const pageSize = input.limit ?? DEFAULT_LEDGER_PAGE_SIZE

  const { data, error } = await supabase.rpc("list_ledger_entries", {
    actor_session_id: input.sessionId,
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
