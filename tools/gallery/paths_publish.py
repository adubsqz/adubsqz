from __future__ import annotations

from pathlib import Path

from gallery.config import ALLOWED_BUCKETS, PUBLISH_STILL_LIFE_REL


def publish_file_for(repo: Path, bucket: str, dest_basename: str) -> Path:
    bucket = bucket.lower().strip()
    if bucket not in ALLOWED_BUCKETS:
        raise ValueError(f"invalid bucket {bucket!r}; expected one of {sorted(ALLOWED_BUCKETS)}")
    pub = repo / PUBLISH_STILL_LIFE_REL
    if bucket == "still-life":
        return pub / dest_basename
    return pub / bucket / dest_basename


def manifest_token(bucket: str, dest_basename: str) -> str:
    bucket = bucket.lower().strip()
    if bucket == "still-life":
        return dest_basename
    return Path(bucket, dest_basename).as_posix()
