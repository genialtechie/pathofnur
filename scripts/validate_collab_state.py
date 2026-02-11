#!/usr/bin/env python3
"""Validate collaboration state files for coordination issues."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = ROOT / "docs" / "collab" / "state"


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def require_keys(obj: dict, keys: Iterable[str], ctx: str, errors: list[str]) -> None:
    for key in keys:
        if key not in obj:
            errors.append(f"{ctx}: missing key `{key}`")


def normalize_pattern(pattern: str) -> str:
    return pattern.replace("/**", "").rstrip("/")


def patterns_overlap(a: str, b: str) -> bool:
    na = normalize_pattern(a)
    nb = normalize_pattern(b)
    return na == nb or na.startswith(nb + "/") or nb.startswith(na + "/")


def main() -> int:
    errors: list[str] = []

    task_queue = load_json(STATE_DIR / "task_queue.json")
    reservations = load_json(STATE_DIR / "reservations.json")
    handoffs = load_json(STATE_DIR / "handoffs.json")
    decisions = load_json(STATE_DIR / "decisions.json")

    for name, payload, key in (
        ("task_queue.json", task_queue, "tasks"),
        ("reservations.json", reservations, "reservations"),
        ("handoffs.json", handoffs, "handoffs"),
        ("decisions.json", decisions, "decisions"),
    ):
        if key not in payload or not isinstance(payload[key], list):
            errors.append(f"{name}: `{key}` must be a list")

    tasks = task_queue.get("tasks", [])
    res_list = reservations.get("reservations", [])
    decision_list = decisions.get("decisions", [])
    handoff_list = handoffs.get("handoffs", [])

    task_ids = set()
    branch_names = set()
    worktree_paths = set()
    task_by_id: dict[str, dict] = {}

    for idx, task in enumerate(tasks):
        ctx = f"task[{idx}]"
        require_keys(
            task,
            (
                "task_id",
                "title",
                "scope_paths",
                "owner_role",
                "status",
                "priority",
                "depends_on",
                "branch_name",
                "worktree_path",
                "acceptance_criteria",
                "updated_at_utc",
            ),
            ctx,
            errors,
        )

        task_id = task.get("task_id")
        branch_name = task.get("branch_name")
        worktree_path = task.get("worktree_path")

        if task_id in task_ids:
            errors.append(f"{ctx}: duplicate task_id `{task_id}`")
        task_ids.add(task_id)
        task_by_id[task_id] = task

        if branch_name in branch_names:
            errors.append(f"{ctx}: duplicate branch_name `{branch_name}`")
        branch_names.add(branch_name)

        if task_id and branch_name and task_id not in branch_name:
            errors.append(f"{ctx}: branch_name `{branch_name}` should include task_id `{task_id}`")

        if worktree_path in worktree_paths:
            errors.append(f"{ctx}: duplicate worktree_path `{worktree_path}`")
        worktree_paths.add(worktree_path)

        if isinstance(worktree_path, str) and not worktree_path.startswith(".worktrees/"):
            errors.append(f"{ctx}: worktree_path must start with `.worktrees/`")

    reservation_ids = set()
    reservation_worktrees = set()

    for idx, reservation in enumerate(res_list):
        ctx = f"reservation[{idx}]"
        require_keys(
            reservation,
            (
                "reservation_id",
                "task_id",
                "paths",
                "reserved_by",
                "assignee",
                "worktree_path",
                "start_utc",
                "expires_utc",
                "lock_type",
            ),
            ctx,
            errors,
        )

        reservation_id = reservation.get("reservation_id")
        if reservation_id in reservation_ids:
            errors.append(f"{ctx}: duplicate reservation_id `{reservation_id}`")
        reservation_ids.add(reservation_id)

        task_id = reservation.get("task_id")
        if task_id not in task_ids:
            errors.append(f"{ctx}: task_id `{task_id}` not found in task queue")
        else:
            task_worktree = task_by_id[task_id].get("worktree_path")
            if reservation.get("worktree_path") != task_worktree:
                errors.append(
                    f"{ctx}: worktree_path mismatch for task `{task_id}` "
                    f"(task={task_worktree}, reservation={reservation.get('worktree_path')})"
                )

        wt = reservation.get("worktree_path")
        if wt in reservation_worktrees:
            errors.append(f"{ctx}: duplicate reserved worktree_path `{wt}`")
        reservation_worktrees.add(wt)

    exclusive = [r for r in res_list if r.get("lock_type") == "exclusive"]
    for i in range(len(exclusive)):
        for j in range(i + 1, len(exclusive)):
            a = exclusive[i]
            b = exclusive[j]
            for pa in a.get("paths", []):
                for pb in b.get("paths", []):
                    if patterns_overlap(pa, pb):
                        errors.append(
                            "exclusive overlap: "
                            f"{a.get('reservation_id')} `{pa}` <-> "
                            f"{b.get('reservation_id')} `{pb}`"
                        )

    seen = set()
    for idx, decision in enumerate(decision_list):
        did = decision.get("decision_id")
        if did in seen:
            errors.append(f"decision[{idx}]: duplicate decision_id `{did}`")
        seen.add(did)

    seen.clear()
    for idx, handoff in enumerate(handoff_list):
        hid = handoff.get("handoff_id")
        if hid in seen:
            errors.append(f"handoff[{idx}]: duplicate handoff_id `{hid}`")
        seen.add(hid)

    if errors:
        print("INVALID state:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("Collaboration state validation: OK")
    print(f"Tasks: {len(tasks)}")
    print(f"Reservations: {len(res_list)}")
    print(f"Handoffs: {len(handoff_list)}")
    print(f"Decisions: {len(decision_list)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
