# adubsqz photography app

Small React + Vite photography portfolio with:
- password gate
- still-life gallery (B&W and color filters)
- lightbox viewing
- about section + contact modal
- client-side anti-copy deterrents

## What the app does

- Serves a static portfolio site (no backend required).
- Loads gallery images from `public/photos/still-life/...` using `src/gallery-manifest.json`.
- Splits gallery into B&W and color tabs.
- Adds visual watermark overlays and disables some common copy shortcuts/right-click.
- Uses a password gate before entering the site (session-based in browser storage).

## What the app does not do

- No real authentication/authorization backend.
- No secure secret handling (password is hardcoded in frontend source).
- No user accounts, admin panel, uploads, or CMS.
- No server-side image protection (users can still capture images/screenshots).
- No rate limiting, logging, alerting, or API security controls.

## Local development

Requirements:
- Node.js 20+
- npm

Commands:

```bash
npm install
npm run dev
```

Run tests/build:

```bash
npm run test:run
npm run build
npm run preview
```

## Deployment (static hosting)

This is a static Vite app. Build output is in `dist/`.

1) Build:

```bash
npm ci
npm run test:run
npm run build
```

2) Deploy `dist/` to any static host:
- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages
- S3 + CloudFront

### Important deploy notes

- Ensure image assets exist at `public/photos/still-life/bw` and `public/photos/still-life/color` before building.
- If deploying under a subpath (for example GitHub Pages project site), set `base` in `vite.config.ts`.
- The password gate is not secure access control; treat it as a soft privacy gate only.

## Security scanning and hardening workflow

Use this as a simple deploy checklist.

### Before deploy (code/dependency checks)

```bash
npm audit --audit-level=moderate
npm audit --omit=dev --audit-level=high
npm run test:run
npm run build
```

Optional filesystem/secret scan:

```bash
npx --yes @aquasecurity/trivy fs --scanners vuln,secret .
```

### After deploy (live site checks)

Replace placeholders with your production values.

1) TLS + security headers report:

```bash
curl -s "https://http-observatory.security.mozilla.org/api/v1/analyze?host=<HOSTNAME>&rescan=true"
```

2) Baseline web vulnerability scan (Docker required):

```bash
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://<SITE_URL>
```

3) Verify response headers quickly:

```bash
curl -I https://<SITE_URL>
```

Confirm at least:
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

## Current security reality

The app currently uses client-side deterrents (`src/utils/security.ts`) and watermarks (`src/components/WatermarkedImage.tsx`). These help reduce casual copying but do not provide strong security against determined users.