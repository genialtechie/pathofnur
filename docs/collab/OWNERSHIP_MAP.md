# Ownership Map (Strict)

Version: 1.2.0

This map defines default path ownership lanes. Edits outside lane require a decision
record + reservation update by lead.

## Lead-Owned (Always)

- `AGENTS.md`
- `docs/collab/**`
- `.agents/instructions/**`
- `.github/**`
- shared config roots (`package.json`, `app.json`, `tsconfig*`, root lockfiles)
- shared navigation roots (`app/_layout.*`, `app/(tabs)/_layout.*`)
- `shared/**`
- root checkout orchestration + merges

## Codex Lane

- `app/(tabs)/**`
- `src/components/navigation/**`
- `src/features/onboarding/**`
- `src/lib/auth/**`
- `src/lib/session/**`

## OpenCode Lane

- `src/lib/analytics/**`
- `src/types/analytics/**`
- `src/features/home/**`
- `src/features/library/**`
- `src/lib/backend/**`
- `server/**`

## Claude Lane

- `app/(onboarding)/**`
- `app/donate/**`
- `src/features/donate/**`
- `src/features/tools/**`
- `src/features/journey/**`

## Cursor Lane

- `src/components/cards/**`
- `src/components/hero/**`
- `src/components/ui/**`
- `src/theme/**`
- `public/images/**` (only when explicitly assigned)

## Shared/Hotspot Files (Lead Gated)

- `app/_layout.*`
- `app/(tabs)/_layout.*`
- `src/types/**`
- `src/lib/analytics/events.ts` (schema changes)
- `shared/**` (cross-runtime contracts and schemas)
- `public/asset-manifest*.json`

## Rule

If a task touches more than one lane, split it into subtasks unless lead records an
exception in `docs/collab/state/decisions.json`.
