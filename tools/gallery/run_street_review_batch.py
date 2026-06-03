#!/usr/bin/env python3
"""Reduce originals -> apply street-review recipes -> watermark for HITL review. Never writes to originals."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "tools"))

from gallery.optimize_publish import burn_resize_watermark  # noqa: E402
from gallery.photo_prompt import resolved_photo_prompt_bin  # noqa: E402

RECIPES = REPO / "tools" / "gallery" / "examples" / "street-review"
ROOT = REPO / ".tmp" / "260529-street-review"
ORIG = Path.home() / "photography" / "originals"
REDUCE_EDGE = 1600
REVIEW_EDGE = 1200
PP = resolved_photo_prompt_bin()


def reduce_copy(src: Path, dest: Path, long_edge: int) -> None:
    from PIL import Image

    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im.load()
        w, h = im.size
        scale = long_edge / max(w, h)
        if scale < 1.0:
            nw, nh = int(w * scale), int(h * scale)
            try:
                resample = Image.Resampling.LANCZOS
            except AttributeError:
                resample = Image.LANCZOS
            im = im.resize((nw, nh), resample)
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        im.save(dest, format="JPEG", quality=92, optimize=True)


def apply_recipe(input_path: Path, recipe_path: Path, output_path: Path, sidecar_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            PP,
            "apply",
            "--input",
            str(input_path),
            "--recipe",
            str(recipe_path),
            "--output",
            str(output_path),
            "--sidecar",
            str(sidecar_path),
        ],
        check=True,
        timeout=120,
    )


def watermark_review(edited: Path, review: Path) -> None:
    import os

    os.environ["GALLERY_MAX_WIDTH"] = str(REVIEW_EDGE)
    os.environ["GALLERY_MAX_HEIGHT"] = str(REVIEW_EDGE)
    os.environ["GALLERY_JPEG_QUALITY"] = "90"
    burn_resize_watermark(edited, review)


def main() -> int:
    map_path = RECIPES / "batch-map.json"
    data = json.loads(map_path.read_text())
    jobs: list[tuple[Path, Path, str]] = []

    for batch in data["batches"]:
        if "glob" in batch:
            pattern = batch["glob"].replace("~/photography/originals/", "")
            recipe = RECIPES / batch["recipe"]
            for src in sorted(ORIG.glob(pattern)):
                jobs.append((src, recipe, batch["id"]))
        elif "recipe_by_file" in batch:
            for name, rel in batch["recipe_by_file"].items():
                src = ORIG / name
                if src.is_file():
                    jobs.append((src, RECIPES / rel, batch["id"]))

    log: list[dict] = []
    for src, recipe, batch_id in jobs:
        stem = src.stem
        reduced = ROOT / "reduced" / f"{stem}.jpg"
        edited = ROOT / "edited" / f"{stem}.jpg"
        review = ROOT / "review" / f"{stem}.jpg"
        sidecar = ROOT / "sidecars" / f"{stem}.sidecar.json"

        reduce_copy(src, reduced, REDUCE_EDGE)
        apply_recipe(reduced, recipe, edited, sidecar)
        watermark_review(edited, review)

        log.append(
            {
                "batch": batch_id,
                "original": str(src),
                "recipe": str(recipe.relative_to(RECIPES)),
                "review": str(review.relative_to(REPO)),
            }
        )
        print(f"OK {src.name} -> {review.relative_to(REPO)}")

    (ROOT / "run-log.json").write_text(json.dumps(log, indent=2) + "\n")
    print(f"\nDone: {len(log)} images in {ROOT / 'review'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
