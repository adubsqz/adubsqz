import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const manifestPath = join(root, 'src', 'gallery-manifest.json');
const gitignorePath = join(root, '.gitignore');

const START_MARKER = '# BEGIN AUTO-GENERATED CURATED STILL-LIFE';
const END_MARKER = '# END AUTO-GENERATED CURATED STILL-LIFE';
const MAX_PER_GALLERY = 5;
const ABOUT_IMAGE = 'kodak_200_c_41_ABOUTME.jpg';

function pickTopFive(filenames) {
  if (!Array.isArray(filenames)) return [];
  const valid = filenames.filter((name) => typeof name === 'string' && name.trim().length > 0);
  return [...new Set(valid)].slice(0, MAX_PER_GALLERY);
}

function buildBlock(bwFiles, colorFiles) {
  const lines = [
    START_MARKER,
    '# Run: npm run sync:gallery-ignore',
    'public/photos/still-life/*',
    '!public/photos/still-life/bw/',
    '!public/photos/still-life/color/',
    `!public/photos/still-life/${ABOUT_IMAGE}`,
    '',
    'public/photos/still-life/bw/*',
    ...bwFiles.map((name) => `!public/photos/still-life/bw/${name}`),
    '',
    'public/photos/still-life/color/*',
    ...colorFiles.map((name) => `!public/photos/still-life/color/${name}`),
    END_MARKER,
  ];
  return `${lines.join('\n')}\n`;
}

function upsertManagedBlock(existing, block) {
  const start = existing.indexOf(START_MARKER);
  const end = existing.indexOf(END_MARKER);

  if (start !== -1 && end !== -1 && end >= start) {
    const afterEnd = end + END_MARKER.length;
    const nextChar = existing[afterEnd] === '\n' ? afterEnd + 1 : afterEnd;
    return `${existing.slice(0, start)}${block}${existing.slice(nextChar)}`.trimEnd() + '\n';
  }

  return `${block}\n${existing}`.trimEnd() + '\n';
}

function main() {
  const manifestRaw = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  const bw = pickTopFive(manifest.bw);
  const color = pickTopFive(manifest.color);
  const managedBlock = buildBlock(bw, color);

  const existingGitignore = readFileSync(gitignorePath, 'utf8');
  const updated = upsertManagedBlock(existingGitignore, managedBlock);
  writeFileSync(gitignorePath, updated, 'utf8');

  console.log(`Updated .gitignore from manifest (${bw.length} bw, ${color.length} color).`);
}

main();
