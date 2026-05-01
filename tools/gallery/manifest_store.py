from __future__ import annotations

import json
from collections import OrderedDict
from pathlib import Path
from typing import Any

from gallery.config import MANIFEST_REL

_KEYS = ("still-life", "bw", "color")


def load_manifest(repo: Path) -> dict[str, Any]:
    path = repo / MANIFEST_REL
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("gallery-manifest.json must contain a JSON object")
    out: dict[str, list[str]] = {}
    for k in _KEYS:
        v = raw.get(k, [])
        if not isinstance(v, list):
            raise ValueError(f"gallery-manifest {k} must be a JSON array")
        out[k] = [str(item) for item in v]
    return out


def save_manifest(repo: Path, buckets: dict[str, list[str]]) -> None:
    path = repo / MANIFEST_REL
    ordered = OrderedDict()
    for k in _KEYS:
        ordered[k] = list(buckets.get(k, []))
    txt = json.dumps(ordered, indent=2)
    path.write_text(txt + "\n", encoding="utf-8")


def append_if_absent(repo: Path, bucket: str, token: str) -> bool:
    bucket = bucket.lower().strip()
    if bucket not in _KEYS:
        raise ValueError(f"unsupported manifest bucket {bucket!r}")
    buckets = load_manifest(repo)
    if token in buckets[bucket]:
        return False
    buckets[bucket] = [*buckets[bucket], token]
    save_manifest(repo, buckets)
    return True
