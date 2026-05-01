from __future__ import annotations

from pathlib import Path
from shutil import which

from gallery.config import MANIFEST_REL, PUBLISH_STILL_LIFE_REL, repo_root
from gallery.photo_prompt import resolved_photo_prompt_bin


def main(argv: list[str] | None = None) -> int:
    _ = argv
    repo = repo_root()
    print("repo:", repo)
    print("manifest:", repo / MANIFEST_REL)
    print("publish root:", repo / PUBLISH_STILL_LIFE_REL)
    b = resolved_photo_prompt_bin()
    p = Path(b)
    if p.is_file():
        status = "file path exists"
    elif which(b):
        status = "on PATH"
    else:
        status = "not found (set GALLERY_PHOTO_PROMPT or install photo-prompt)"
    print("photo-prompt binary:", b, f"({status})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
