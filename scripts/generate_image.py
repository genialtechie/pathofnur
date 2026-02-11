#!/usr/bin/env python3
"""
Generate images with the OpenAI Images API and save them locally.

Examples:
  python3 scripts/generate_image.py \
    --prompt "Abstract aniconic desert landscape at blue hour..." \
    --out public/generated/desert-dunes-v01.png \
    --size 1024x1536

  python3 scripts/generate_image.py \
    --prompt-file .agent/prompt.txt \
    --out public/generated/home-hero \
    --n 3 \
    --output-format webp
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import pathlib
import ssl
import sys
import urllib.error
import urllib.request

try:
    import certifi
except ImportError:  # optional dependency
    certifi = None


API_URL = "https://api.openai.com/v1/images/generations"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate images via OpenAI API")
    parser.add_argument("--prompt", help="Prompt text for image generation")
    parser.add_argument("--prompt-file", help="Read prompt text from a file")
    parser.add_argument(
        "--out",
        default="public/generated/image.png",
        help="Output file path for one image, or directory/prefix for multiple",
    )
    parser.add_argument("--model", default="gpt-image-1", help="Image model name")
    parser.add_argument("--size", default="1024x1024", help="e.g. 1024x1024, 1024x1536")
    parser.add_argument("--n", type=int, default=1, help="Number of images to generate")
    parser.add_argument(
        "--output-format",
        default="png",
        choices=["png", "jpeg", "webp"],
        help="Saved file format (sent to API as output_format)",
    )
    parser.add_argument(
        "--quality",
        choices=["low", "medium", "high", "auto"],
        default=None,
        help="Optional image quality hint",
    )
    parser.add_argument(
        "--background",
        choices=["transparent", "opaque", "auto"],
        default=None,
        help="Optional background mode",
    )
    parser.add_argument(
        "--api-key-env",
        default="OPENAI_API_KEY",
        help="Env var name containing your OpenAI API key",
    )
    return parser.parse_args()


def load_prompt(args: argparse.Namespace) -> str:
    prompt = (args.prompt or "").strip()
    if args.prompt_file:
        prompt = pathlib.Path(args.prompt_file).read_text(encoding="utf-8").strip()
    if not prompt:
        raise ValueError("Provide --prompt or --prompt-file")
    return prompt


def build_payload(args: argparse.Namespace, prompt: str) -> dict:
    payload: dict = {
        "model": args.model,
        "prompt": prompt,
        "size": args.size,
        "n": args.n,
        "output_format": args.output_format,
    }
    if args.quality:
        payload["quality"] = args.quality
    if args.background:
        payload["background"] = args.background
    return payload


def request_images(payload: dict, api_key: str) -> dict:
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen_with_optional_certifi(req, timeout=180) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"API error {err.code}: {body}") from err


def output_paths(out_arg: str, n: int, ext: str) -> list[pathlib.Path]:
    out = pathlib.Path(out_arg)
    if n == 1:
        if out.suffix:
            return [out]
        return [out.with_suffix(f".{ext}")]

    if out.suffix:
        stem = out.stem
        parent = out.parent
    else:
        stem = out.name
        parent = out.parent if out.parent != pathlib.Path(".") else pathlib.Path(".")

    return [parent / f"{stem}-{i+1}.{ext}" for i in range(n)]


def write_item(item: dict, path: pathlib.Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if "b64_json" in item and item["b64_json"]:
        image_bytes = base64.b64decode(item["b64_json"])
        path.write_bytes(image_bytes)
        return

    if "url" in item and item["url"]:
        with urlopen_with_optional_certifi(item["url"], timeout=180) as resp:
            path.write_bytes(resp.read())
        return

    raise RuntimeError("Image response item missing both b64_json and url")


def urlopen_with_optional_certifi(req_or_url, timeout: int):
    if certifi is not None:
        context = ssl.create_default_context(cafile=certifi.where())
        return urllib.request.urlopen(req_or_url, timeout=timeout, context=context)
    return urllib.request.urlopen(req_or_url, timeout=timeout)


def main() -> int:
    args = parse_args()
    if args.n < 1:
        raise ValueError("--n must be >= 1")

    prompt = load_prompt(args)
    api_key = os.environ.get(args.api_key_env, "").strip()
    if not api_key:
        raise RuntimeError(f"Missing API key: set ${args.api_key_env}")

    payload = build_payload(args, prompt)
    response = request_images(payload, api_key)
    data = response.get("data") or []
    if len(data) == 0:
        raise RuntimeError(f"No images returned. Raw response: {json.dumps(response)}")

    paths = output_paths(args.out, len(data), args.output_format)
    for item, path in zip(data, paths):
        write_item(item, path)
        print(f"saved: {path}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
