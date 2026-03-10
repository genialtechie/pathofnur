# imaan server

This package is the backend runtime target for `Azure Container Apps`.

Responsibilities:

- intervention orchestration
- Supabase-backed data access
- OpenRouter model calls
- follow-up scheduling and worker jobs
- push token registration

This scaffold intentionally stops at typed routes and runtime boundaries. It does not yet implement real intervention logic or ingestion pipelines.

## Expected environment variables

- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `ALLOWED_ORIGIN`

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
