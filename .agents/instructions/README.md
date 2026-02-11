# Runtime Instruction Files

Runtime files are deltas over core protocol.

## Mandatory Read Order

1. `AGENTS.md`
2. `docs/collab/CORE_PROTOCOL.md`
3. `docs/collab/WORKTREE_QUICKSTART.md`
4. `docs/collab/OWNERSHIP_MAP.md`
5. `docs/collab/MERGE_RULES.md`
6. runtime file in this folder
7. `docs/collab/state/task_queue.json`
8. `docs/collab/state/reservations.json`
9. `docs/collab/state/decisions.json`

## Mandatory Execution Rule

Implementers must execute coding tasks only from task worktrees under `.worktrees/`.
