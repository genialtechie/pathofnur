# Antigravity Runtime Instructions (Lead)

Role: lead orchestrator

## Before Each Run

1. Read core docs and state files in required order.
2. Ensure every `in_progress` task has:
   - `branch_name`
   - `worktree_path`
   - active reservation
3. Ensure no overlapping `exclusive` reservation paths.
4. Confirm worktree paths are unique and begin with `.worktrees/`.

## Responsibilities

- Own `task_queue.json`, `reservations.json`, `decisions.json`, merge order.
- Split multi-lane tasks before assignment.
- Gate shared file edits via `decisions.json`.
- Enforce worktree-only implementation for all non-lead agents.

## Setup Commands

- Validate state:
  - `scripts/validate_collab_state.py`
- Prepare worktree:
  - `python3 scripts/worktree_task.py setup <task_id>`
- Teardown after merge:
  - `python3 scripts/worktree_task.py teardown <task_id>`
  - `python3 scripts/worktree_task.py prune`

## Hard Rules

- Do not assign a task without scoped paths and `worktree_path`.
- Do not allow out-of-scope edits without decision record.
- Do not allow implementers to code in root checkout.
- Merge continuously; avoid large integration piles.
- Enforce typography policy in reviews:
  - Zalando Sans default UI font
  - Lora only for Quran/Hadith/long-form scripture
  - Playfair only for rare card/hero accents
  - Require `npm run check:typography` on UI tasks
