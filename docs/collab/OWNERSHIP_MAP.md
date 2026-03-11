# Ownership Map (Strict)

Version: 1.2.0

This map defines default path ownership lanes. Edits outside lane require a decision
record + reservation update by lead.

## Lead-Owned (Always)

- `AGENTS.md`
- `docs/collab/**`
- `.agents/instructions/**`
- `.github/**`
- workspace config roots (`package.json`, `package-lock.json`, `.gitignore`, `tsconfig.json`)
- app/package config manifests (`apps/*/package.json`, `apps/*/tsconfig*`, `apps/mobile/app.json`, `apps/mobile/babel.config.js`, `packages/*/package.json`, `packages/*/tsconfig*`)
- shared navigation roots (`apps/mobile/app/_layout.*`, `apps/mobile/app/(tabs)/_layout.*`)
- `packages/contracts/**`
- root checkout orchestration + merges

## Codex Lane

- `apps/mobile/app/(tabs)/**`
- `apps/mobile/src/components/navigation/**`
- `apps/mobile/src/features/onboarding/**`
- `apps/mobile/src/lib/auth/**`
- `apps/mobile/src/lib/session/**`

## OpenCode Lane

- `apps/mobile/src/lib/analytics/**`
- `apps/mobile/src/types/analytics/**`
- `apps/mobile/src/features/home/**`
- `apps/mobile/src/features/library/**`
- `apps/mobile/src/lib/backend/**`
- `apps/api/**`

## Claude Lane

- `apps/mobile/app/(onboarding)/**`
- `apps/mobile/app/donate/**`
- `apps/mobile/src/features/donate/**`
- `apps/mobile/src/features/tools/**`
- `apps/mobile/src/features/journey/**`

## Cursor Lane

- `apps/mobile/src/components/cards/**`
- `apps/mobile/src/components/hero/**`
- `apps/mobile/src/components/ui/**`
- `apps/mobile/src/theme/**`
- `apps/mobile/public/images/**` (only when explicitly assigned)
- `apps/landing/**`

## Shared/Hotspot Files (Lead Gated)

- `apps/mobile/app/_layout.*`
- `apps/mobile/app/(tabs)/_layout.*`
- `apps/mobile/src/types/**`
- `apps/mobile/src/lib/analytics/events.ts` (schema changes)
- `packages/contracts/**` (cross-runtime contracts and schemas)
- `apps/mobile/public/asset-manifest*.json`

## Rule

If a task touches more than one lane, split it into subtasks unless lead records an
exception in `docs/collab/state/decisions.json`.
