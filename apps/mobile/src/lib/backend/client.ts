import { z } from "zod"

import {
  type AppendMomentMessageRequest,
  type AppendMomentMessageResponse,
  type CreateMomentRequest,
  type CreateMomentResponse,
  type InterventionPayload,
  type MomentDetailResponse,
  type MomentsListResponse,
  type MutationSuccess,
  AppendMomentMessageRequestSchema,
  AppendMomentMessageResponseSchema,
  CreateMomentRequestSchema,
  CreateMomentResponseSchema,
  GetMomentsRequestSchema,
  MomentDetailResponseSchema,
  MomentsListResponseSchema,
  MutationSuccessSchema,
} from "@imaan/contracts"

import { getRequiredApiBaseUrl } from "./config"

type RequestOptions<TSchema extends z.ZodTypeAny> = {
  path: string
  method?: "GET" | "POST"
  schema: TSchema
  body?: unknown
  accessToken?: string | null
}

export class BackendApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown
  ) {
    super(message)
  }
}

async function requestJson<TSchema extends z.ZodTypeAny>({
  path,
  method = "GET",
  schema,
  body,
  accessToken,
}: RequestOptions<TSchema>): Promise<z.infer<TSchema>> {
  const response = await fetch(`${getRequiredApiBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as Record<string, unknown>).message)
        : `Backend request failed with status ${response.status}`

    throw new BackendApiError(message, response.status, payload)
  }

  return schema.parse(payload)
}

export async function createMoment(
  input: CreateMomentRequest,
  accessToken?: string | null
): Promise<CreateMomentResponse> {
  const body = CreateMomentRequestSchema.parse(input)
  return requestJson({
    path: "/v1/moments",
    method: "POST",
    schema: CreateMomentResponseSchema,
    body,
    accessToken,
  })
}

export async function getMoments(
  params: { limit?: number; status?: "open" | "resolved"; windowDays?: number } = {},
  accessToken?: string | null
): Promise<MomentsListResponse> {
  const { windowDays: _windowDays, ...requestParams } = params
  const query = GetMomentsRequestSchema.parse(requestParams)
  const search = new URLSearchParams()
  if (query.limit) search.set("limit", String(query.limit))
  if (query.status) search.set("status", query.status)
  const suffix = search.toString() ? `?${search.toString()}` : ""

  return requestJson({
    path: `/v1/moments${suffix}`,
    schema: MomentsListResponseSchema,
    accessToken,
  })
}

export async function createIntervention(
  input: {
    inputText: string
    locale?: string
    entrySource?: string
  },
  accessToken?: string | null
): Promise<InterventionPayload> {
  const response = await createMoment(
    {
      text: input.inputText,
      locale: input.locale,
      entrySource: input.entrySource,
    },
    accessToken
  )
  const assistantMessage = [...response.messages]
    .reverse()
    .find((message) => message.role === "assistant")

  return {
    id: response.moment.id,
    type: "contextual_anchor",
    title: response.moment.title,
    validationCopy: "A steady response for this moment.",
    primaryText: assistantMessage?.text ?? response.moment.summary,
    dua: null,
    repeatCount: null,
    citations: response.artifacts
      .filter((artifact) => artifact.kind === "ayah" || artifact.kind === "hadith")
      .map((artifact) => ({
        id: artifact.id,
        sourceKind: artifact.kind === "ayah" ? "quran" : "hadith",
        title: artifact.title,
        reference: artifact.reference ?? "Saved source",
        excerpt: artifact.content,
      })),
    followupSuggested: false,
    ledgerSummary: response.moment.summary,
    createdAtUtc: response.moment.createdAtUtc,
  }
}

export async function getMoment(
  momentId: string,
  accessToken?: string | null
): Promise<MomentDetailResponse> {
  return requestJson({
    path: `/v1/moments/${encodeURIComponent(momentId)}`,
    schema: MomentDetailResponseSchema,
    accessToken,
  })
}

export async function appendMomentMessage(
  momentId: string,
  input: AppendMomentMessageRequest,
  accessToken?: string | null
): Promise<AppendMomentMessageResponse> {
  const body = AppendMomentMessageRequestSchema.parse(input)
  return requestJson({
    path: `/v1/moments/${encodeURIComponent(momentId)}/messages`,
    method: "POST",
    schema: AppendMomentMessageResponseSchema,
    body,
    accessToken,
  })
}

export async function resolveMoment(
  momentId: string,
  accessToken?: string | null
): Promise<MutationSuccess> {
  return requestJson({
    path: `/v1/moments/${encodeURIComponent(momentId)}/resolve`,
    method: "POST",
    schema: MutationSuccessSchema,
    accessToken,
  })
}
