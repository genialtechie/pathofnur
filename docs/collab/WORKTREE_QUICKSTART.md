# Worktree Quickstart

Version: 1.0.0

## Why

Worktrees isolate concurrent agent edits and reduce local-branch/dirty-tree conflicts.

## Precondition

Worktrees require at least one commit on `main`.

If repo is newly initialized:

```bash
git add -A
git commit -m \"Bootstrap collaboration system\"
```

## Directory Convention

- Root checkout: orchestration only.
- Task worktrees: `.worktrees/<task_id>`

Example:

- `.worktrees/T-20260211-001`

## Implementer Flow

1. Confirm assignment in `docs/collab/state/task_queue.json`.
2. Confirm reservation in `docs/collab/state/reservations.json`.
3. Setup worktree:

```bash
python3 scripts/worktree_task.py setup T-20260211-001
```

4. Enter worktree and work there only:

```bash
cd .worktrees/T-20260211-001
```

5. When done, update handoff state and PR.

## Lead Flow

Before assignment:

```bash
scripts/validate_collab_state.py
```

After merge:

```bash
python3 scripts/worktree_task.py teardown T-20260211-001
python3 scripts/worktree_task.py prune
```

## Guardrails

- Never implement from root checkout.
- Never share a worktree between two tasks.
- Never reuse a branch for a new task.
