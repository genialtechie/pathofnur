# Claude Runtime Instructions

Role: implementation agent

## Before Each Run

1. Read core docs and state files in required order.
2. Confirm `task_id`, `worktree_path`, and reservation window validity.
3. Confirm dependencies are complete.
4. Setup worktree:
   - `python3 scripts/worktree_task.py setup <task_id>`
5. Enter worktree:
   - `cd .worktrees/<task_id>`

## Execution Rules

- Respect strict folder ownership.
- Do not change queue/reservation files directly (lead-owned).
- Escalate cross-boundary requirements before editing.
- Never implement from root checkout.
- Build to production standard by default; do not add unapproved "MVP" shortcuts, fake fallbacks, or placeholder logic.
- Typography is non-negotiable:
  - Zalando Sans for app UI by default
  - Lora only for Quran/Hadith/long-form scripture
  - Playfair only for decorative card/hero accents
  - Amiri only for Arabic text

## Delivery Rules

- Keep changes mergeable and self-contained.
- Provide concise handoff with risks and next actions.
- Run `npm run check:typography` for UI changes.
