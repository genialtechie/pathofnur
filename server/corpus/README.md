# Corpus source layout

Put local source files here before running the scripts.

Expected layout:

```txt
server/corpus/source/
  quran_en.json
  hadith/
    bukhari.json
    muslim.json
  overrides.json
```

Notes:

- `quran_en.json` should come from `quran-json` and already includes Arabic plus English verse translations.
- Hadith files should come from `AhmedBaset/hadith-json`.
- Because the chosen hadith dataset does not include per-hadith grade metadata, the scripts only seed explicitly whitelisted collections by default: `bukhari` and `muslim`.
- `overrides.json` is optional. Use it to add manual `contextSummary` and `emotionalTags` by passage id.
- The default SQL schema assumes 768-dimensional embeddings. Keep `EMBEDDING_DIMENSIONS=768` unless you also update `server/sql/retrieval_passages.sql`.

Example override entry:

```json
{
  "quran:20:25": {
    "contextSummary": "Musa asks Allah for calm, clarity, and ease before confronting Pharaoh.",
    "emotionalTags": ["anxiety", "public speaking", "fear", "overwhelm"]
  }
}
```
