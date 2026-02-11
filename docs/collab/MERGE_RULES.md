# Merge Rules

Version: 1.1.0

## Merge Strategy

- Trunk-based development with short-lived branches.
- Continuous small merges only.
- Implementation work must come from task worktrees.

## Pull Request Requirements

1. Exactly one `task_id` in title/body.
2. Diff limited to reserved/scoped paths.
3. Handoff entry written in `handoffs.json`.
4. Acceptance criteria mapped line-by-line.
5. No unresolved TODOs without follow-up task.
6. `worktree_path` included in PR metadata.
7. UI tasks must pass `npm run check:typography`.

## Conflict Prevention Rules

- Reserve before edit.
- Setup task worktree before coding.
- Never code from root checkout.
- Refresh reservations every 4h for long tasks.
- Never self-assign files already exclusively reserved.
- Rebase in task worktree before final review.

## Shared File Policy

Shared files require:

1. decision record in `decisions.json`
2. lead-created exclusive reservation
3. explicit reviewer note in PR

## Cross-Boundary Exception Workflow

1. Agent flags need in handoff note or lead chat.
2. Lead writes decision record.
3. Lead updates task scope + reservations.
4. Agent proceeds only after state files reflect approval.

## PR Size Targets

- Preferred: <= 300 LOC net.
- Hard stop: > 600 LOC without lead approval.

## Revert Safety

Every PR should be independently revertible:

- No hidden multi-feature coupling.
- No migration without backward path.
- Feature flags for risky behavior when applicable.
