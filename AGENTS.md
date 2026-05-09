## Learned User Preferences

- Prefers clear runtime-path explanations when behavior is unexpected, especially whether execution is in local scripts versus Cursor tooling.
- Uses `.env.local` for local script configuration and expects environment updates to apply cleanly to CLI workflows.
- Expects gallery-related NPM scripts to stay thin wrappers over bash and Python helpers.
- Before committing gallery photo imports (new binaries under `public/photos/still-life/` or `src/gallery-manifest.json` changes from `gallery:import`): ask for explicit confirmation; do not commit imported photos without approval.
- For gallery `photo-prompt` / curation, words like "slightly" or similar minimal qualifiers mean very conservative corrections (user flagged `dusk1` when a subtle lift-shadows / warmth intent still came out overcooked under `photo_prompt`). Prefer narrower prompts, lower recipe strength when applicable, or dry-run / visual review before import.
- For gallery curation maps: prefer one staging file — `.tmp/staged-curation.json` only; avoid ad-hoc map names (e.g. `curation-three.json`, `remap-dusk1.json`) and avoid extra map files unless necessary.

## Learned Workspace Facts

- Gallery Python tooling lives under `tools/gallery/`; import as `gallery` with `PYTHONPATH=tools` (repo ignores `scripts/**`, so committed automation avoids `scripts/`).
- Gallery NPM scripts: `gallery:test` (pytest via `tools/run_gallery_pytest.sh` and `.venv-gallery`), `gallery:import` (optional `--stage-only` HITL → `.tmp/gallery-hitl`), `gallery:promote` (`--list` / `--tokens` / `--approve-all`), `gallery:verify`, `gallery:doctor`, `gallery:draft-probe-map` (random `~/originals` files not in manifest → probe JSON).
- Gallery design spec: `docs/superpowers/specs/2026-04-30-gallery-pipeline-design.md`. Sample curation map: `tools/gallery/examples/curation-map.sample.json`.
- Gallery manifest records finished work only (model B; no in-progress rows). Humans declare `bw` / `color` / `about` import buckets (legacy `still-life` maps to `about`), symlink vs copy, and optional `photo-prompt` text.
- Import pipeline: always-on screening (`tools/gallery/screen_asset.py`), then optional `photo-prompt` (map `photo_prompt` or auto-generated from screening), then Pillow resize + burn-in watermark (`tools/gallery/optimize_publish.py`), then copy/symlink into `public/photos/still-life/`. Rejects and dry-run failures exit non-zero; see README Photo curation for env tunables.
- Optional gallery env: `GALLERY_REPO_ROOT`, `GALLERY_PHOTO_PROMPT`, `GALLERY_PHOTO_PROMPT_TIMEOUT`, `GALLERY_PHOTO_PROMPT_MODEL`, screening tunables (`GALLERY_SCREEN_*`, see README), resize/watermark tunables (`README` Photo curation), `GALLERY_SKIP_WATERMARK=1` (one-shot re-encode of already-watermarked sources), `GALLERY_IMPORT_SKIP_AUTO_PROMPT=1` (disable metric auto-prompt for the run). Gallery Python reads `.env` / `.env.local` from the repo root (and from `GALLERY_REPO_ROOT` when set) via `python-dotenv`, without overwriting already-exported shell variables.
- Root package `build` runs `vite build` only.
- E2E entry is `playwright-cli.mjs` (pins `PLAYWRIGHT_BROWSERS_PATH` to `.pw-browsers/`). Agents: `node playwright-cli.mjs --wrapper-help` for copy-paste examples; all other args pass through to Playwright.
- `.venv-gallery/`, `__pycache__/`, and `.pytest_cache/` are gitignored.

## Cursor Cloud specific instructions

### Services overview

| Service | Start command | Notes |
| --- | --- | --- |
| Vite dev server (frontend) | `npm run dev` | SPA on port 5173; for API routes use `npx vercel@latest dev` instead |
| Gallery Python tests | `npm run gallery:test` | Auto-creates `.venv-gallery/` if missing |

### Running the app

- `npm run dev` serves the React SPA. API routes (`/api/auth`, `/api/inquire`) require Vercel CLI (`npx vercel@latest dev`) — plain Vite returns 404 for those.
- Set `VITE_E2E=1` to bypass the password gate without needing `GALLERY_PASSWORD`/`GALLERY_AUTH_SECRET`.
- No database or external service is required to start the frontend.

### Lint / Test / Build

- **Lint:** `npm run lint` (runs `tsc --noEmit` against both `tsconfig.json` and `tsconfig.api.json`)
- **Unit tests:** `npm run test:run` (Vitest, 48 tests, mocks Resend SDK)
- **Gallery tests:** `npm run gallery:test` (pytest, 29 tests)
- **E2E:** `npm run playwright:install` (one-time), then `npm run test:e2e` (starts its own Vite server with `VITE_E2E=1`)
- **Build:** `npm run build` (Vite production build → `dist/`)

### Gotchas

- The VM needs `python3.12-venv` apt package for gallery venv creation (`apt-get install -y python3.12-venv` if missing).
- Playwright browsers install into `.pw-browsers/` (repo-local, not system-wide). Run `npm run playwright:install` after a fresh `npm install` if the browser cache is empty.
- E2E tests reuse an existing dev server on port 5173 outside CI. Stop any pre-existing server or set `VITE_E2E=1` on it to avoid hitting the password gate.