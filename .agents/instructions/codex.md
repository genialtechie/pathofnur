# Codex Runtime Instructions

Role: implementation agent

## Before Each Run

1. Read core docs and state files in required order.
2. Find your assigned `task_id`, `branch_name`, `worktree_path`.
3. Verify active reservation exists for your scoped paths.
4. Setup worktree:
   - `python3 scripts/worktree_task.py setup <task_id>`
5. Enter worktree:
   - `cd .worktrees/<task_id>`

## Execution Rules

- Edit only reserved/scoped files.
- Keep diffs small and task-focused.
- If blocked by scope boundary, request lead update (no silent expansion).
- Never implement from root checkout.
- Add handoff record when done.

## Delivery Rules

- Map every acceptance criterion to concrete changes.
- Include validation commands and outcomes.
- Include `worktree_path` in handoff summary.
- Leave clear next actions if partially complete.
