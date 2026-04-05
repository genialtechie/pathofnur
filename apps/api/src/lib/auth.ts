import type { FastifyRequest } from "fastify"
import { z } from "zod"

import { getServerConfig } from "../config.js"
import { getSupabaseAdminClient } from "./supabase.js"

export class BackendAuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BackendAuthenticationError"
  }
}

export type AuthenticatedActor = {
  userId: string
  accessToken: string
}

const DevAuthBypassUserIdSchema = z.string().uuid()

function getBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization?.trim()
  if (!header) {
    return null
  }

  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

function getDevBypassActor(accessToken: string): AuthenticatedActor | null {
  const config = getServerConfig()
  if (!config.devAuthBypassEnabled) {
    return null
  }

  if (!config.devAuthBypassToken || !config.devAuthBypassUserId) {
    throw new Error(
      "IMAAN_DEV_AUTH_BYPASS=1 requires IMAAN_DEV_AUTH_BYPASS_TOKEN and IMAAN_DEV_AUTH_BYPASS_USER_ID."
    )
  }

  const parsedUserId = DevAuthBypassUserIdSchema.safeParse(
    config.devAuthBypassUserId
  )
  if (!parsedUserId.success) {
    throw new Error("IMAAN_DEV_AUTH_BYPASS_USER_ID must be a valid UUID.")
  }

  if (accessToken !== config.devAuthBypassToken) {
    return null
  }

  return {
    userId: parsedUserId.data,
    accessToken,
  }
}

export async function getAuthenticatedActor(
  request: FastifyRequest
): Promise<AuthenticatedActor> {
  const accessToken = getBearerToken(request)
  if (!accessToken) {
    throw new BackendAuthenticationError("Authorization bearer token is required.")
  }

  const devBypassActor = getDevBypassActor(accessToken)
  if (devBypassActor) {
    return devBypassActor
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user?.id) {
    throw new BackendAuthenticationError("Authorization token is invalid.")
  }

  return {
    userId: data.user.id,
    accessToken,
  }
}
