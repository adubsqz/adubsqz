from __future__ import annotations

import os
from pathlib import Path

MANIFEST_REL = Path("src/gallery-manifest.json")
PUBLISH_STILL_LIFE_REL = Path("public/photos/still-life")
ALLOWED_BUCKETS = frozenset({"bw", "color", "still-life"})
ALLOWED_LINK_MODES = frozenset({"copy", "symlink"})


def repo_root() -> Path:
    forced = os.environ.get("GALLERY_REPO_ROOT", "").strip()
    if forced:
        return Path(forced).resolve()
    marker = Path(__file__).resolve()
    cur = marker.parent
    while cur != cur.parent:
        if (cur / "package.json").is_file():
            return cur
        cur = cur.parent
    raise RuntimeError("gallery: could not locate repo root (no package.json in parents)")
