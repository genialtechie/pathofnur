#!/usr/bin/env python3
"""Manage task worktrees from docs/collab/state/task_queue.json."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "docs" / "collab" / "state" / "task_queue.json"


def run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=cwd or ROOT, check=True, text=True, capture_output=True)


def git_branch_exists(branch: str) -> bool:
    proc = subprocess.run(
        ["git", "show-ref", "--verify", "--quiet", f"refs/heads/{branch}"],
        cwd=ROOT,
        text=True,
    )
    return proc.returncode == 0


def has_initial_commit() -> bool:
    proc = subprocess.run(
        ["git", "rev-parse", "--verify", "HEAD"],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    return proc.returncode == 0


def load_tasks() -> list[dict]:
    with STATE.open(encoding="utf-8") as fh:
        payload = json.load(fh)
    return payload.get("tasks", [])


def find_task(task_id: str) -> dict:
    for task in load_tasks():
        if task.get("task_id") == task_id:
            return task
    raise SystemExit(f"Task not found: {task_id}")


def setup(task_id: str) -> None:
    if not has_initial_commit():
        raise SystemExit(
            "Cannot create worktree before first commit. "
            "Create an initial commit on main, then retry."
        )

    task = find_task(task_id)
    branch = task["branch_name"]
    path = ROOT / task["worktree_path"]
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        print(f"Worktree path already exists: {path}")
        return

    if git_branch_exists(branch):
        run(["git", "worktree", "add", str(path), branch])
    else:
        run(["git", "worktree", "add", "-b", branch, str(path), "main"])

    print(f"Created worktree: {path}")
    print(f"Branch: {branch}")


def teardown(task_id: str, delete_branch: bool) -> None:
    task = find_task(task_id)
    branch = task["branch_name"]
    path = ROOT / task["worktree_path"]

    if path.exists():
        run(["git", "worktree", "remove", str(path)])
        print(f"Removed worktree: {path}")
    else:
        print(f"Worktree path not present: {path}")

    if delete_branch and git_branch_exists(branch):
        run(["git", "branch", "-D", branch])
        print(f"Deleted local branch: {branch}")


def list_tasks() -> None:
    tasks = load_tasks()
    print("task_id\tstatus\towner\tbranch\tworktree_path")
    for t in tasks:
        print(
            f"{t.get('task_id')}\t{t.get('status')}\t{t.get('owner_role')}\t"
            f"{t.get('branch_name')}\t{t.get('worktree_path')}"
        )


def prune() -> None:
    run(["git", "worktree", "prune"])
    print("Pruned stale worktree metadata")


def main() -> int:
    parser = argparse.ArgumentParser(description="Task worktree helper")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_setup = sub.add_parser("setup", help="Create task worktree")
    p_setup.add_argument("task_id")

    p_teardown = sub.add_parser("teardown", help="Remove task worktree")
    p_teardown.add_argument("task_id")
    p_teardown.add_argument("--delete-branch", action="store_true")

    sub.add_parser("list", help="List tasks with worktree data")
    sub.add_parser("prune", help="Prune stale worktree metadata")

    args = parser.parse_args()
    if args.cmd == "setup":
        setup(args.task_id)
    elif args.cmd == "teardown":
        teardown(args.task_id, args.delete_branch)
    elif args.cmd == "list":
        list_tasks()
    elif args.cmd == "prune":
        prune()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
