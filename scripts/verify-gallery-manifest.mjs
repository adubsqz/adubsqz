#!/usr/bin/env node
/**
 * Ensures every image listed in src/gallery-manifest.json exists under public/photos/still-life/.
 * Path rules match src/data.ts and sync-gallery-ignore.mjs.
 *
 * Not run by default `npm run lint`: generated assets (e.g. from prepare-gallery-assets.mjs) may be
 * absent in CI or fresh clones. Run manually or in pipelines after assets exist:
 *   npm run verify:gallery-manifest
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST = join(ROOT, 'src', 'gallery-manifest.json');
const STILL_LIFE = join(ROOT, 'public', 'photos', 'still-life');

const SUPPORTED = /\.(jpe?g|png|webp)$/i;

function resolvePublicPath(gallery, filename) {
  const normalized = filename.trim().replace(/^\/+/, '');
  if (!normalized || !SUPPORTED.test(normalized.split('/').pop() ?? '')) return null;
  if (normalized.includes('/')) {
    return join(STILL_LIFE, normalized);
  }
  if (gallery === 'bw' || gallery === 'color') {
    return join(STILL_LIFE, gallery, normalized);
  }
  if (gallery === 'still-life') {
    return join(STILL_LIFE, normalized);
  }
  return null;
}

function main() {
  const raw = readFileSync(MANIFEST, 'utf8');
  const manifest = JSON.parse(raw);
  const missing = [];

  for (const [gallery, entries] of Object.entries(manifest)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (typeof entry !== 'string') continue;
      const p = resolvePublicPath(gallery, entry);
      if (!p) continue;
      if (!existsSync(p)) missing.push(relative(ROOT, p));
    }
  }

  if (missing.length > 0) {
    console.error('Gallery manifest references files that are missing on disk:\n');
    missing.forEach((m) => console.error(`  - ${m}`));
    console.error(
      '\nAdd the assets under public/photos/still-life/ or remove them from src/gallery-manifest.json.',
    );
    console.error('To generate web-sized copies from ~/originals, run: node scripts/prepare-gallery-assets.mjs\n');
    process.exit(1);
  }

  console.log('verify-gallery-manifest: OK (all manifest images present).');
}

main();
