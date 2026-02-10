# Alexander Ames — Photography

A minimal photography portfolio: gallery + about. No uploads; you add assets to `public/` yourself.

## Run

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173).

## Adding photos

- Put image files under `public/photos/` (e.g. `public/photos/still-life/01.jpg`).
- Edit `src/data.ts`: add or update entries in `COLLECTIONS` with `src` like `/photos/still-life/01.jpg` (paths are relative to `public/`).
- Only reference images you’re okay sharing publicly; anything in `public/` is served as-is.
- If you use the same still-life folders as in `port-brutal` (e.g. `40860_119374_268264`), copy those folders into `public/` and add their paths in `src/data.ts` (e.g. `/${dir}/kodak_200_c_41_..._8400001.jpg`).

## Build

```bash
npm run build
```

Output is in `dist/`. Deploy that folder to any static host.

## Structure

- **Home**: name + links to Gallery and About.
- **Gallery**: collections (e.g. Still Life) with a grid; click a photo for lightbox.
- **About**: short bio + social links.

Design is minimal and photo-led (dark background, simple type). No upload UI; you control all assets.
