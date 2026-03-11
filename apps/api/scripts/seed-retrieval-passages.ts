import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  buildDefaultOutputPath,
  readEmbeddedPassages,
} from "../src/corpus/retrieval-passages.js"
import { upsertRetrievalPassages } from "../src/lib/retrieval-passages.js"

function getArg(name: string): string | null {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const inputFile = getArg("--input") || buildDefaultOutputPath(serverRoot)

async function main() {
  const passages = await readEmbeddedPassages(inputFile)
  await upsertRetrievalPassages(passages)

  console.log(
    JSON.stringify(
      {
        inputFile,
        totalSeeded: passages.length,
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
