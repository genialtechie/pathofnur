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

## Delivery Rules

- Update handoff state on completion.
- Report unresolved risks explicitly.
- Recommend immediate follow-up task when applicable.
