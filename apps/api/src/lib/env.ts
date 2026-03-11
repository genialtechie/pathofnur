import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

function parseEnvFile(content: string): Array<[string, string]> {
  const entries: Array<[string, string]> = []

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    const [, key, rawValue] = match
    const value = rawValue
      .trim()
      .replace(/^['"]/, "")
      .replace(/['"]$/, "")

    entries.push([key, value])
  }

  return entries
}

function collectEnvFilePaths(startDirectory: string): string[] {
  const directories: string[] = []
  let current = startDirectory

  while (true) {
    directories.push(current)

    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }

  return directories
    .reverse()
    .flatMap((directory) => [
      path.join(directory, ".env"),
      path.join(directory, ".env.local"),
    ])
}

export function loadLocalEnv(startDirectory = process.cwd()): void {
  const preferProcessEnv = process.env.IMAAN_PREFER_PROCESS_ENV === "1"

  for (const filePath of collectEnvFilePaths(startDirectory)) {
    if (!existsSync(filePath)) continue

    const entries = parseEnvFile(readFileSync(filePath, "utf8"))
    for (const [key, value] of entries) {
      if (!preferProcessEnv || !process.env[key]) {
        process.env[key] = value
      }
    }
  }
}
