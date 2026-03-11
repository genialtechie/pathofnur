import { getServerConfig, requireServerSecret } from "../config.js"

type EmbeddingTask = "document" | "query"

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size))
  }
  return output
}

async function embedWithGoogle(
  texts: string[],
  task: EmbeddingTask
): Promise<number[][]> {
  const config = getServerConfig()
  const apiKey = requireServerSecret("embeddingApiKey")
  const model = config.embeddingModel.startsWith("models/")
    ? config.embeddingModel
    : `models/${config.embeddingModel}`
  const endpoint = `${config.embeddingBaseUrl}/${model}:batchEmbedContents?key=${apiKey}`

  const batches = chunk(texts, 50)
  const vectors: number[][] = []

  for (const batch of batches) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: batch.map((text) => ({
          model,
          content: {
            parts: [{ text }],
          },
          taskType: task === "document" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY",
          outputDimensionality: config.embeddingDimensions,
        })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Google embedding request failed (${response.status}): ${errorText}`
      )
    }

    const payload = (await response.json()) as {
      embeddings?: Array<{ values?: number[] }>
    }

    for (const item of payload.embeddings || []) {
      if (!item.values?.length) {
        throw new Error("Google embedding response was missing vector values")
      }
      vectors.push(item.values)
    }
  }

  return vectors
}

async function embedWithOpenAiCompatible(
  texts: string[],
  task: EmbeddingTask
): Promise<number[][]> {
  const config = getServerConfig()
  const apiKey = requireServerSecret("embeddingApiKey")
  const endpoint = `${config.embeddingBaseUrl}/embeddings`
  const batches = chunk(texts, 100)
  const vectors: number[][] = []

  for (const batch of batches) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.embeddingModel,
        input: batch,
        dimensions: config.embeddingDimensions,
        encoding_format: "float",
        user: `imaan-${task}`,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Embedding request failed (${response.status}): ${errorText}`
      )
    }

    const payload = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>
    }

    for (const item of payload.data || []) {
      if (!item.embedding?.length) {
        throw new Error("Embedding response was missing vector values")
      }
      vectors.push(item.embedding)
    }
  }

  return vectors
}

export async function embedTexts(
  texts: string[],
  task: EmbeddingTask
): Promise<number[][]> {
  const config = getServerConfig()

  if (config.embeddingProvider === "openai_compatible") {
    return embedWithOpenAiCompatible(texts, task)
  }

  return embedWithGoogle(texts, task)
}
