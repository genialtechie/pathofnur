import {
  type RetrievedPassage,
  type RetrievalSourceType,
  RetrievePassagesResponseSchema,
  RetrievedPassageSchema,
} from "./contracts.js"
import { z } from "zod"

import { embedTexts } from "./embeddings.js"
import { getSupabaseAdminClient } from "./supabase.js"

const DEFAULT_MATCH_COUNT = 5

const RetrievalMatchRowSchema = z.object({
  id: z.string().min(1),
  source_type: z.enum(["quran", "hadith"]),
  reference: z.string().min(1),
  citation_title: z.string().min(1),
  arabic_text: z.string().min(1),
  english_translation: z.string().min(1),
  context_summary: z.string().min(1),
  emotional_tags: z.array(z.string()),
  retrieval_text: z.string().min(1),
  similarity: z.number(),
})

function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`
}

function toRetrievedPassage(
  row: z.infer<typeof RetrievalMatchRowSchema>
): RetrievedPassage {
  return RetrievedPassageSchema.parse({
    id: row.id,
    sourceType: row.source_type,
    title: row.citation_title,
    reference: row.reference,
    excerpt: row.english_translation,
    arabicText: row.arabic_text,
    englishTranslation: row.english_translation,
    contextSummary: row.context_summary,
    emotionalTags: row.emotional_tags.filter(Boolean),
    similarity: row.similarity,
  })
}

export async function retrievePassages(input: {
  inputText: string
  matchCount?: number
  sourceTypes?: RetrievalSourceType[]
}) {
  const supabase = getSupabaseAdminClient()
  const [queryEmbedding] = await embedTexts([input.inputText], "query")

  if (!queryEmbedding?.length) {
    throw new Error("Query embedding generation returned no vector")
  }

  const { data, error } = await supabase.rpc("match_retrieval_passages", {
    query_embedding: toVectorLiteral(queryEmbedding),
    match_count: input.matchCount ?? DEFAULT_MATCH_COUNT,
    filter_source_types: input.sourceTypes ?? null,
  })

  if (error) {
    throw new Error(`Failed to retrieve passages: ${error.message}`)
  }

  const rows: Array<z.infer<typeof RetrievalMatchRowSchema>> = (data || []).map(
    (item: unknown) =>
    RetrievalMatchRowSchema.parse(item)
  )

  const matches = rows
    .sort((left, right) => right.similarity - left.similarity)
    .map(toRetrievedPassage)

  return RetrievePassagesResponseSchema.parse({
    matches,
  })
}
