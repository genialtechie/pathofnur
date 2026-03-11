import type { FastifyInstance, FastifyReply } from "fastify"

import {
  type BackendErrorResponse,
  BackendErrorResponseSchema,
  CreateInterventionRequestSchema,
  FollowupResponseRequestSchema,
  RetrievePassagesRequestSchema,
  RegisterPushTokenRequestSchema,
  ResolveInterventionRequestSchema,
} from "../lib/contracts.js"

import { retrievePassages } from "../lib/retrieve-passages.js"

function sendNotImplemented(reply: FastifyReply, feature: string) {
  const payload: BackendErrorResponse = BackendErrorResponseSchema.parse({
    error: "not_implemented",
    message: `${feature} is scaffolded but not implemented yet.`,
  })

  return reply.code(501).send(payload)
}

export async function registerV1Routes(app: FastifyInstance) {
  app.get("/v1/me", async (_request, reply) => {
    return sendNotImplemented(reply, "Profile lookup")
  })

  app.get("/v1/ledger", async (_request, reply) => {
    return sendNotImplemented(reply, "Ledger retrieval")
  })

  app.get("/v1/followups", async (_request, reply) => {
    return sendNotImplemented(reply, "Follow-up retrieval")
  })

  app.post("/v1/retrieve", async (request, reply) => {
    const parsed = RetrievePassagesRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    try {
      const response = await retrievePassages(parsed.data)
      return reply.code(200).send(response)
    } catch (error) {
      return reply.code(500).send({
        error: "retrieval_failed",
        message:
          error instanceof Error ? error.message : "Passage retrieval failed.",
      })
    }
  })

  app.post("/v1/devices/push-token", async (request, reply) => {
    const parsed = RegisterPushTokenRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    return sendNotImplemented(reply, "Push token registration")
  })

  app.post("/v1/interventions", async (request, reply) => {
    const parsed = CreateInterventionRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    return sendNotImplemented(reply, "Intervention creation")
  })

  app.post("/v1/interventions/:id/resolve", async (request, reply) => {
    const parsed = ResolveInterventionRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    return sendNotImplemented(reply, "Intervention resolution")
  })

  app.post("/v1/followups/:id/respond", async (request, reply) => {
    const parsed = FollowupResponseRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    return sendNotImplemented(reply, "Follow-up response")
  })
}
