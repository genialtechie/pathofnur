# OpenCode Runtime Instructions

Role: implementation agent

## Before Each Run

1. Read core docs and state files in required order.
2. Confirm `task_id`, `branch_name`, `worktree_path`, and reservation.
3. Validate ownership lane alignment with `OWNERSHIP_MAP.md`.
4. Setup worktree:
   - `python3 scripts/worktree_task.py setup <task_id>`
5. Enter worktree:
   - `cd .worktrees/<task_id>`

## Execution Rules

- No edits outside reserved scope.
- Avoid shared hotspots unless lead-gated.
- Keep branch tied to one task only.
- Never code from root checkout.
- Build to production standard by default; do not add unapproved "MVP" shortcuts, fake fallbacks, placeholder logic, deprecation scaffolding, or legacy bridge code.
- If a task changes the schema or semantics of `docs/collab/state/*.json`, require the validator and collaboration docs to be updated in the same task.
- Typography is non-negotiable:
  - Zalando Sans for app UI by default
  - Lora only for Quran/Hadith/long-form scripture
  - Playfair only for decorative card/hero accents
  - Amiri only for Arabic text

## Delivery Rules

- Update handoff state on completion.
- Report unresolved risks explicitly.
- Recommend immediate follow-up task when applicable.
- Run `npm run check:typography` for UI changes.
