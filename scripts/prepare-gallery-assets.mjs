#!/usr/bin/env node
/**
 * Resize originals, embed a subtle file watermark, write to public/photos/still-life/{bw,color}/.
 * The site still applies the React overlay in WatermarkedImage.
 *
 * Usage: node scripts/prepare-gallery-assets.mjs
 */

import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ORIGINALS = join(process.env.HOME || '', 'originals');

const MAX_EDGE = 1920;
const JPEG_QUALITY = 82;

/** @type {{ src: string; dest: string; category: 'bw' | 'color' }[]} */
const JOBS = [
  // Color — distinct adults: night flash / wall, two portraits of same friend w/ dreads, DJ set
  {
    src: join(
      ORIGINALS,
      '000220490001/kodak_400_c_41_40860_119374_268265_000008410025.jpg',
    ),
    dest: 'color-night-sunglasses-wall.jpg',
    category: 'color',
  },
  {
    src: join(
      ORIGINALS,
      '40860_119374_268264/kodak_200_c_41_40860_119374_268264_000008400001.jpg',
    ),
    dest: 'color-dreads-street-corner.jpg',
    category: 'color',
  },
  {
    src: join(
      ORIGINALS,
      '40860_119374_268264/kodak_200_c_41_40860_119374_268264_000008400016.jpg',
    ),
    dest: 'color-dreads-car-portrait.jpg',
    category: 'color',
  },
  {
    src: join(ORIGINALS, '000255270004.jpg'),
    dest: 'color-dj-portrait.jpg',
    category: 'color',
  },
  // Kodak 200 — still life / motion (same roll as dreads street shots)
  {
    src: join(
      ORIGINALS,
      '40860_119374_268264/kodak_200_c_41_40860_119374_268264_000008400008.jpg',
    ),
    dest: 'color-toy-taxis.jpg',
    category: 'color',
  },
  {
    src: join(
      ORIGINALS,
      '40860_119374_268264/kodak_200_c_41_40860_119374_268264_000008400025.jpg',
    ),
    dest: 'color-blurred-ballerina-figures.jpg',
    category: 'color',
  },
  // B&W — unchanged set
  {
    src: join(ORIGINALS, '000220500007.jpg'),
    dest: 'bw-blurred-ballerina.jpg',
    category: 'bw',
  },
  {
    src: join(ORIGINALS, '000230040031.jpg'),
    dest: 'bw-snow-path-lamps.jpg',
    category: 'bw',
  },
  {
    src: join(ORIGINALS, '000220500010.jpg'),
    dest: 'bw-room-window-laptop.jpg',
    category: 'bw',
  },
  {
    src: join(ORIGINALS, '000230040019.jpg'),
    dest: 'bw-winter-shovel-street.jpg',
    category: 'bw',
  },
  {
    src: join(ORIGINALS, '000220500035.jpg'),
    dest: 'bw-portrait-two-figures.jpg',
    category: 'bw',
  },
];

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

async function processOne({ src, dest, category }) {
  const outDir = join(ROOT, 'public', 'photos', 'still-life', category);
  const outPath = join(outDir, dest);
  await mkdir(outDir, { recursive: true });

  const resizedBuf = await sharp(src)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();

  const meta = await sharp(resizedBuf).metadata();
  const w = meta.width ?? MAX_EDGE;
  const h = meta.height ?? MAX_EDGE;

  const wmLayer = await sharp(Buffer.from(watermarkSvg(w, h))).png().toBuffer();

  await sharp(resizedBuf)
    .composite([{ input: wmLayer, blend: 'over' }])
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(outPath);

  console.log('wrote', outPath);
}

async function main() {
  for (const job of JOBS) {
    await processOne(job);
  }
  console.log(`\nDone: ${JOBS.length} images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
