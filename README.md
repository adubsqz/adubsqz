# adubsqz — photography

Live site: [adubsqz on Vercel](https://adubsqz.vercel.app/) (update the project domain in Vercel if yours differs).

## License and use restrictions

Copyright © 2026 Alexander Ames. All rights reserved.

This repository, the adubsqz photography portfolio, all photographs, image files, source code, visual design, written
content, metadata, and build outputs are proprietary. No copying, redistribution, modification, publication, scraping,
dataset inclusion, model training, AI/ML ingestion, embedding generation, indexing, benchmarking, or derivative use is
permitted without prior written permission.

Any print sale, image license, film/TV clearance, syndication, rental, or commercial use must be confirmed in a separate
written agreement. See [LICENSE](./LICENSE) for the full terms.

The deployed portfolio also publishes photo-specific terms at `/PHOTO_TERMS.md`.

## Development

```bash
npm install
npm run dev
```

## Tests

- **Unit / component (Vitest):** `npm run test` or `npm run test:run`
- **E2E (Playwright):** `npm run playwright:install` once per machine, then `npm run test:e2e`

### Password gate

The gallery is gated by a **server-side** password check (`/api/auth`). The password is never shipped to the browser; the client only gets a signed, HttpOnly auth cookie after a successful submit.

Required environment variables (server-only — **no `VITE_` prefix**):

- `**GALLERY_PASSWORD`** — the password visitors type into the gate. If unset, the site is public.
- `**GALLERY_AUTH_SECRET`** — a long random string used to sign the auth cookie. Rotate it to invalidate all existing sessions. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```
- **Local:** set both in `.env.local` (see [SETUP.md](./SETUP.md)). Run the app with `vercel dev` so `/api/auth` is available.
- **Production (Vercel):** add both under Project → Settings → Environment Variables for **Production** (and Preview if you want). Changing `GALLERY_PASSWORD` takes effect on the next request — **no rebuild required**.

If you omit `GALLERY_PASSWORD` on **Vercel**, the gallery **stays locked** (fail-safe) until you set a password or set `GALLERY_PUBLIC=1` to intentionally ship a public build. Local `npm run dev` without a password remains public for convenience.

### Playwright and the password gate

Playwright starts the dev server with `VITE_E2E=1`, which makes the client skip the `/api/auth` check entirely during e2e runs.

**If `reuseExistingServer` reuses a `npm run dev` you started without `VITE_E2E=1`, you’ll still see the password screen when a gallery password is configured.** Stop that dev server so Playwright can start one with the right env, or run dev with `VITE_E2E=1` while debugging e2e.

## Build

```bash
npm run build
npm run preview
```

## Photo curation workflow

Python tooling lives under **`tools/gallery/`**. Design and contracts: **`docs/superpowers/specs/2026-04-30-gallery-pipeline-design.md`**.

Requirements:

- **`python3`** on PATH (npm scripts create **`./.venv-gallery`** automatically via the shell wrappers).
- **`bash`** (for **`tools/run_gallery_*.sh`**).

**Environment:** Gallery commands load **`.env`** then **`.env.local`** from the repo root (and from **`GALLERY_REPO_ROOT`**, when set), without overriding variables already exported in your shell. Put paths like **`GALLERY_PHOTO_PROMPT`** in **`.env.local`** so `npm run gallery:import` and related scripts pick them up alongside Vite/`vercel dev`.

Commands:

```bash
npm run gallery:doctor                           # resolves repo paths + photo-prompt binary hint
npm run gallery:test                             # pytest (gallery tooling)
npm run gallery:verify                           # filesystem ↔ src/gallery-manifest.json parity
npm run gallery:import -- --map YOUR_MAP.json   # optional: --dry-run, --limit N
```

Maps use **`{ "entries": [ { "source", "bucket", "link_mode", "dest_basename"?, "photo_prompt"? }, … ] }`**. Sample: **`tools/gallery/examples/curation-map.sample.json`**.

- **`bucket`:** **`bw`** | **`color`** | **`still-life`**
- **`link_mode`:** **`copy`** | **`symlink`** (POSIX symlinks — **symlink** publishes a symlink pointing at the final working bytes)
- **`photo_prompt`:** optional string; invokes local **`photo-prompt`** (**`GALLERY_PHOTO_PROMPT`** env overrides default **`~/photo-prompt/.venv/bin/photo-prompt`** resolution)

**Publish step:** Before writing **`public/`**, every row is **downscaled** (default max **1500×1500**, aspect preserved) and **burned-in watermark** (**`© adubsqz`** by default), matching **`scripts/optimize_images.py`** behavior. Overrides (optional env): **`GALLERY_MAX_WIDTH`**, **`GALLERY_MAX_HEIGHT`**, **`GALLERY_JPEG_QUALITY`**, **`GALLERY_WATERMARK_TEXT`**, **`GALLERY_WATERMARK_OPACITY`** (0–255), **`GALLERY_WATERMARK_POSITION`** (`bottom-right`, …), **`GALLERY_STRIP_EXIF=`** `1` to drop EXIF. Requires **Pillow** (installed via **`requirements-gallery.txt`** / gallery npm scripts).

Only rows that publish successfully append to **`src/gallery-manifest.json`**. Assets land under **`public/photos/still-life/`**.

## More

See [SETUP.md](./SETUP.md) for the inquiry-to-email (Resend) workflow and environment variables.