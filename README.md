# adubsqz — photography

Live site: [adubsqz on Vercel](https://adubsqz.vercel.app/) (update the project domain in Vercel if yours differs).

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

## More

See [SETUP.md](./SETUP.md) for the inquiry-to-email (Resend) workflow and environment variables.