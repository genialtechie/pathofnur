import {
  RetrievalPassageSchema,
  SeededRetrievalPassageSchema,
  type RetrievalPassage,
  type SeededRetrievalPassage,
} from "@imaan/contracts"

export type ManualOverride = {
  contextSummary?: string
  emotionalTags?: string[]
}

export type ManualOverrides = Record<string, ManualOverride>

export const NormalizedRetrievalPassageSchema = RetrievalPassageSchema
export const EmbeddedRetrievalPassageSchema = SeededRetrievalPassageSchema

export type NormalizedRetrievalPassage = RetrievalPassage
export type EmbeddedRetrievalPassage = SeededRetrievalPassage

export type QuranChapterFile = Array<{
  id: number
  name: string
  transliteration: string
  translation: string
  type: string
  total_verses: number
  verses: Array<{
    id: number
    text: string
    translation: string
  }>
}>

export type HadithCollectionFile = {
  metadata: {
    english: {
      title: string
      author: string
      introduction: string
    }
  }
  hadiths: Array<{
    id: number
    idInBook: number
    chapterId: number
    bookId: number
    arabic: string
    english: {
      narrator?: string
      text: string
    }
  }>
}
