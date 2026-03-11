# imaan server

This package is the backend runtime target for `Azure Container Apps`.

Responsibilities:

- intervention orchestration
- Supabase-backed data access
- OpenRouter model calls
- follow-up scheduling and worker jobs
- push token registration
- local corpus preparation and seeding scripts

This scaffold intentionally stops at typed routes and runtime boundaries. It does not yet implement real intervention logic or ingestion pipelines.

## Expected environment variables

- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `ALLOWED_ORIGIN`
- `EMBEDDING_PROVIDER`
- `EMBEDDING_API_KEY`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`
- `EMBEDDING_BASE_URL`

Current alias support also accepts:

- `SUPABASE_PROJECT_URL` for `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_PUBLISHABLE_KEY` for `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY` for `EMBEDDING_API_KEY`
- `OPENROUTER_API_KEY` for `EMBEDDING_API_KEY` when `EMBEDDING_PROVIDER=openai_compatible`

For local development, the api package loads the nearest repo `.env` files automatically. Set
`IMAAN_PREFER_PROCESS_ENV=1` if you need exported shell variables to win over repo-local `.env`
values.

The default live retrieval path assumes `EMBEDDING_PROVIDER=openai_compatible` and falls back to
`https://openrouter.ai/api/v1` when no explicit `EMBEDDING_BASE_URL` is set.

## Run locally

```bash
npm install
npm run dev
```

## Azure target

Recommended deployment shape:

- API container app
- worker container app
- scheduled jobs for ingestion/follow-ups

## Corpus flow

The retrieval corpus stays lean:

- local source JSON in `apps/api/corpus/source`
- local preparation scripts turn that into runtime-ready retrieval rows
- embeddings are generated before seed
- Supabase stores one runtime table: `retrieval_passages`

Commands:

```bash
npm run corpus:download
npm run corpus:prepare
npm run corpus:seed
```

For a controlled first pass, `corpus:prepare` also accepts:

- `--quran-limit <n>`
- `--hadith-limit <n>`
- `--hadith-collections bukhari,muslim`

The provided SQL migration uses `vector(768)`. If you change `EMBEDDING_DIMENSIONS`, update
`apps/api/sql/retrieval_passages.sql` to match before seeding.

## Retrieval route

`POST /v1/retrieve`

Request shape:

```json
{
  "inputText": "fear before a difficult conversation",
  "matchCount": 5,
  "sourceTypes": ["quran", "hadith"]
}
```

The route embeds the query, calls `match_retrieval_passages`, and returns citation-ready matches.

See `apps/api/corpus/README.md` and `apps/api/sql/retrieval_passages.sql`.
