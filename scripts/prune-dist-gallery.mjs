import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const manifestPath = path.join(projectRoot, 'src', 'gallery-manifest.json');
const distStillLifeRoot = path.join(projectRoot, 'dist', 'photos', 'still-life');
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function normalizeEntry(category, entry) {
  if (typeof entry !== 'string') return '';
  const normalized = entry.trim().replace(/^\/+/, '');
  if (!normalized) return '';
  if (normalized.includes('/')) return normalized;
  if (category === 'bw' || category === 'color') return `${category}/${normalized}`;
  return normalized;
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else {
        out.push(abs);
      }
    }
  }
  return out;
}

function loadAllowedPaths() {
  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);
  const allowed = new Set();

  for (const [category, entries] of Object.entries(manifest)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const normalized = normalizeEntry(category, entry);
      if (!normalized) continue;
      if (!IMAGE_EXT.test(normalized.split('/').pop() ?? '')) continue;
      allowed.add(normalized);
    }
  }
  return allowed;
}

function pruneDistGallery() {
  if (!fs.existsSync(distStillLifeRoot)) {
    console.log('[prune-dist-gallery] No dist still-life directory found; skipping.');
    return;
  }

  const allowed = loadAllowedPaths();
  const files = walkFiles(distStillLifeRoot);

  let removed = 0;
  for (const absFile of files) {
    const rel = path.relative(distStillLifeRoot, absFile).replace(/\\/g, '/');
    if (allowed.has(rel)) continue;
    fs.unlinkSync(absFile);
    removed += 1;
  }

  console.log(
    `[prune-dist-gallery] Kept ${allowed.size} manifest files; removed ${removed} unreferenced files from dist.`
  );
}

pruneDistGallery();
