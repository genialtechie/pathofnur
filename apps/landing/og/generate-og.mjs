import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildOgCard } from "./og-components.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, "og-image.svg"), buildOgCard(), "utf8");
