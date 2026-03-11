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

## Quality Bar (Hard)

- Default to production-standard implementations.
- Do not introduce "MVP" shortcuts, fake fallback behavior, placeholder logic, deprecation scaffolding, or legacy bridge code unless the human explicitly approves that tradeoff.
- When a dependency failure should make a feature unavailable, fail clearly instead of fabricating behavior.
- If you change the schema or semantics of `docs/collab/state/*.json`, you must update `scripts/validate_collab_state.py` and the relevant collaboration docs in the same task.

## Typography Rule (Hard)

- `Zalando Sans` is the default app font for UI.
- `Lora` is only for Quran/Hadith/scripture and long devotional reading.
- `Playfair Display` is only for rare decorative card/hero accents.
- `Amiri` is only for Arabic script.
- Run `npm run check:typography` before merge.
