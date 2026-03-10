import cors from "@fastify/cors"
import Fastify from "fastify"

import { getServerConfig } from "./config.js"
import { registerV1Routes } from "./routes/v1.js"

async function buildServer() {
  const config = getServerConfig()
  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: config.allowedOrigin || true,
  })

  app.get("/health", async () => ({
    ok: true,
    service: "imaan-server",
    timestampUtc: new Date().toISOString(),
  }))

  await registerV1Routes(app)

  return app
}

async function start() {
  const config = getServerConfig()
  const app = await buildServer()

  await app.listen({
    host: "0.0.0.0",
    port: config.port,
  })
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})
