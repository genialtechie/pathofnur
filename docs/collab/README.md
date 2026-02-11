# Collaboration System Index

Start here for multi-agent coordination.

## Core Docs

- `CORE_PROTOCOL.md` - lifecycle, roles, reservations, and run order
- `WORKTREE_QUICKSTART.md` - mandatory worktree setup/teardown flow
- `OWNERSHIP_MAP.md` - strict lane ownership by runtime role
- `MERGE_RULES.md` - merge standards and conflict-prevention rules
- `DRY_RUN_SIMULATION.md` - seeded 3-agent simulation notes

## Canonical State Files

- `state/task_queue.json`
- `state/reservations.json`
- `state/handoffs.json`
- `state/decisions.json`

## Templates

- `templates/TASK_TEMPLATE.md`
- `templates/HANDOFF_TEMPLATE.md`
- `templates/PR_TEMPLATE.md`
- `templates/DECISION_RECORD_TEMPLATE.md`

## Validation

Run before assigning new work:

```bash
scripts/validate_collab_state.py
```
