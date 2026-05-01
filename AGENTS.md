## Learned User Preferences
- Prefers clear runtime-path explanations when behavior is unexpected, especially whether execution is in local scripts versus Cursor tooling.
- Uses `.env.local` for local script configuration and expects environment updates to apply cleanly to CLI workflows.
- Expects gallery-related NPM scripts to stay thin wrappers over bash and Python helpers.

## Learned Workspace Facts
- Gallery Python tooling lives under `tools/gallery/`; import as `gallery` with `PYTHONPATH=tools` (repo ignores `scripts/**`, so committed automation avoids `scripts/`).
- Gallery NPM scripts: `gallery:test` (pytest via `tools/run_gallery_pytest.sh` and `.venv-gallery`), `gallery:import`, `gallery:verify`, `gallery:doctor`.
- Gallery design spec: `docs/superpowers/specs/2026-04-30-gallery-pipeline-design.md`. Sample curation map: `tools/gallery/examples/curation-map.sample.json`.
- Gallery manifest records finished work only (model B; no in-progress rows). Humans declare `bw` / `color` / `still-life`, symlink vs copy, and optional `photo-prompt` text.
- Import pipeline: optional `photo-prompt` edit, then Pillow resize + burn-in watermark (`tools/gallery/optimize_publish.py`, defaults aligned with legacy `optimize_images.py`), then copy/symlink into `public/photos/still-life/`.
- Optional gallery env: `GALLERY_REPO_ROOT`, `GALLERY_PHOTO_PROMPT`, `GALLERY_PHOTO_PROMPT_TIMEOUT`, `GALLERY_PHOTO_PROMPT_MODEL`, resize/watermark tunables (`README` Photo curation). Gallery Python reads `.env` / `.env.local` from the repo root (and from `GALLERY_REPO_ROOT` when set) via `python-dotenv`, without overwriting already-exported shell variables.
- Root package `build` runs `vite build` only.
- `.venv-gallery/`, `__pycache__/`, and `.pytest_cache/` are gitignored.
