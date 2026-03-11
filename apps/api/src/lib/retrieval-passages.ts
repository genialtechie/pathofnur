import type { SeededRetrievalPassage } from "@imaan/contracts"

import { getSupabaseAdminClient } from "./supabase.js"

const TABLE_NAME = "retrieval_passages"

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size))
  }
  return output
}

function toDbRow(passage: SeededRetrievalPassage) {
  return {
    id: passage.id,
    source_type: passage.sourceType,
    reference: passage.reference,
    citation_title: passage.citationTitle,
    arabic_text: passage.arabicText,
    english_translation: passage.englishTranslation,
    context_summary: passage.contextSummary,
    emotional_tags: passage.emotionalTags,
    retrieval_text: passage.retrievalText,
    embedding: passage.embedding,
  }
}

export async function upsertRetrievalPassages(
  passages: SeededRetrievalPassage[]
): Promise<void> {
  const supabase = getSupabaseAdminClient()

  for (const batch of chunk(passages, 200)) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(batch.map(toDbRow), { onConflict: "id" })

    if (error) {
      throw new Error(`Failed to upsert retrieval passages: ${error.message}`)
    }
  }
}
