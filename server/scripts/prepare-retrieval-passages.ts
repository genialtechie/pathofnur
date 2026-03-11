import path from "node:path"
import { fileURLToPath } from "node:url"

import type { SeededRetrievalPassage } from "../../shared/imaan-contracts.js"

import {
  buildDefaultOutputPath,
  getSourceTypeCounts,
  loadHadithPassages,
  loadOverrides,
  loadQuranPassages,
  writeEmbeddedPassages,
} from "../src/corpus/retrieval-passages.js"
import { embedTexts } from "../src/lib/embeddings.js"

function getArg(name: string): string | null {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourceRoot = path.join(serverRoot, "corpus", "source")
const quranFile = getArg("--quran-file") || path.join(sourceRoot, "quran_en.json")
const hadithDirectory =
  getArg("--hadith-dir") || path.join(sourceRoot, "hadith")
const overridesFile =
  getArg("--overrides") || path.join(sourceRoot, "overrides.json")
const outputFile = getArg("--output") || buildDefaultOutputPath(serverRoot)
const hadithCollections =
  getArg("--hadith-collections")?.split(",").map((value) => value.trim()) || []

async function main() {
  const overrides = await loadOverrides(overridesFile)
  const quran = await loadQuranPassages(quranFile, overrides)
  const hadith = await loadHadithPassages(
    hadithDirectory,
    overrides,
    hadithCollections
  )
  const all = [...quran, ...hadith]
  const vectors = await embedTexts(
    all.map((passage) => passage.retrievalText),
    "document"
  )

  if (vectors.length !== all.length) {
    throw new Error(
      `Expected ${all.length} embeddings but received ${vectors.length}`
    )
  }

  const seeded: SeededRetrievalPassage[] = all.map((passage, index) => ({
    ...passage,
    embedding: vectors[index],
  }))

  await writeEmbeddedPassages(outputFile, seeded)

  console.log(
    JSON.stringify(
      {
        outputFile,
        total: seeded.length,
        counts: getSourceTypeCounts(seeded),
      },
      null,
      2
    )
  )
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
