/**
 * Batch-optimize images with sharp (template — adjust dirs, quality, formats).
 *
 * Default: writes `<name>.webp` next to each JPEG/PNG under public/photos.
 * Skips when the WebP already exists and is at least as new as the source file,
 * so re-runs only pick up new or edited photos. Use --force to ignore that.
 *
 * Usage:
 *   node scripts/optimize-images-example.mjs
 *   node scripts/optimize-images-example.mjs --dir public/photos/still-life/color
 *   node scripts/optimize-images-example.mjs --force
 */

import { readdir, stat, mkdir } from 'node:fs/promises';
import { join, extname, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const IMAGE_EXT = /\.(jpe?g|png)$/i;

function parseArgs(argv) {
  let dir = join(projectRoot, 'public/photos');
  let force = false;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force' || a === '-f') force = true;
    else if (a === '--dir' && argv[i + 1]) {
      dir = argv[++i];
      if (!dir.startsWith('/')) dir = join(projectRoot, dir);
    }
  }
  return { dir, force };
}

async function collectFiles(root) {
  const out = [];
  async function walk(d) {
    const entries = await readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && IMAGE_EXT.test(e.name)) out.push(p);
    }
  }
  await walk(root);
  return out;
}

async function shouldSkip({ srcPath, outPath, force }) {
  if (force) return false;
  try {
    const [srcStat, outStat] = await Promise.all([stat(srcPath), stat(outPath)]);
    if (outStat.mtimeMs >= srcStat.mtimeMs) return true;
  } catch {
    // outPath missing → process
  }
  return false;
}

async function main() {
  const { dir, force } = parseArgs(process.argv);
  const files = await collectFiles(dir);
  let done = 0;
  let skipped = 0;

  for (const srcPath of files) {
    const ext = extname(srcPath);
    const base = srcPath.slice(0, -ext.length);
    const outPath = `${base}.webp`;

    if (await shouldSkip({ srcPath, outPath, force })) {
      skipped += 1;
      console.log(`skip (up to date) ${relative(projectRoot, outPath)}`);
      continue;
    }

    await mkdir(dirname(outPath), { recursive: true });
    await sharp(srcPath)
      .rotate()
      .webp({ quality: 82, effort: 4 })
      .toFile(outPath);

    done += 1;
    console.log(`wrote ${relative(projectRoot, outPath)}`);
  }

  console.log(`\nDone: ${done} optimized, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
