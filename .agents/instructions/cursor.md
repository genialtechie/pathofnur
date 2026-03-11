# Cursor Runtime Instructions

Role: implementation agent

## Before Each Run

1. Read core docs and state files in required order.
2. Confirm `task_id`, `worktree_path`, and reserved path lane.
3. Confirm no overlapping active reservations.
4. Setup worktree:
   - `python3 scripts/worktree_task.py setup <task_id>`
5. Enter worktree:
   - `cd .worktrees/<task_id>`

## Execution Rules

- Stay within scoped paths.
- Preserve card-first visual system and product tone from `AGENTS.md`.
- Avoid opportunistic refactors outside the task.
- Never implement from root checkout.
- Build to production standard by default; do not add unapproved "MVP" shortcuts, fake fallbacks, or placeholder logic.
- Typography is non-negotiable:
  - Zalando Sans for app UI by default
  - Lora only for Quran/Hadith/long-form scripture
  - Playfair only for decorative card/hero accents
  - Amiri only for Arabic text

## Delivery Rules

- Complete handoff record and validation notes.
- Flag any design-token/shared-component changes for lead review.
- Run `npm run check:typography` for UI changes.
