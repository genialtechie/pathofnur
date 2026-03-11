import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import {
  type RetrievalSourceType,
} from "../../../shared/imaan-contracts.js"
import {
  EmbeddedRetrievalPassageSchema,
  NormalizedRetrievalPassageSchema,
  type EmbeddedRetrievalPassage,
  type HadithCollectionFile,
  type ManualOverrides,
  type NormalizedRetrievalPassage,
  type QuranChapterFile,
} from "./types.js"

type HadithCollectionConfig = {
  slug: string
  citationTitle: string
}

const DEFAULT_HADITH_COLLECTIONS: HadithCollectionConfig[] = [
  { slug: "bukhari", citationTitle: "Sahih al-Bukhari" },
  { slug: "muslim", citationTitle: "Sahih Muslim" },
]

function cleanText(value: string | undefined | null): string {
  return (value || "").replace(/\s+/g, " ").trim()
}

function buildRetrievalText(passage: NormalizedRetrievalPassage): string {
  const parts = [
    passage.citationTitle,
    passage.reference,
    passage.contextSummary,
    passage.englishTranslation,
    passage.emotionalTags.join(", "),
  ]

  return cleanText(parts.filter(Boolean).join(" "))
}

function applyOverride(
  passage: Omit<NormalizedRetrievalPassage, "retrievalText">,
  overrides: ManualOverrides
): NormalizedRetrievalPassage {
  const override = overrides[passage.id]
  const next: NormalizedRetrievalPassage = {
    ...passage,
    contextSummary:
      cleanText(override?.contextSummary) || passage.contextSummary,
    emotionalTags:
      override?.emotionalTags?.map(cleanText).filter(Boolean) ||
      passage.emotionalTags,
    retrievalText: "",
  }

  next.retrievalText = buildRetrievalText(next)
  return NormalizedRetrievalPassageSchema.parse(next)
}

export async function loadOverrides(
  filePath: string | null
): Promise<ManualOverrides> {
  if (!filePath) return {}

  try {
    const raw = await readFile(filePath, "utf8")
    return JSON.parse(raw) as ManualOverrides
  } catch (error) {
    const notFound =
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"

    if (notFound) return {}
    throw error
  }
}

export async function loadQuranPassages(
  filePath: string,
  overrides: ManualOverrides
): Promise<NormalizedRetrievalPassage[]> {
  const raw = await readFile(filePath, "utf8")
  const chapters = JSON.parse(raw) as QuranChapterFile

  return chapters.flatMap((chapter) =>
    chapter.verses.map((verse) =>
      applyOverride(
        {
          id: `quran:${chapter.id}:${verse.id}`,
          sourceType: "quran",
          reference: `Surah ${chapter.transliteration} ${chapter.id}:${verse.id}`,
          citationTitle: `Surah ${chapter.transliteration}`,
          arabicText: cleanText(verse.text),
          englishTranslation: cleanText(verse.translation),
          contextSummary: `Verse from Surah ${chapter.transliteration} (${chapter.translation}).`,
          emotionalTags: [],
        },
        overrides
      )
    )
  )
}

async function loadHadithCollectionPassages(
  filePath: string,
  collection: HadithCollectionConfig,
  overrides: ManualOverrides
): Promise<NormalizedRetrievalPassage[]> {
  const raw = await readFile(filePath, "utf8")
  const book = JSON.parse(raw) as HadithCollectionFile

  return book.hadiths.flatMap((hadith) => {
    const narrator = cleanText(hadith.english.narrator)
    const translation = cleanText(
      narrator
        ? `${narrator} ${hadith.english.text}`
        : hadith.english.text
    )

    if (!translation) {
      return []
    }

    return [
      applyOverride(
        {
          id: `hadith:${collection.slug}:${hadith.idInBook}`,
          sourceType: "hadith",
          reference: `${collection.citationTitle} ${hadith.idInBook}`,
          citationTitle: collection.citationTitle,
          arabicText: cleanText(hadith.arabic),
          englishTranslation: translation,
          contextSummary: `Hadith from ${collection.citationTitle}.`,
          emotionalTags: [],
        },
        overrides
      ),
    ]
  })
}

export async function loadHadithPassages(
  hadithDirectory: string,
  overrides: ManualOverrides,
  collectionSlugs?: string[]
): Promise<NormalizedRetrievalPassage[]> {
  const collections = DEFAULT_HADITH_COLLECTIONS.filter(
    (collection) =>
      !collectionSlugs?.length || collectionSlugs.includes(collection.slug)
  )

  const rows = await Promise.all(
    collections.map((collection) =>
      loadHadithCollectionPassages(
        path.join(hadithDirectory, `${collection.slug}.json`),
        collection,
        overrides
      )
    )
  )

  return rows.flat()
}

export async function writeEmbeddedPassages(
  filePath: string,
  passages: EmbeddedRetrievalPassage[]
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(passages, null, 2))
}

export async function readEmbeddedPassages(
  filePath: string
): Promise<EmbeddedRetrievalPassage[]> {
  const raw = await readFile(filePath, "utf8")
  const parsed = JSON.parse(raw) as unknown[]
  return parsed.map((item) => EmbeddedRetrievalPassageSchema.parse(item))
}

export function buildDefaultOutputPath(serverRoot: string): string {
  return path.join(serverRoot, ".generated", "corpus", "retrieval-passages.json")
}

export function getSourceTypeCounts(
  passages: Array<{ sourceType: RetrievalSourceType }>
): Record<RetrievalSourceType, number> {
  return passages.reduce(
    (accumulator, passage) => {
      accumulator[passage.sourceType] += 1
      return accumulator
    },
    { quran: 0, hadith: 0 } as Record<RetrievalSourceType, number>
  )
}
