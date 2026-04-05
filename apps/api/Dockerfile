FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN npm ci --workspace @imaan/contracts --workspace @imaan/api --include-workspace-root=false

FROM deps AS build

COPY apps/api apps/api
COPY packages/contracts packages/contracts

RUN npm run api:build

FROM node:22-bookworm-slim AS runtime-deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN npm ci --omit=dev --workspace @imaan/contracts --workspace @imaan/api --include-workspace-root=false

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=runtime-deps /app/node_modules ./node_modules
COPY --from=runtime-deps /app/package.json ./package.json
COPY --from=runtime-deps /app/package-lock.json ./package-lock.json
COPY --from=runtime-deps /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/contracts/package.runtime.json ./packages/contracts/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist

EXPOSE 3001

WORKDIR /app/apps/api

CMD ["node", "dist/index.js"]
