import {
  type RetrievedPassage,
  type RetrievalSourceType,
  RetrievePassagesResponseSchema,
  RetrievedPassageSchema,
} from "@imaan/contracts"
import { z } from "zod"

import { embedTexts } from "./embeddings.js"
import { getSupabaseAdminClient } from "./supabase.js"

const DEFAULT_MATCH_COUNT = 5
const CANDIDATE_MATCH_COUNT = 20
const LEXICAL_MATCH_LIMIT = 500
const MIN_RELEVANCE_SCORE = 0.5
const LEXICAL_STOPWORDS = new Set([
  "about",
  "another",
  "among",
  "before",
  "different",
  "does",
  "from",
  "islam",
  "islamic",
  "muslim",
  "other",
  "quran",
  "religion",
  "say",
  "says",
  "surah",
  "their",
  "they",
  "those",
  "until",
  "verse",
  "were",
  "with",
  "what",
])

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

const RetrievalPassageRowSchema = RetrievalMatchRowSchema.omit({
  similarity: true,
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

function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`)
}

function getLexicalNeedles(query: string): string[] {
  const normalized = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const words = normalized
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 5 && !LEXICAL_STOPWORDS.has(word))

  const variants = words.flatMap((word) => {
    const output = new Set([word])

    if (word.endsWith("ying") && word.length > 6) {
      output.add(`${word.slice(0, -4)}y`)
    }

    if (word.endsWith("ing") && word.length > 6) {
      output.add(word.slice(0, -3))
    }

    if (word.endsWith("ness") && word.length > 8) {
      output.add(word.slice(0, -4))
    }

    if (word.endsWith("ers") && word.length > 6) {
      output.add(word.slice(0, -1))
      output.add(`${word.slice(0, -3)}y`)
    }

    if (word.endsWith("er") && word.length > 5) {
      output.add(`${word.slice(0, -2)}y`)
    }

    if (word.endsWith("s") && word.length > 5) {
      output.add(word.slice(0, -1))
    }

    return Array.from(output)
  })

  return Array.from(new Set(variants.filter(Boolean))).slice(0, 10)
}

function getLexicalScore(
  row: z.infer<typeof RetrievalPassageRowSchema>,
  needles: string[]
): number {
  const haystack = [
    row.reference,
    row.citation_title,
    row.context_summary,
    row.english_translation,
    row.retrieval_text,
  ]
    .join(" ")
    .toLowerCase()
  const matched = needles.filter((needle) => haystack.includes(needle)).length

  if (matched === 0) {
    return 0
  }

  if (needles.length < 2) {
    return 0.35
  }

  return 0.4 + Math.min((matched / Math.max(needles.length, 1)) * 0.5, 0.5)
}

async function retrieveVectorMatches(input: {
  queryText: string
  matchCount: number
  sourceTypes?: RetrievalSourceType[]
}): Promise<RetrievedPassage[]> {
  const supabase = getSupabaseAdminClient()
  const [queryEmbedding] = await embedTexts([input.queryText], "query")

  if (!queryEmbedding?.length) {
    throw new Error("Query embedding generation returned no vector")
  }

  const { data, error } = await supabase.rpc("match_retrieval_passages", {
    query_embedding: toVectorLiteral(queryEmbedding),
    match_count: input.matchCount,
    filter_source_types: input.sourceTypes ?? null,
  })

  if (error) {
    throw new Error(`Failed to retrieve passages: ${error.message}`)
  }

  return ((data || []) as unknown[])
    .map((item) => RetrievalMatchRowSchema.parse(item))
    .map(toRetrievedPassage)
}

async function retrieveLexicalMatches(input: {
  queryText: string
  sourceTypes?: RetrievalSourceType[]
}): Promise<RetrievedPassage[]> {
  const needles = getLexicalNeedles(input.queryText)
  if (needles.length === 0) {
    return []
  }

  const supabase = getSupabaseAdminClient()
  const filters = needles.flatMap((needle) => {
    const pattern = `%${escapeLikePattern(needle)}%`
    return [
      `english_translation.ilike.${pattern}`,
      `retrieval_text.ilike.${pattern}`,
      `reference.ilike.${pattern}`,
    ]
  })
  let query = supabase
    .from("retrieval_passages")
    .select(
      [
        "id",
        "source_type",
        "reference",
        "citation_title",
        "arabic_text",
        "english_translation",
        "context_summary",
        "emotional_tags",
        "retrieval_text",
      ].join(",")
    )
    .or(filters.join(","))
    .limit(LEXICAL_MATCH_LIMIT)

  if (input.sourceTypes?.length) {
    query = query.in("source_type", input.sourceTypes)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to retrieve lexical passages: ${error.message}`)
  }

  return ((data || []) as unknown[])
    .map((item) => RetrievalPassageRowSchema.parse(item))
    .map((row) => ({ row, score: getLexicalScore(row, needles) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) =>
      toRetrievedPassage({
        ...item.row,
        similarity: item.score,
      })
    )
}

export async function retrievePassages(input: {
  inputText: string
  matchCount?: number
  sourceTypes?: RetrievalSourceType[]
}) {
  const matchCount = input.matchCount ?? DEFAULT_MATCH_COUNT
  const matchesByQuery = await Promise.all(
    [
      retrieveVectorMatches({
        queryText: input.inputText,
        matchCount: CANDIDATE_MATCH_COUNT,
        sourceTypes: input.sourceTypes,
      }),
      retrieveLexicalMatches({
        queryText: input.inputText,
        sourceTypes: input.sourceTypes,
      }),
    ]
  )
  const seen = new Set<string>()
  const matches = matchesByQuery
    .flat()
    .sort((left, right) => right.similarity - left.similarity)
    .filter((match) => match.similarity >= MIN_RELEVANCE_SCORE)
    .filter((match) => {
      if (seen.has(match.id)) {
        return false
      }
      seen.add(match.id)
      return true
    })

  return RetrievePassagesResponseSchema.parse({
    matches: matches.slice(0, input.matchCount ?? DEFAULT_MATCH_COUNT),
  })
}
