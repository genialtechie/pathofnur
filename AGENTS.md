# imaan.app - Product + Build Guide

Last updated: March 10, 2026

## 1) Mission

Build the best Muslim companion app for moments of friction, remembrance, and grounded return.

The app is no longer a passive prayer utility dashboard. It is a native-first intervention product that:

- meets the user at a real emotional or practical need
- responds with grounded Islamic support
- remembers the user over time
- follows up like a thoughtful companion, not a notification machine

This document is the operating manual for all agents working in this repo.

## 1.1) Source of Truth

Primary product source of truth:

- `imaan_prd.md`
- `blueprint.md` for active brand positioning and messaging

Collaboration source of truth:

- `docs/collab/CORE_PROTOCOL.md`
- `docs/collab/WORKTREE_QUICKSTART.md`
- `docs/collab/OWNERSHIP_MAP.md`
- `docs/collab/MERGE_RULES.md`
- `docs/collab/state/task_queue.json`
- `docs/collab/state/reservations.json`
- `docs/collab/state/handoffs.json`
- `docs/collab/state/decisions.json`
- `.agents/instructions/*.md`

Mandatory execution rule:

- Implementers execute code changes only from task worktrees (`.worktrees/<task_id>`).
- Root checkout is orchestration + merge surface only.

Legacy note:

- Old `Path of Nur` copy, donation-first flows, Ramadan streak assumptions, and PWA-first implementation notes are now legacy context only.
- Do not extend legacy roadmap behavior without an explicit new task or decision record.
- Historical references may still exist in code, assets, and collaboration records; treat them as migration residue, not direction.

## 2) Product Definition

Core primitive:

- `User Friction`

The app should interpret a moment of friction and respond with one of three intervention types:

1. `Contextual Anchor`
2. `Quick Validation`
3. `Concise Ruling`

The app should feel like:

- knowledgeable
- calm
- zero-judgment
- grounded in verified Islamic sources

The app should not feel like:

- a generic productivity tracker
- a content catalog pretending to be a companion
- an LLM chat toy with vague spiritual flavor

## 3) Product IA

Native-first top-level navigation:

1. `Home` - the intervention transaction
2. `Ledger & Journey` - the memory
3. `Profile` - settings and secondary utilities

Current repo note:

- Existing `Library`, `Tools`, and `Journey` surfaces are transitional and should be treated as refactor targets, not long-term IA commitments.

## 4) Backend + Storage Direction

System baseline:

- `Supabase` for auth, Postgres, storage, and vectors
- `Azure Container Apps` for the app server and workers
- `OpenRouter` for model access
- `PostHog` for product analytics

Hard rules:

- The mobile app must never call model providers directly.
- `OpenRouter` is server-side only.
- `AsyncStorage` is cache-only and offline-resilience-only, not source of truth.
- User memory is account-backed.
- Intervention history, ledger entries, follow-ups, and citations are cloud-backed.
- Curated source material must be stored and retrieved as app-owned data, not improvised at runtime.

## 5) UX Principles

Product feel:

- calm
- sacred
- premium
- deliberate

Interaction rules:

- one primary goal per screen
- one primary CTA per view
- value before permission asks
- no guilt-based copy
- no dashboard clutter where the product should feel intimate

The app should optimize for:

1. trust
2. clarity
3. emotional usefulness
4. fast resolution
5. memory continuity

## 5.2) Quality Bar (Hard)

Default assumption for all work in this repo:

- build to production standard unless the human explicitly approves a temporary shortcut
- do not ship placeholder logic, fake fallback behavior, deprecation scaffolding, legacy bridges, or "MVP" scaffolding that weakens trust, correctness, or long-term maintainability
- if a dependency failure should make a feature unavailable, fail clearly instead of fabricating degraded behavior
- temporary code is only acceptable when it is explicitly labeled, isolated, and approved as transitional
- if you change the schema or semantics of `docs/collab/state/*.json`, update `scripts/validate_collab_state.py` and the relevant collaboration docs in the same change; state-shape drift is not allowed

Rule of thumb:

- if you would be uncomfortable defending the implementation six months from now, do not land it without explicit approval

## 5.1) Typography Policy (Non-Negotiable)

App font system:

- `Zalando Sans` is the default app font for UI surfaces
- `Lora` is restricted to scripture and intentionally long-form devotional text
- `Playfair Display` is restricted to rare decorative accents
- `Amiri` is restricted to Arabic script content

Implementation rules:

- Do not hardcode font family literals in feature screens.
- Use `src/components/navigation/typography.ts` tokens.
- Any use of `scripture*` or `accentDisplay` outside allowed contexts is a policy violation.
- Run `npm run check:typography` before merge for UI work.

## 6) Analytics Principles

Instrumentation starts before polish.

Event naming convention:

- `area_object_action`

Required properties:

- `user_id`
- `session_id`
- `timestamp_utc`
- `screen_name`
- `entry_source`
- `platform`
- `app_version`

Current analytics note:

- Existing analytics schemas still reflect legacy `Journey`, `Tools`, `Library`, and donation flows.
- Do not deepen those legacy semantics.
- New work should move toward intervention, ledger, follow-up, auth, and profile semantics.

## 7) Technical Direction

Platform:

- Expo native app
- TypeScript strict mode
- Expo Router

Backend packages in this repo:

- mobile app in `apps/mobile`
- app server in `apps/api`
- shared cross-runtime contracts in `packages/contracts`

Preferred runtime behavior:

- typed API contracts
- server-owned orchestration
- local optimistic UI where useful
- offline-safe action replay for lightweight client actions

## 8) Immediate Execution Priorities

1. Re-baseline the repo around `imaan_prd.md`
2. Stand up backend contracts and server scaffold
3. Implement onboarding account creation
4. Replace the Home dashboard with the intervention transaction flow
5. Replace Journey with the memory-led `Ledger & Journey` surface
6. Move Tasbih and Qibla into Profile as secondary utilities
7. Build curated source ingestion and embedding workflows

## 9) Agent Rule of Thumb

When uncertain, escalate to the product owner. optimize for:

1. user trust
2. theological grounding
3. product coherence
4. low architectural debt
5. backend boundaries that can survive the refactor
