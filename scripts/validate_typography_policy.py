#!/usr/bin/env python3
"""Validate non-negotiable typography policy usage."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

CODE_DIRS = [ROOT / "apps" / "mobile" / "app", ROOT / "apps" / "mobile" / "src"]
IGNORE_SEGMENTS = {"node_modules", "dist", ".expo", ".worktrees"}

DIRECT_FONT_LITERAL_RE = re.compile(
    r'fontFamily\s*:\s*["\'](?:ZalandoSans_|Lora_|PlayfairDisplay_|Amiri_)'
)

# These tokens are restricted to scripture/long-form contexts.
RESTRICTED_TOKENS = ("fontFamily.scriptureRegular", "fontFamily.scriptureSemiBold")
# Decorative-only token.
ACCENT_TOKEN = "fontFamily.accentDisplay"


def is_ignored(path: Path) -> bool:
    return any(part in IGNORE_SEGMENTS for part in path.parts)


def is_scripture_allowed(path: Path) -> bool:
    p = str(path).lower()
    allow_keywords = ("quran", "hadith", "scripture", "long-form", "longform")
    return any(keyword in p for keyword in allow_keywords)


def is_accent_allowed(path: Path) -> bool:
    p = str(path).lower()
    return "card" in p or "hero" in p


def collect_code_files() -> list[Path]:
    files: list[Path] = []
    for base in CODE_DIRS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix not in {".ts", ".tsx"}:
                continue
            rel = path.relative_to(ROOT)
            if is_ignored(rel):
                continue
            files.append(path)
    return files


def main() -> int:
    errors: list[str] = []
    files = collect_code_files()

    for path in files:
        rel = path.relative_to(ROOT)
        text = path.read_text(encoding="utf-8")

        # Allow literal font family declarations only in centralized token file.
        if rel != Path("apps/mobile/src/components/navigation/typography.ts"):
            if DIRECT_FONT_LITERAL_RE.search(text):
                errors.append(
                    f"{rel}: direct font family literal found; use typography tokens instead"
                )

        for token in RESTRICTED_TOKENS:
            if token in text and not is_scripture_allowed(rel):
                errors.append(
                    f"{rel}: {token} is restricted to Quran/Hadith/scripture/long-form content"
                )

        if ACCENT_TOKEN in text and not is_accent_allowed(rel):
            errors.append(
                f"{rel}: {ACCENT_TOKEN} is restricted to hero/card accent contexts"
            )

    if errors:
        print("Typography policy: FAIL")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Typography policy: OK")
    print(f"Files scanned: {len(files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
