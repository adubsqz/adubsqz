from __future__ import annotations

import argparse
import re
from pathlib import Path

from gallery.config import PUBLISH_STILL_LIFE_REL
from gallery.manifest_store import load_manifest

_IMAGE_EXT = re.compile(r"\.(jpe?g|png|webp)$", re.I)


def _flatten_manifest_tokens(repo: Path) -> set[str]:
    data = load_manifest(repo)
    out: set[str] = set()
    for bucket, items in data.items():
        for raw in items:
            tok = str(raw).strip().lstrip("/").replace("\\", "/")
            if not tok:
                continue
            if bucket == "still-life":
                out.add(tok)
            elif "/" not in tok:
                out.add(f"{bucket}/{tok}")
            else:
                out.add(tok)
    return out


def verify_manifest(repo: Path) -> list[str]:
    pub = repo / PUBLISH_STILL_LIFE_REL
    errors: list[str] = []
    allowed = _flatten_manifest_tokens(repo)

    for tok in sorted(allowed):
        p = pub / tok
        if not p.is_file():
            errors.append(f"missing file for manifest entry {tok!r}: expected {p}")

    for bucket in ("bw", "color"):
        root = pub / bucket
        if not root.is_dir():
            continue
        for f in sorted(root.rglob("*")):
            if not f.is_file():
                continue
            if not _IMAGE_EXT.search(f.name):
                continue
            rel = f.relative_to(pub).as_posix()
            if rel not in allowed:
                errors.append(f"orphan file not listed in manifest: {rel}")

    if pub.is_dir():
        for f in sorted(pub.iterdir()):
            if not f.is_file():
                continue
            if f.name.startswith("."):
                continue
            if not _IMAGE_EXT.search(f.name):
                continue
            rel = f.relative_to(pub).as_posix()
            if rel not in allowed:
                errors.append(f"orphan file not listed in manifest: {rel}")

    return errors


def main(argv: list[str] | None = None) -> int:
    from gallery.config import repo_root

    p = argparse.ArgumentParser(description="Verify gallery-manifest.json matches public/photos/still-life")
    _ = p.parse_args(argv)

    errs = verify_manifest(repo_root())
    for e in errs:
        print(e)
    return 1 if errs else 0


if __name__ == "__main__":
    raise SystemExit(main())
