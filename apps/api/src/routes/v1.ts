import type { FastifyInstance, FastifyReply } from "fastify"

import {
  type BackendErrorResponse,
  BackendErrorResponseSchema,
  CreateInterventionRequestSchema,
  FollowupResponseRequestSchema,
  GetLedgerRequestSchema,
  GetMomentsRequestSchema,
  InterventionPayloadSchema,
  RetrievePassagesRequestSchema,
  RegisterPushTokenRequestSchema,
  ResolveInterventionRequestSchema,
} from "@imaan/contracts"

import {
  BackendAuthenticationError,
  getAuthenticatedActor,
} from "../lib/auth.js"
import { createIntervention } from "../lib/interventions.js"
import {
  InterventionResolutionNotFoundError,
  listLedgerEntries,
  listJourneyMoments,
  resolveInterventionRecord,
} from "../lib/intervention-store.js"
import {
  InterventionGenerationError,
  InterventionRetrievalError,
  NoSupportingPassagesError,
} from "../lib/interventions.js"
import { InterventionClassificationError } from "../lib/intervention-classifier.js"
import { retrievePassages } from "../lib/retrieve-passages.js"

function sendNotImplemented(reply: FastifyReply, feature: string) {
  const payload: BackendErrorResponse = BackendErrorResponseSchema.parse({
    error: "not_implemented",
    message: `${feature} is scaffolded but not implemented yet.`,
  })

  return reply.code(501).send(payload)
}

async function authenticateRequest(
  request: Parameters<typeof getAuthenticatedActor>[0],
  reply: FastifyReply
) {
  try {
    return await getAuthenticatedActor(request)
  } catch (error) {
    if (error instanceof BackendAuthenticationError) {
      await reply.code(401).send({
        error: "authentication_failed",
        message: error.message,
      })
      return null
    }

    await reply.code(500).send({
      error: "authentication_failed",
      message: "Actor authentication failed.",
    })
    return null
  }
}

export async function registerV1Routes(app: FastifyInstance) {
  app.get("/v1/me", async (_request, reply) => {
    return sendNotImplemented(reply, "Profile lookup")
  })

  app.get("/v1/ledger", async (request, reply) => {
    const actor = await authenticateRequest(request, reply)
    if (!actor) {
      return reply
    }

    const rawQuery =
      typeof request.query === "object" && request.query
        ? (request.query as Record<string, unknown>)
        : {}
    const rawLimit = rawQuery.limit
    const parsed = GetLedgerRequestSchema.safeParse({
      cursor: rawQuery.cursor,
      limit:
        rawLimit === undefined
          ? undefined
          : Number(rawLimit),
    })

    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    try {
      const response = await listLedgerEntries({
        userId: actor.userId,
        ...parsed.data,
      })
      return reply.code(200).send(response)
    } catch (error) {
      return reply.code(500).send({
        error: "ledger_failed",
        message:
          error instanceof Error ? error.message : "Ledger retrieval failed.",
      })
    }
  })

  app.get("/v1/moments", async (request, reply) => {
    const actor = await authenticateRequest(request, reply)
    if (!actor) {
      return reply
    }

    const rawQuery =
      typeof request.query === "object" && request.query
        ? (request.query as Record<string, unknown>)
        : {}
    const rawLimit = rawQuery.limit
    const rawWindowDays = rawQuery.windowDays
    const parsed = GetMomentsRequestSchema.safeParse({
      limit: rawLimit === undefined ? undefined : Number(rawLimit),
      windowDays:
        rawWindowDays === undefined ? undefined : Number(rawWindowDays),
    })

    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    try {
      const response = await listJourneyMoments({
        userId: actor.userId,
        ...parsed.data,
      })
      return reply.code(200).send(response)
    } catch (error) {
      return reply.code(500).send({
        error: "moments_failed",
        message:
          error instanceof Error ? error.message : "Moment retrieval failed.",
      })
    }
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
    const actor = await authenticateRequest(request, reply)
    if (!actor) {
      return reply
    }

    const parsed = CreateInterventionRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    try {
      const payload = await createIntervention(actor, parsed.data)
      return reply.code(200).send(InterventionPayloadSchema.parse(payload))
    } catch (error) {
      if (error instanceof InterventionClassificationError) {
        return reply.code(502).send({
          error: "classification_failed",
          message: error.message,
        })
      }

      if (error instanceof InterventionRetrievalError) {
        return reply.code(502).send({
          error: "retrieval_failed",
          message: error.message,
        })
      }

      if (error instanceof NoSupportingPassagesError) {
        return reply.code(422).send({
          error: "no_supporting_passages",
          message: error.message,
        })
      }

      if (error instanceof InterventionGenerationError) {
        return reply.code(502).send({
          error: "generation_failed",
          message: error.message,
        })
      }

      return reply.code(500).send({
        error: "intervention_failed",
        message:
          error instanceof Error
            ? error.message
            : "Intervention creation failed.",
      })
    }
  })

  app.post("/v1/interventions/:id/resolve", async (request, reply) => {
    const actor = await authenticateRequest(request, reply)
    if (!actor) {
      return reply
    }

    const params =
      typeof request.params === "object" && request.params
        ? (request.params as Record<string, unknown>)
        : {}
    const interventionId =
      typeof params.id === "string" ? params.id.trim() : ""

    if (!interventionId) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: "Intervention id is required.",
      })
    }

    const parsed = ResolveInterventionRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    try {
      const response = await resolveInterventionRecord({
        userId: actor.userId,
        interventionId,
        resolution: parsed.data.resolution,
      })
      return reply.code(200).send(response)
    } catch (error) {
      if (error instanceof InterventionResolutionNotFoundError) {
        return reply.code(404).send({
          error: "intervention_not_found",
          message: error.message,
        })
      }

      return reply.code(500).send({
        error: "intervention_resolution_failed",
        message:
          error instanceof Error
            ? error.message
            : "Intervention resolution failed.",
      })
    }
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
