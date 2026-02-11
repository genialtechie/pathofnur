# Contributing Workflow

## Quick Start

1. Read `AGENTS.md`.
2. Read `docs/collab/CORE_PROTOCOL.md`.
3. Read `docs/collab/WORKTREE_QUICKSTART.md`.
4. Read `docs/collab/OWNERSHIP_MAP.md`.
5. Read `docs/collab/MERGE_RULES.md`.
6. Read your runtime instructions in `.agents/instructions/`.
7. Validate state:

```bash
scripts/validate_collab_state.py
```

## Mandatory Worktree Rule

All implementation work must run in a task-specific worktree.

Before first worktree in a new repo, create initial commit on `main`:

```bash
git add -A
git commit -m \"Bootstrap collaboration system\"
```

Setup:

```bash
python3 scripts/worktree_task.py setup T-YYYYMMDD-###
cd .worktrees/T-YYYYMMDD-###
```

Teardown after merge:

```bash
python3 scripts/worktree_task.py teardown T-YYYYMMDD-###
python3 scripts/worktree_task.py prune
```

## Branches

Use one task per branch:

- `feat/T-YYYYMMDD-###-short-slug`
- `fix/T-YYYYMMDD-###-short-slug`
- `chore/T-YYYYMMDD-###-short-slug`

## Scope Discipline

- Work only in reserved paths.
- For cross-boundary edits, require lead decision + reservation update first.

## Handoffs

When done:

1. Update `docs/collab/state/handoffs.json`.
2. Use `docs/collab/templates/HANDOFF_TEMPLATE.md`.
3. Include validation command output summary.
