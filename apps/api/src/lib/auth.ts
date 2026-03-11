import type { FastifyRequest } from "fastify"

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

function getBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization?.trim()
  if (!header) {
    return null
  }

  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export async function getAuthenticatedActor(
  request: FastifyRequest
): Promise<AuthenticatedActor> {
  const accessToken = getBearerToken(request)
  if (!accessToken) {
    throw new BackendAuthenticationError("Authorization bearer token is required.")
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
