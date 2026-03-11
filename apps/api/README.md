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
npm run corpus:prepare
npm run corpus:seed
```

The provided SQL migration uses `vector(768)`. If you change `EMBEDDING_DIMENSIONS`, update
`apps/api/sql/retrieval_passages.sql` to match before seeding.

See `apps/api/corpus/README.md` and `apps/api/sql/retrieval_passages.sql`.
