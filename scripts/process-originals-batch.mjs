#!/usr/bin/env node
/**
 * Batch-process every top-level image in ~/originals/ that hasn't already been
 * "magicked" into the gallery:
 *   - resize to MAX_EDGE (inside-fit, EXIF rotate)
 *   - auto-categorize as bw or color by sampling chroma
 *   - embed a double ADUBSQZ watermark
 *   - write to public/photos/still-life/{bw|color}/import-{slug}.jpg
 *   - append to src/gallery-manifest.json under exactly one category
 *
 * Already-processed sources are detected by matching the source basename or
 * its derived import-{slug}.jpg against the existing manifest.
 *
 * Subdirectories of ~/originals/ are intentionally skipped — in this repo they
 * are alternate groupings of the same top-level files (plus unsplash stock).
 *
 * Usage:
 *   node scripts/process-originals-batch.mjs [--dry-run] [--limit N] [--force]
 *     --dry-run   list planned work, do not write anything
 *     --limit N   only process the first N new sources (for quick smoke tests)
 *     --force     ignore the "already processed" check and reprocess everything
 *
 * After running, execute:
 *   npm run sync:gallery-ignore
 *   npm run verify:gallery-manifest
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ORIGINALS = join(process.env.HOME || '', 'originals');
const MANIFEST_PATH = join(ROOT, 'src', 'gallery-manifest.json');

const MAX_EDGE = 1920;
const JPEG_QUALITY = 82;
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

// Auto-categorization threshold: average per-pixel chroma (max-min of RGB, in 0..255)
// below this is considered B&W. Lets through mildly-tinted scans of film negatives
// without mislabeling actual color photographs. Tuned empirically for this library.
const BW_CHROMA_THRESHOLD = 8;

// -------------------- CLI --------------------

function parseArgs(argv) {
  const opts = { dryRun: false, limit: Infinity, force: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--limit') {
      const n = Number.parseInt(argv[++i] ?? '', 10);
      if (Number.isFinite(n) && n > 0) opts.limit = n;
    }
  }
  return opts;
}

// -------------------- Filename / slug --------------------

function slugFromFilename(name) {
  let base = basename(name, extname(name));
  base = base.replace(
    /-?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    '',
  );
  base = base.replace(/__1_/g, '-1-');
  let s = base.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  if (!s) s = 'image';
  return s.slice(0, 80);
}

// -------------------- Watermark --------------------

function watermarkSvg(width, height) {
  const diag = Math.max(14, Math.round(Math.min(width, height) / 28));
  const small = Math.max(11, Math.round(Math.min(width, height) / 55));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
    fill="rgba(255,255,255,0.13)" font-family="system-ui,Segoe UI,sans-serif" font-weight="700"
    font-size="${diag}px" letter-spacing="0.25em" transform="rotate(-24 ${width / 2} ${height / 2})">ADUBSQZ</text>
  <text x="${width - 12}" y="${height - 10}" text-anchor="end"
    fill="rgba(255,255,255,0.16)" font-family="system-ui,Segoe UI,sans-serif" font-weight="600"
    font-size="${small}px">© adubsqz</text>
</svg>`;
}

// -------------------- Auto-categorize --------------------

/**
 * Detects whether a source image is effectively B&W.
 * Downsamples to 128x128 and computes mean per-pixel chroma (max(R,G,B) - min(R,G,B)).
 * Uses a tiny sample so this stays fast across hundreds of images.
 */
async function detectCategory(srcPath) {
  const { data, info } = await sharp(srcPath)
    .rotate()
    .resize(128, 128, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels < 3) return 'bw';

  let totalChroma = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    totalChroma += max - min;
    count += 1;
  }
  const meanChroma = count > 0 ? totalChroma / count : 0;
  return meanChroma < BW_CHROMA_THRESHOLD ? 'bw' : 'color';
}

// -------------------- Pipeline --------------------

async function processOne({ src, dest, category }) {
  const outDir = join(ROOT, 'public', 'photos', 'still-life', category);
  const outPath = join(outDir, dest);
  await mkdir(outDir, { recursive: true });

  let pipeline = sharp(src).rotate().resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  });
  if (category === 'bw') pipeline = pipeline.greyscale();
  const resizedBuf = await pipeline.toBuffer();

  const meta = await sharp(resizedBuf).metadata();
  const w = meta.width ?? MAX_EDGE;
  const h = meta.height ?? MAX_EDGE;
  const wmLayer = await sharp(Buffer.from(watermarkSvg(w, h))).png().toBuffer();

  await sharp(resizedBuf)
    .composite([
      { input: wmLayer, blend: 'over' },
      { input: wmLayer, blend: 'over' },
    ])
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(outPath);

  return outPath;
}

// -------------------- Source discovery --------------------

async function listTopLevelImages() {
  const entries = await readdir(ORIGINALS, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && IMAGE_EXT.test(e.name))
    .map((e) => e.name)
    .sort();
}

/**
 * Build the set of sources already represented in the manifest. A source is
 * considered "already processed" if either its raw basename or its derived
 * `import-{slug}.jpg` appears in any manifest array.
 */
function buildProcessedSet(manifest) {
  const processed = new Set();
  for (const entries of Object.values(manifest)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (typeof entry !== 'string') continue;
      const name = basename(entry).toLowerCase();
      processed.add(name);
    }
  }
  return processed;
}

// -------------------- Manifest merge --------------------

async function loadManifest() {
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

async function saveManifest(manifest) {
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function appendToCategory(manifest, category, filename) {
  const cur = Array.isArray(manifest[category]) ? manifest[category] : [];
  if (!cur.includes(filename)) cur.push(filename);
  manifest[category] = cur;
}

// -------------------- Main --------------------

async function main() {
  const opts = parseArgs(process.argv);

  const manifest = await loadManifest();
  const processed = buildProcessedSet(manifest);

  const sources = await listTopLevelImages();

  const plan = [];
  const usedDests = new Set();
  for (const name of sources) {
    const slug = slugFromFilename(name);
    let dest = `import-${slug}.jpg`;

    const nameLower = name.toLowerCase();
    const destLower = dest.toLowerCase();
    if (!opts.force && (processed.has(nameLower) || processed.has(destLower))) {
      continue;
    }

    // Guard against two different sources sluggifying to the same dest.
    let n = 2;
    while (usedDests.has(dest) || processed.has(dest.toLowerCase())) {
      dest = `import-${slug}-${n}.jpg`;
      n += 1;
    }
    usedDests.add(dest);

    plan.push({ src: join(ORIGINALS, name), dest, sourceName: name });
    if (plan.length >= opts.limit) break;
  }

  console.log(
    `Found ${sources.length} top-level images; ${plan.length} new to process${
      opts.force ? ' (force mode)' : ''
    }.`,
  );

  if (plan.length === 0) {
    console.log('Nothing to do. Exiting.');
    return;
  }

  if (opts.dryRun) {
    for (const job of plan) console.log(`  [dry] ${job.sourceName} -> ${job.dest}`);
    console.log(`\nDry run complete. ${plan.length} would be processed.`);
    return;
  }

  let bwCount = 0;
  let colorCount = 0;
  let failures = 0;
  let idx = 0;
  for (const job of plan) {
    idx += 1;
    try {
      const category = await detectCategory(job.src);
      const outPath = await processOne({ src: job.src, dest: job.dest, category });
      appendToCategory(manifest, category, job.dest);
      if (category === 'bw') bwCount += 1;
      else colorCount += 1;
      console.log(`  [${idx}/${plan.length}] ${category}  ${job.sourceName} -> ${outPath}`);
    } catch (err) {
      failures += 1;
      console.warn(`  [${idx}/${plan.length}] FAIL   ${job.sourceName}: ${err.message}`);
    }
  }

  await saveManifest(manifest);

  console.log(
    `\nDone. Processed ${bwCount + colorCount} images (${colorCount} color, ${bwCount} bw)` +
      (failures > 0 ? `, ${failures} failed` : '') +
      '.',
  );
  console.log('Next: npm run sync:gallery-ignore && npm run verify:gallery-manifest');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
