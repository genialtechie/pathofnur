import { z } from "zod"

import {
  type CreateInterventionRequest,
  type FollowupListResponse,
  type JourneyMomentsResponse,
  type FollowupResponseRequest,
  type LedgerPageResponse,
  type MeResponse,
  type MutationSuccess,
  type RegisterPushTokenRequest,
  type ResolveInterventionRequest,
  CreateInterventionRequestSchema,
  FollowupListResponseSchema,
  JourneyMomentsResponseSchema,
  FollowupResponseRequestSchema,
  InterventionPayloadSchema,
  LedgerPageResponseSchema,
  MeResponseSchema,
  MutationSuccessSchema,
  RegisterPushTokenRequestSchema,
  ResolveInterventionRequestSchema,
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

export async function createIntervention(
  input: CreateInterventionRequest,
  accessToken?: string | null
) {
  const body = CreateInterventionRequestSchema.parse(input)
  return requestJson({
    path: "/v1/interventions",
    method: "POST",
    schema: InterventionPayloadSchema,
    body,
    accessToken,
  })
}

export async function resolveIntervention(
  interventionId: string,
  input: ResolveInterventionRequest,
  accessToken?: string | null
) {
  const body = ResolveInterventionRequestSchema.parse(input)
  return requestJson({
    path: `/v1/interventions/${interventionId}/resolve`,
    method: "POST",
    schema: MutationSuccessSchema,
    body,
    accessToken,
  })
}

export async function getLedger(
  params: { cursor?: string | null; limit?: number } = {},
  accessToken?: string | null
): Promise<LedgerPageResponse> {
  const search = new URLSearchParams()
  if (params.cursor) search.set("cursor", params.cursor)
  if (params.limit) search.set("limit", String(params.limit))
  const suffix = search.toString() ? `?${search.toString()}` : ""

  return requestJson({
    path: `/v1/ledger${suffix}`,
    schema: LedgerPageResponseSchema,
    accessToken,
  })
}

export async function getMoments(
  params: { limit?: number; windowDays?: number } = {},
  accessToken?: string | null
): Promise<JourneyMomentsResponse> {
  const search = new URLSearchParams()
  if (params.limit) search.set("limit", String(params.limit))
  if (params.windowDays) search.set("windowDays", String(params.windowDays))
  const suffix = search.toString() ? `?${search.toString()}` : ""

  return requestJson({
    path: `/v1/moments${suffix}`,
    schema: JourneyMomentsResponseSchema,
    accessToken,
  })
}

export async function getMe(accessToken?: string | null): Promise<MeResponse> {
  return requestJson({
    path: "/v1/me",
    schema: MeResponseSchema,
    accessToken,
  })
}

export async function getFollowups(
  accessToken?: string | null
): Promise<FollowupListResponse> {
  return requestJson({
    path: "/v1/followups",
    schema: FollowupListResponseSchema,
    accessToken,
  })
}

export async function respondToFollowup(
  followupId: string,
  input: FollowupResponseRequest,
  accessToken?: string | null
): Promise<MutationSuccess> {
  const body = FollowupResponseRequestSchema.parse(input)
  return requestJson({
    path: `/v1/followups/${followupId}/respond`,
    method: "POST",
    schema: MutationSuccessSchema,
    body,
    accessToken,
  })
}

export async function registerPushToken(
  input: RegisterPushTokenRequest,
  accessToken?: string | null
): Promise<MutationSuccess> {
  const body = RegisterPushTokenRequestSchema.parse(input)
  return requestJson({
    path: "/v1/devices/push-token",
    method: "POST",
    schema: MutationSuccessSchema,
    body,
    accessToken,
  })
}
