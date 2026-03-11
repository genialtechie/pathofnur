import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE_ROOT = path.join(API_ROOT, "corpus", "source")
const HADITH_ROOT = path.join(SOURCE_ROOT, "hadith")

const DEFAULT_FILES = [
  {
    url: "https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran_en.json",
    outputPath: path.join(SOURCE_ROOT, "quran_en.json"),
  },
  {
    url: "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/bukhari.json",
    outputPath: path.join(HADITH_ROOT, "bukhari.json"),
  },
  {
    url: "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/muslim.json",
    outputPath: path.join(HADITH_ROOT, "muslim.json"),
  },
]

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`)
  }

  const content = await response.text()
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, content, "utf8")
}

async function main() {
  for (const file of DEFAULT_FILES) {
    await downloadFile(file.url, file.outputPath)
  }

  console.log(
    JSON.stringify(
      {
        sourceRoot: SOURCE_ROOT,
        downloadedFiles: DEFAULT_FILES.map((file) => file.outputPath),
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
