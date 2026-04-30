#!/usr/bin/env node
/**
 * Batch-import images: resize, apply watermark twice (subtle overlay), write JPEGs to
 * public/photos/still-life/color/ and public/photos/still-life/bw/ (same color pipeline; folder is semantic).
 * Skips UI screenshots unless --include-screenshots.
 *
 * Usage:
 *   node scripts/process-gallery-import.mjs --input /path/to/folder
 *   node scripts/process-gallery-import.mjs --input ./assets --include-screenshots
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const MAX_EDGE = 1920;
const JPEG_QUALITY = 82;

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

async function resizedBuffer(srcPath) {
  return sharp(srcPath)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();
}

async function applyDoubleWatermark(imageBuffer) {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const wmLayer = await sharp(Buffer.from(watermarkSvg(w, h))).png().toBuffer();
  return sharp(imageBuffer)
    .composite([
      { input: wmLayer, blend: 'over' },
      { input: wmLayer, blend: 'over' },
    ])
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

async function writeJpeg(buf, outPath) {
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buf);
}

function parseArgs(argv) {
  let input = '';
  let includeScreenshots = false;
  let updateManifest = false;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--input' && argv[i + 1]) input = argv[++i];
    else if (argv[i] === '--include-screenshots') includeScreenshots = true;
    else if (argv[i] === '--update-manifest') updateManifest = true;
  }
  return { input, includeScreenshots, updateManifest };
}

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

async function mergeManifest(newFiles) {
  const manifestPath = join(ROOT, 'src', 'gallery-manifest.json');
  const raw = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  const add = (key) => {
    const cur = Array.isArray(manifest[key]) ? manifest[key] : [];
    const set = new Set(cur.map((value) => String(value).trim()));
    for (const f of newFiles) {
      const canonical = `${key}/${f}`;
      if (!set.has(canonical)) {
        cur.push(canonical);
        set.add(canonical);
      }
    }
    manifest[key] = cur;
  };
  add('bw');
  add('color');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log('\nUpdated src/gallery-manifest.json (append new import-* entries). Run: npm run sync:gallery-ignore');
}

async function main() {
  const { input, includeScreenshots, updateManifest } = parseArgs(process.argv);
  if (!input) {
    console.error(
      'Usage: node scripts/process-gallery-import.mjs --input <dir> [--include-screenshots] [--update-manifest]',
    );
    process.exit(1);
  }

  const dir = input.startsWith('/') ? input : join(ROOT, input);
  const names = await readdir(dir);
  const files = names
    .filter((n) => IMAGE_EXT.test(n))
    .filter((n) => includeScreenshots || !/^screenshot_/i.test(n))
    .sort();

  const used = new Set();
  const written = [];

  for (const name of files) {
    const srcPath = join(dir, name);
    let slug = slugFromFilename(name);
    let dest = `import-${slug}.jpg`;
    let n = 2;
    while (used.has(dest)) {
      dest = `import-${slug}-${n}.jpg`;
      n += 1;
    }
    used.add(dest);

    const raw = await resizedBuffer(srcPath);
    const finalBuf = await applyDoubleWatermark(raw);
    for (const isBw of [false, true]) {
      const category = isBw ? 'bw' : 'color';
      const outDir = join(ROOT, 'public', 'photos', 'still-life', category);
      const outPath = join(outDir, dest);
      await writeJpeg(finalBuf, outPath);
      console.log('wrote', outPath);
    }
    written.push(dest);
  }

  console.log(`\nDone: ${files.length} sources → ${written.length} basenames (${written.length * 2} JPEGs).`);
  console.log('Filenames:', written.join(', '));

  if (updateManifest && written.length > 0) {
    await mergeManifest(written);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
