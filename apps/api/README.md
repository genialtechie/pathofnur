# imaan server

This package is the backend runtime target for `Azure Container Apps`.

Responsibilities:

- intervention orchestration
- Supabase-backed data access
- OpenRouter model calls
- follow-up scheduling and worker jobs
- push token registration
- local corpus preparation and seeding scripts

The backend now supports live corpus retrieval plus authenticated intervention and ledger persistence.
Follow-up workflows, device registration, and admin/corpus operations are still unfinished.

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
- `SUPABASE_SECRET_KEY` for `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY` for `EMBEDDING_API_KEY`
- `OPENROUTER_API_KEY` for `EMBEDDING_API_KEY` when `EMBEDDING_PROVIDER=openai_compatible`

For local development, the api package loads parent `.env` files from farthest to nearest, so the
nearest package-local `.env` and `.env.local` override broader repo-level files. Set
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

## Intervention route

`POST /v1/interventions`

Authorization:

- `Authorization: Bearer <supabase_access_token>` required

Request shape:

```json
{
  "inputText": "I am terrified of failing my interview tomorrow"
}
```

Behavior:

- classifies the request into a first-pass intervention type
- retrieves the top supporting passages from Supabase
- uses OpenRouter to format a structured response
- fails with an upstream retrieval error if embeddings, corpus lookup, or Supabase retrieval break
- fails with an upstream generation error if OpenRouter is unavailable or returns invalid structured output
- persists the intervention and ledger entry together in Supabase scoped to the authenticated user before returning success

`GET /v1/ledger`

Authorization:

- `Authorization: Bearer <supabase_access_token>` required

Query parameters:

- `cursor` optional
- `limit` optional, max `50`

The ledger route returns persisted entries for the authenticated user in reverse chronological order.

See `apps/api/corpus/README.md` and `apps/api/sql/retrieval_passages.sql`.
