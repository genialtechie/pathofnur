import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { buildOgCard } from "./og-components.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

await mkdir(publicDir, { recursive: true });

const svgContent = buildOgCard();
await writeFile(path.join(publicDir, "og-image.svg"), svgContent, "utf8");

await sharp(Buffer.from(svgContent))
  .resize(1200, 630)
  .png()
  .toFile(path.join(publicDir, "og-image.png"));
