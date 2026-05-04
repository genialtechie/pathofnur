import type { FastifyInstance, FastifyReply } from "fastify"

import {
  AppendMomentMessageRequestSchema,
  AppendMomentMessageResponseSchema,
  BackendErrorResponseSchema,
  CreateMomentRequestSchema,
  CreateMomentResponseSchema,
  GetMomentsRequestSchema,
  MomentDetailResponseSchema,
  MomentsListResponseSchema,
} from "@imaan/contracts"

import {
  BackendAuthenticationError,
  getAuthenticatedActor,
} from "../lib/auth.js"
import {
  appendMomentMessageWithReply,
  createMomentWithReply,
  MomentChatGenerationError,
  MomentChatRetrievalError,
} from "../lib/moment-chat.js"
import {
  getMomentDetail,
  listMoments,
  MomentNotFoundError,
  resolveMoment,
} from "../lib/moment-store.js"

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

function getRouteId(params: unknown): string {
  if (!params || typeof params !== "object") {
    return ""
  }

  const value = (params as Record<string, unknown>).id
  return typeof value === "string" ? value.trim() : ""
}

function sendMomentChatError(reply: FastifyReply, error: unknown) {
  if (error instanceof MomentNotFoundError) {
    return reply.code(404).send({
      error: "moment_not_found",
      message: error.message,
    })
  }

  if (error instanceof MomentChatRetrievalError) {
    return reply.code(502).send({
      error: "source_retrieval_failed",
      message: error.message,
    })
  }

  if (error instanceof MomentChatGenerationError) {
    return reply.code(502).send({
      error: "moment_generation_failed",
      message: error.message,
    })
  }

  return reply.code(500).send(
    BackendErrorResponseSchema.parse({
      error: "moment_failed",
      message:
        error instanceof Error ? error.message : "Moment request failed.",
    })
  )
}

export async function registerV1Routes(app: FastifyInstance) {
  app.post("/v1/moments", async (request, reply) => {
    const actor = await authenticateRequest(request, reply)
    if (!actor) {
      return reply
    }

    const parsed = CreateMomentRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    try {
      const response = await createMomentWithReply(actor, parsed.data)
      return reply.code(201).send(CreateMomentResponseSchema.parse(response))
    } catch (error) {
      return sendMomentChatError(reply, error)
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
    const parsed = GetMomentsRequestSchema.safeParse({
      limit: rawLimit === undefined ? undefined : Number(rawLimit),
      status: rawQuery.status,
    })

    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    try {
      const response = await listMoments({
        userId: actor.userId,
        ...parsed.data,
      })
      return reply.code(200).send(MomentsListResponseSchema.parse(response))
    } catch (error) {
      return sendMomentChatError(reply, error)
    }
  })

  app.get("/v1/moments/:id", async (request, reply) => {
    const actor = await authenticateRequest(request, reply)
    if (!actor) {
      return reply
    }

    const momentId = getRouteId(request.params)
    if (!momentId) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: "Moment id is required.",
      })
    }

    try {
      const response = await getMomentDetail({
        userId: actor.userId,
        momentId,
      })
      return reply.code(200).send(MomentDetailResponseSchema.parse(response))
    } catch (error) {
      return sendMomentChatError(reply, error)
    }
  })

  app.post("/v1/moments/:id/messages", async (request, reply) => {
    const actor = await authenticateRequest(request, reply)
    if (!actor) {
      return reply
    }

    const momentId = getRouteId(request.params)
    if (!momentId) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: "Moment id is required.",
      })
    }

    const parsed = AppendMomentMessageRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: parsed.error.message,
      })
    }

    try {
      const detail = await appendMomentMessageWithReply(
        actor,
        momentId,
        parsed.data
      )
      const messages = detail.messages.slice(-2)
      return reply.code(200).send(
        AppendMomentMessageResponseSchema.parse({
          moment: detail.moment,
          messages,
          artifacts: detail.artifacts,
        })
      )
    } catch (error) {
      return sendMomentChatError(reply, error)
    }
  })

  app.post("/v1/moments/:id/resolve", async (request, reply) => {
    const actor = await authenticateRequest(request, reply)
    if (!actor) {
      return reply
    }

    const momentId = getRouteId(request.params)
    if (!momentId) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: "Moment id is required.",
      })
    }

    try {
      const response = await resolveMoment({
        userId: actor.userId,
        momentId,
      })
      return reply.code(200).send(response)
    } catch (error) {
      return sendMomentChatError(reply, error)
    }
  })
}
