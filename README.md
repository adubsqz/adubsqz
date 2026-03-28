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

### Playwright and the password gate

Playwright starts the dev server with `VITE_E2E=1` so the password gate is skipped during e2e runs.

**If `reuseExistingServer` reuses a `npm run dev` you started without `VITE_E2E=1`, you’ll still see the password screen.** Stop that dev server so Playwright can start one with the right env, or run dev with `VITE_E2E=1` while debugging e2e.

## Build

```bash
npm run build
npm run preview
```

## More

See [SETUP.md](./SETUP.md) for the inquiry-to-email (Resend) workflow and environment variables.
