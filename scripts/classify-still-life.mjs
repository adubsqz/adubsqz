#!/usr/bin/env node
/**
 * Classifies still-life photos as B&W or color by sampling pixel chroma,
 * then moves them into still-life/bw and still-life/color and writes
 * src/gallery-manifest.json for the app.
 *
 * Run from project root: node scripts/classify-still-life.mjs
 * Requires: npm install sharp (add as devDependency)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const STILL_LIFE = path.join(ROOT, 'public', 'photos', 'still-life');
const BW_DIR = path.join(STILL_LIFE, 'bw');
const COLOR_DIR = path.join(STILL_LIFE, 'color');
const MANIFEST_PATH = path.join(ROOT, 'src', 'gallery-manifest.json');

const SKIP_FILES = new Set(['.gitkeep', 'kodak_200_c_41_ABOUTME.jpg']);
const SAMPLE_SIZE = 80; // resize to 80px for fast analysis
const CHROMA_THRESHOLD = 22; // avg chroma below this = B&W

function isImage(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
}

async function getAverageChroma(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const pixelCount = (data.length / channels) | 0;
  let sumChroma = 0;

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * channels] ?? 0;
    const g = data[i * channels + 1] ?? 0;
    const b = data[i * channels + 2] ?? 0;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    sumChroma += chroma;
  }

  return sumChroma / pixelCount;
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && isImage(e.name))
    .map((e) => e.name);
}

async function classifyAndMove() {
  if (!fs.existsSync(STILL_LIFE)) {
    console.error('Still-life directory not found:', STILL_LIFE);
    process.exit(1);
  }

  fs.mkdirSync(BW_DIR, { recursive: true });
  fs.mkdirSync(COLOR_DIR, { recursive: true });

  const entries = fs.readdirSync(STILL_LIFE, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && isImage(e.name) && !SKIP_FILES.has(e.name))
    .map((e) => e.name);

  let bw = listImages(BW_DIR);
  let color = listImages(COLOR_DIR);

  for (const filename of files) {
    const srcPath = path.join(STILL_LIFE, filename);
    let chroma;
    try {
      chroma = await getAverageChroma(srcPath);
    } catch (err) {
      console.warn('Skip (unreadable):', filename, err.message);
      continue;
    }

    const isBw = chroma < CHROMA_THRESHOLD;
    const destDir = isBw ? BW_DIR : COLOR_DIR;
    const destPath = path.join(destDir, filename);

    if (path.resolve(srcPath) !== path.resolve(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      fs.unlinkSync(srcPath);
    }

    if (isBw) bw.push(filename);
    else color.push(filename);
    console.log(isBw ? 'B&W' : 'Color', chroma.toFixed(1), filename);
  }

  const manifest = { bw: [...new Set(bw)], color: [...new Set(color)] };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('\nWrote', MANIFEST_PATH);
  console.log('B&W:', manifest.bw.length, '| Color:', manifest.color.length);
}

classifyAndMove().catch((err) => {
  console.error(err);
  process.exit(1);
});