# Core Collaboration Protocol

Version: 1.1.0

## Purpose

Coordinate multiple agents with deterministic task assignment, strict file ownership,
mandatory worktree isolation, and continuous small merges.

## Roles

- `lead` (default: Antigravity): queue owner, reservation owner, merge order owner.
- `codex`, `opencode`, `claude`, `cursor`: implementation agents.
- `human`: final prioritization and product authority.

## Operating Model (Mandatory)

1. **Root checkout** is for lead orchestration only (queue updates, reservation updates,
   merges, and conflict resolution).
2. **Every implementation task runs in its own git worktree**.
3. **One task -> one branch -> one worktree path**.
4. Implementers must not code from root checkout.

## Precondition

Worktree workflow starts only after at least one commit exists on `main`.

## Required Read Order (Before Every Run)

1. `AGENTS.md`
2. `docs/collab/CORE_PROTOCOL.md`
3. `docs/collab/WORKTREE_QUICKSTART.md`
4. `docs/collab/OWNERSHIP_MAP.md`
5. `docs/collab/MERGE_RULES.md`
6. runtime file in `.agents/instructions/<runtime>.md`
7. `docs/collab/state/task_queue.json`
8. `docs/collab/state/reservations.json`
9. `docs/collab/state/decisions.json`

## Task Lifecycle

1. Lead creates task in `task_queue.json` including:
   - `task_id`
   - `branch_name`
   - `worktree_path`
   - `scope_paths`
2. Lead creates reservation in `reservations.json` including the same `worktree_path`.
3. Implementer runs:
   - `python3 scripts/worktree_task.py setup <task_id>`
4. Implementer executes only scoped/reserved changes inside that worktree.
5. Implementer updates handoff state (`handoffs.json`) and PR summary.
6. Lead validates acceptance criteria and merges immediately when green.
7. Lead runs teardown:
   - `python3 scripts/worktree_task.py teardown <task_id>`

## Branch Naming

- `feat/T-YYYYMMDD-###-short-slug`
- `fix/T-YYYYMMDD-###-short-slug`
- `chore/T-YYYYMMDD-###-short-slug`

## Task IDs

Format: `T-YYYYMMDD-###`

- Date is UTC task creation date.
- Sequence is 3-digit increment for that day.

## Worktree Rules

- Worktree path must be unique per task.
- Worktree path must start with `.worktrees/`.
- Worktree path in task and reservation must match exactly.
- Implementers run all coding commands from task worktree directory.

## Reservation Rules

- `exclusive`: no other agent may modify reserved paths.
- `shared-read`: reference only, no writes.
- Default reservation TTL: 4 hours.
- Lead refreshes or releases expired reservations.
- Agent must not begin edits until reservation exists.

## Scope Rules

- No out-of-scope edits.
- No cross-boundary edits without decision record + reservation update.
- Shared files are lead-gated (see `MERGE_RULES.md`).

## Merge Rules

- Continuous small merges.
- Target net diff <= 300 LOC unless lead exception recorded in `decisions.json`.
- Do not batch unrelated features in one branch.

## Mandatory Handoff Contents

- `task_id`
- `branch_name`
- `worktree_path`
- summary of changes
- changed file list
- risks or follow-ups
- next recommended task

## State of Truth

Canonical files:

- `docs/collab/state/task_queue.json`
- `docs/collab/state/reservations.json`
- `docs/collab/state/handoffs.json`
- `docs/collab/state/decisions.json`

If chat instructions conflict with state files, lead must resolve by updating state files.
