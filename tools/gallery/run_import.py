from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path

from gallery.basename_guard import assert_allowed_publish_basename
from gallery.config import ALLOWED_LINK_MODES, repo_root
from gallery.map_model import load_map
from gallery.manifest_store import append_if_absent
from gallery.paths_publish import manifest_token, publish_file_for
from gallery.optimize_publish import burn_resize_watermark
from gallery.photo_prompt import run_photo_prompt_edit


def _resolve_source(repo: Path, source: Path) -> Path:
    s = source.expanduser()
    if s.is_absolute():
        return s.resolve()
    return (repo / s).resolve()


def _optimized_stage_path(repo: Path, dest_basename: str) -> Path:
    d = repo / ".tmp" / "optimized"
    d.mkdir(parents=True, exist_ok=True)
    return d / dest_basename


def _stage_for_edit(repo: Path, source_abs: Path, dest_basename: str) -> Path:
    review = repo / ".tmp/review"
    staged = review / dest_basename
    review.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_abs, staged)
    return staged


def _install_publish(work: Path, dest: Path, link_mode: str, dry_run: bool) -> None:
    link_mode = link_mode.strip().lower()
    if dry_run:
        return
    if link_mode not in ALLOWED_LINK_MODES:
        raise ValueError(f"invalid link_mode {link_mode!r}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        raise FileExistsError(str(dest))
    if link_mode == "copy":
        shutil.copy2(work, dest)
    else:
        dest.symlink_to(work.resolve(), target_is_directory=False)


def process_entry(repo: Path, entry, dry_run: bool) -> str:
    if entry.bucket not in ("bw", "color", "still-life"):
        raise ValueError(f"invalid bucket {entry.bucket!r}")
    if entry.link_mode not in ALLOWED_LINK_MODES:
        raise ValueError(f"invalid link_mode {entry.link_mode!r}")

    assert_allowed_publish_basename(entry.dest_basename)
    token = manifest_token(entry.bucket, entry.dest_basename)
    source_abs = _resolve_source(repo, entry.source)
    if not source_abs.is_file():
        raise FileNotFoundError(f"source not found: {source_abs}")

    dest = publish_file_for(repo, entry.bucket, entry.dest_basename)

    if dry_run:
        steps = []
        if entry.photo_prompt:
            steps.append("photo-prompt")
        steps.append("resize+watermark")
        steps.append(f"publish ({entry.link_mode})")
        verb = " + ".join(steps)
        return f"[dry-run] would {verb} -> {dest} manifest={token!r}"

    work_abs = source_abs
    if entry.photo_prompt:
        staged = _stage_for_edit(repo, source_abs, entry.dest_basename)
        edited = repo / ".tmp/edited"
        edited.mkdir(parents=True, exist_ok=True)
        out_abs = edited / entry.dest_basename
        if out_abs.exists():
            out_abs.unlink()
        stem = Path(entry.dest_basename).stem
        recipe = edited / f"{stem}.recipe.json"
        sidecar = edited / f"{stem}.sidecar.json"
        run_photo_prompt_edit(
            staged,
            entry.photo_prompt,
            out_abs,
            recipe_out=recipe,
            sidecar_out=sidecar,
        )
        work_abs = out_abs

    opt_abs = _optimized_stage_path(repo, entry.dest_basename)
    if opt_abs.exists():
        opt_abs.unlink()
    burn_resize_watermark(work_abs, opt_abs)

    _install_publish(opt_abs, dest, entry.link_mode, dry_run=False)
    appended = append_if_absent(repo, entry.bucket, token)
    if not appended:
        return f"publisher: already in manifest ({token})"
    return f"ok: {token}"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Import gallery rows from curation map JSON.")
    parser.add_argument("--map", type=Path, required=True, help="path to gallery map JSON (entries)")
    parser.add_argument("--dry-run", action="store_true", help="validate and print intentions only")
    parser.add_argument("--limit", type=int, default=0, help="optional max rows processed (default 0 = all)")
    args = parser.parse_args(argv)

    repo = repo_root()
    mp = args.map.expanduser().resolve()
    rows = load_map(mp)
    lim = args.limit if args.limit > 0 else len(rows)

    processed = 0
    try:
        for entry in rows[:lim]:
            msg = process_entry(repo, entry, dry_run=args.dry_run)
            print(msg)
            processed += 1
    except (OSError, ValueError, subprocess.CalledProcessError, ImportError) as exc:
        print(f"gallery-import: stopped after {processed} row(s): {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
