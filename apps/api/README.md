# imaan server

This package is the backend runtime target for `Azure Container Apps`.

Responsibilities:

- explicit moment chat orchestration
- Supabase-backed data access
- OpenRouter model calls
- local corpus preparation and seeding scripts

The shipping v1 backend is intentionally narrow: authenticated users create a moment, chat inside
that thread, reopen it later, and mark it resolved. Retrieval is not a default step; it is only used
when a user explicitly asks for Islamic source grounding.

## Expected environment variables

- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IMAAN_DEV_AUTH_BYPASS`
- `IMAAN_DEV_AUTH_BYPASS_TOKEN`
- `IMAAN_DEV_AUTH_BYPASS_USER_ID`
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

Use `apps/api/.env.example` as the shape for your local env file or exported shell variables before running the commands below.

## Local development

```bash
npm install
npm run dev
```

## Development bearer-token bypass

For local UI work before real auth is wired, the API can accept one explicit dev bearer token and
map it to one fixed actor id.

Server env:

- `IMAAN_DEV_AUTH_BYPASS=1`
- `IMAAN_DEV_AUTH_BYPASS_TOKEN=<local-dev-token>`
- `IMAAN_DEV_AUTH_BYPASS_USER_ID=<fixed-random-uuid>`

Behavior:

- the bypass is disabled by default
- the request still must send `Authorization: Bearer <token>`
- only the configured token is accepted by the bypass
- all persisted moments, messages, and artifacts resolve to the configured fixed actor id
- any other bearer token still goes through normal Supabase auth

Mobile local env:

- `EXPO_PUBLIC_IMAAN_USE_DEV_BEARER_TOKEN=1`
- `EXPO_PUBLIC_IMAAN_DEV_BEARER_TOKEN=<same-local-dev-token>`
- `EXPO_PUBLIC_IMAAN_DEV_ACTOR_ID=<same-fixed-random-uuid>`

Important:

- do not commit real values for any of these variables
- keep the bypass off in shared and production environments
- `EXPO_PUBLIC_*` values are bundled into the client and must be treated as non-secret convenience
  values only
- use `apps/mobile/.env.example` and `apps/api/.env.example` as the shape for local untracked env
  files

## Production build and run

From the monorepo root:

```bash
npm run contracts:build
npm run api:build
npm run api:start
```

The production start path is `node dist/index.js`. `tsx` is now development-only and is not required
inside the deployment image.

## Docker build

Build from the monorepo root so the API can include the shared contracts workspace:

```bash
docker build -f apps/api/Dockerfile -t imaan-api:local .
```

Run the image locally:

```bash
docker run --rm \
  --env-file <path-to-your-api-env-file> \
  -p 3001:3001 \
  imaan-api:local
```

Smoke test:

```bash
curl http://127.0.0.1:3001/health
```

The container does not run Supabase migrations, retrieval corpus preparation, or retrieval seeding on boot.

## Azure target

`apps/api` is deployed from monorepo root context. The checked-in deploy path is a Docker image built
with `az acr build` and deployed to one Azure Container App.

Prerequisites:

- `az login`
- the Azure CLI plus the `containerapp` extension
- an Azure subscription that can create ACR and Container Apps resources
- all required runtime env vars exported in your shell
- a globally unique `AZURE_ACR_NAME`
- Supabase migrations already applied
- retrieval corpus already seeded into `retrieval_passages` if source-grounded replies are enabled
- an `OPENROUTER_MODEL` that supports `json_schema` structured outputs for moment chat replies

Deployment command:

```bash
bash apps/api/deploy/azure-container-app.sh
```

On a fresh subscription the first run may take a few minutes because the script registers the
required `Microsoft.App`, `Microsoft.OperationalInsights`, and `Microsoft.ContainerRegistry`
providers before creating resources.

Default resource names are:

- resource group: `imaan-api-rg`
- container apps environment: `imaan-api-env`
- container app: `imaan-api`
- image repository: `imaan-api`

Override them with the `AZURE_*` variables in `apps/api/.env.example`.

After deployment, verify the public health route:

```bash
curl "https://<container-app-fqdn>/health"
```

Recommended v1 deployment shape:

- one API container app

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

## Moment routes

All moment routes require:

- `Authorization: Bearer <supabase_access_token>`

`POST /v1/moments`

Creates a moment and stores the first user/assistant exchange.

Request shape:

```json
{
  "text": "I am terrified of failing my interview tomorrow",
  "locale": "en",
  "entrySource": "home"
}
```

`GET /v1/moments`

Lists saved moments for the authenticated user in reverse `updated_at` order.

Query parameters:

- `limit` optional, max `100`
- `status` optional, `open` or `resolved`

`GET /v1/moments/:id`

Returns the moment, ordered messages, and saved artifacts for the authenticated user.

`POST /v1/moments/:id/messages`

Appends one user message and one assistant response to an existing moment. If the user asks for a
Quran, hadith, dua, ruling, citation, or source, the server attempts retrieval and stores returned
source support as artifacts. Normal conversation does not retrieve by default.

Request shape:

```json
{
  "text": "Can you ground that in Quran or hadith?",
  "locale": "en",
  "entrySource": "moment_detail"
}
```

`POST /v1/moments/:id/resolve`

Marks the authenticated user's moment resolved and stamps `resolved_at`.

Routes return `404` when the moment does not belong to the authenticated actor or does not exist.

See `apps/api/corpus/README.md` and `apps/api/sql/retrieval_passages.sql`.
