#!/usr/bin/env node
/**
 * Curate workflow:
 *   1) link selected originals into .tmp/review
 *   2) apply photo-prompt recipes from a mapping file into .tmp/edited
 *   3) import edited images, update manifest, sync ignore, verify manifest
 *
 * Usage:
 *   node scripts/curate.mjs link --map .tmp/recipes/curation-map.json
 *   node scripts/curate.mjs apply --map .tmp/recipes/curation-map.json
 *   node scripts/curate.mjs run --map .tmp/recipes/curation-map.json
 */

import { access, lstat, mkdir, readFile, rm, symlink } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEFAULT_MAP = '.tmp/recipes/curation-map.json';
const DEFAULT_REVIEW_DIR = '.tmp/review';
const DEFAULT_EDITED_DIR = '.tmp/edited';
const DEFAULT_ORIGINALS_DIR = join(process.env.HOME || '', 'originals');
const PHOTO_PROMPT_VENV = join(process.env.HOME || '', 'photo-prompt', '.venv', 'bin', 'activate');

function parseArgs(argv) {
  const [command, ...rest] = argv.slice(2);
  const opts = {
    command,
    map: DEFAULT_MAP,
    reviewDir: DEFAULT_REVIEW_DIR,
    editedDir: DEFAULT_EDITED_DIR,
    originalsDir: DEFAULT_ORIGINALS_DIR,
    dryRun: false,
    gitAdd: false,
    limit: Infinity,
    includeScreenshots: false,
    minEditScore: 4,
  };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--map' && rest[i + 1]) opts.map = rest[++i];
    else if (arg === '--review-dir' && rest[i + 1]) opts.reviewDir = rest[++i];
    else if (arg === '--edited-dir' && rest[i + 1]) opts.editedDir = rest[++i];
    else if (arg === '--originals-dir' && rest[i + 1]) opts.originalsDir = rest[++i];
    else if (arg === '--limit' && rest[i + 1]) {
      const n = Number.parseInt(rest[++i], 10);
      if (Number.isFinite(n) && n > 0) opts.limit = n;
    } else if (arg === '--min-edit-score' && rest[i + 1]) {
      const n = Number.parseFloat(rest[++i]);
      if (Number.isFinite(n)) opts.minEditScore = n;
    } else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--git-add') opts.gitAdd = true;
    else if (arg === '--include-screenshots') opts.includeScreenshots = true;
    else if (arg === '--help' || arg === '-h') opts.command = 'help';
  }

  return opts;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/curate.mjs <command> [options]',
    '',
    'Commands:',
    '  link   Symlink selected originals into .tmp/review',
    '  apply  Apply recipes from mapping file to .tmp/edited via photo-prompt',
    '  run    link + apply + import + sync + verify',
    '',
    'Options:',
    `  --map <path>            Mapping file (default: ${DEFAULT_MAP})`,
    `  --review-dir <path>     Review directory (default: ${DEFAULT_REVIEW_DIR})`,
    `  --edited-dir <path>     Edited directory (default: ${DEFAULT_EDITED_DIR})`,
    `  --originals-dir <path>  Originals dir (default: ${DEFAULT_ORIGINALS_DIR})`,
    '  --limit <N>             Process first N mapping entries',
    '  --dry-run               Print planned actions, do not write/run',
    '  --min-edit-score <N>    Only edit when review score is > N (default: 4)',
    '  --git-add               (run only) stage changed gallery artifacts',
    '  --include-screenshots   Forwarded to process-gallery-import in run',
    '',
    'Mapping formats:',
    '  { "entries": [{ "source": "foo.jpg", "recipe": ".tmp/recipes/foo.recipe.json" }] }',
    '  { "foo.jpg": ".tmp/recipes/foo.recipe.json" }',
  ].join('\n');
}

function resolveFromRoot(p) {
  if (isAbsolute(p)) return p;
  return resolve(ROOT, p);
}

function resolveMaybe(baseDir, p) {
  if (isAbsolute(p)) return p;
  return resolve(baseDir, p);
}

function parseReviewScore(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const m = value.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return null;
  const n = Number.parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

function extractReviewScore(entry) {
  return parseReviewScore(
    entry.marketScore ?? entry.reviewScore ?? entry.score ?? entry?.review?.score ?? null,
  );
}

async function loadEntries(opts) {
  const mapPath = resolveFromRoot(opts.map);
  const raw = await readFile(mapPath, 'utf8');
  const json = JSON.parse(raw);
  const mapDir = dirname(mapPath);

  let entries = [];
  if (Array.isArray(json?.entries)) {
    entries = json.entries.map((item) => ({ ...item }));
  } else if (json && typeof json === 'object') {
    entries = Object.entries(json).map(([source, recipe]) => ({ source, recipe }));
  }

  entries = entries.filter((entry) => entry && typeof entry.source === 'string' && entry.source.trim() !== '');
  if (Number.isFinite(opts.limit)) entries = entries.slice(0, opts.limit);

  return entries.map((entry) => {
    const source = entry.source;
    const sourceAbs = isAbsolute(source) ? source : resolveMaybe(resolveFromRoot(opts.originalsDir), source);
    const reviewName = entry.reviewName || entry.review || basename(source);
    const reviewPath = resolveMaybe(resolveFromRoot(opts.reviewDir), reviewName);

    const recipeValue = typeof entry.recipe === 'string' ? entry.recipe : '';
    const recipePath = recipeValue ? resolveMaybe(mapDir, recipeValue) : '';

    const ext = extname(source);
    const sourceStem = basename(source, ext);
    const outputName =
      entry.outputName ||
      entry.output ||
      (recipePath ? `${sourceStem || basename(source)}-edited.jpg` : basename(source));
    const outputPath = resolveMaybe(resolveFromRoot(opts.editedDir), outputName);

    let sidecarPath = '';
    if (typeof entry.sidecar === 'string' && entry.sidecar.trim() !== '') {
      sidecarPath = resolveMaybe(mapDir, entry.sidecar);
    } else if (recipePath.endsWith('.recipe.json')) {
      sidecarPath = recipePath.replace(/\.recipe\.json$/i, '.sidecar.json');
    } else if (recipePath.endsWith('.json')) {
      sidecarPath = recipePath.replace(/\.json$/i, '.sidecar.json');
    } else if (recipePath) {
      sidecarPath = `${recipePath}.sidecar.json`;
    }

    return {
      ...entry,
      sourceAbs,
      reviewPath,
      reviewName: basename(reviewPath),
      recipePath,
      outputPath,
      sidecarPath,
      marketScore: extractReviewScore(entry),
    };
  });
}

async function pathExists(p) {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensurePhotoPromptAvailable() {
  try {
    await access(PHOTO_PROMPT_VENV, fsConstants.R_OK);
  } catch {
    throw new Error(
      `photo-prompt venv not found at ${PHOTO_PROMPT_VENV}. Set up ~/photo-prompt/.venv before running apply.`,
    );
  }
}

function runCommand(command, args, { dryRun = false } = {}) {
  const pretty = [command, ...args].join(' ');
  if (dryRun) {
    console.log(`[dry-run] ${pretty}`);
    return Promise.resolve();
  }
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit' });
    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`Command failed (${code}): ${pretty}`));
    });
  });
}

async function linkCommand(opts) {
  const entries = await loadEntries(opts);
  if (entries.length === 0) {
    console.log('No mapping entries found.');
    return [];
  }

  const reviewDirAbs = resolveFromRoot(opts.reviewDir);
  if (!opts.dryRun) await mkdir(reviewDirAbs, { recursive: true });

  let linked = 0;
  for (const entry of entries) {
    const src = entry.sourceAbs;
    const dest = entry.reviewPath;
    if (!(await pathExists(src))) {
      console.warn(`skip missing source: ${src}`);
      continue;
    }

    if (opts.dryRun) {
      console.log(`[dry-run] link ${dest} -> ${src}`);
      linked += 1;
      continue;
    }

    await mkdir(dirname(dest), { recursive: true });
    if (await pathExists(dest)) {
      const st = await lstat(dest);
      if (st.isSymbolicLink()) {
        await rm(dest, { force: true });
      } else {
        throw new Error(`Refusing to overwrite non-symlink at ${dest}`);
      }
    }
    await symlink(src, dest);
    console.log(`linked ${dest} -> ${src}`);
    linked += 1;
  }

  console.log(`link complete: ${linked} file(s).`);
  return entries;
}

async function applyCommand(opts) {
  await ensurePhotoPromptAvailable();
  const entries = await loadEntries(opts);
  if (entries.length === 0) {
    console.log('No mapping entries found.');
    return [];
  }

  const editedDirAbs = resolveFromRoot(opts.editedDir);
  if (!opts.dryRun) await mkdir(editedDirAbs, { recursive: true });

  let applied = 0;
  for (const entry of entries) {
    if (!entry.recipePath) {
      console.warn(`skip missing recipe in mapping: ${entry.source}`);
      continue;
    }
    if (!(await pathExists(entry.reviewPath))) {
      console.warn(`skip missing review file (run link first): ${entry.reviewPath}`);
      continue;
    }
    if (!(await pathExists(entry.recipePath))) {
      console.warn(`skip missing recipe: ${entry.recipePath}`);
      continue;
    }

    if (!opts.dryRun) await mkdir(dirname(entry.outputPath), { recursive: true });
    if (entry.sidecarPath && !opts.dryRun) await mkdir(dirname(entry.sidecarPath), { recursive: true });

    const shellCommand = [
      `source "${PHOTO_PROMPT_VENV}"`,
      '&&',
      'photo-prompt apply',
      `--input "${entry.reviewPath}"`,
      `--recipe "${entry.recipePath}"`,
      `--output "${entry.outputPath}"`,
      entry.sidecarPath ? `--sidecar "${entry.sidecarPath}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    await runCommand('bash', ['-lc', shellCommand], { dryRun: opts.dryRun });
    applied += 1;
  }

  console.log(`apply complete: ${applied} file(s).`);
  return entries;
}

function shouldApplyEdit(entry, opts) {
  if (!entry.recipePath) return false;
  if (entry.marketScore === null) return false;
  return entry.marketScore > opts.minEditScore;
}

async function removeIfExists(path) {
  if (!(await pathExists(path))) return;
  await rm(path, { force: true, recursive: false });
}

async function symlinkForImport(sourcePath, outputPath, opts) {
  if (opts.dryRun) {
    console.log(`[dry-run] passthrough ${outputPath} -> ${sourcePath}`);
    return;
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await removeIfExists(outputPath);
  await symlink(sourcePath, outputPath);
  console.log(`passthrough ${outputPath} -> ${sourcePath}`);
}

async function applyForRun(entries, opts) {
  if (entries.length === 0) {
    console.log('No mapping entries found.');
    return;
  }

  const needsPhotoPrompt = entries.some((entry) => shouldApplyEdit(entry, opts));
  if (needsPhotoPrompt) await ensurePhotoPromptAvailable();

  if (!opts.dryRun) await mkdir(resolveFromRoot(opts.editedDir), { recursive: true });

  let edited = 0;
  let passthrough = 0;
  let skipped = 0;

  for (const entry of entries) {
    const sourceExists = await pathExists(entry.sourceAbs);
    const reviewExists = await pathExists(entry.reviewPath);
    const canSimulateReviewInDryRun = opts.dryRun && sourceExists;
    const hasReviewInput = reviewExists || canSimulateReviewInDryRun;
    if (!hasReviewInput) {
      console.warn(`skip missing review file (run link first): ${entry.reviewPath}`);
      skipped += 1;
      continue;
    }

    if (shouldApplyEdit(entry, opts)) {
      if (!(await pathExists(entry.recipePath))) {
        console.warn(`skip missing recipe: ${entry.recipePath}`);
        skipped += 1;
        continue;
      }

      if (!opts.dryRun) await mkdir(dirname(entry.outputPath), { recursive: true });
      if (entry.sidecarPath && !opts.dryRun) await mkdir(dirname(entry.sidecarPath), { recursive: true });
      if (!opts.dryRun) await removeIfExists(entry.outputPath);

      const reviewInputForApply = reviewExists ? entry.reviewPath : entry.sourceAbs;
      const shellCommand = [
        `source "${PHOTO_PROMPT_VENV}"`,
        '&&',
        'photo-prompt apply',
        `--input "${reviewInputForApply}"`,
        `--recipe "${entry.recipePath}"`,
        `--output "${entry.outputPath}"`,
        entry.sidecarPath ? `--sidecar "${entry.sidecarPath}"` : '',
      ]
        .filter(Boolean)
        .join(' ');

      await runCommand('bash', ['-lc', shellCommand], { dryRun: opts.dryRun });
      edited += 1;
      continue;
    }

    if (entry.recipePath && entry.marketScore === null) {
      console.log(`skip edit (no review score): ${entry.reviewName}`);
    } else if (entry.marketScore !== null && entry.marketScore <= opts.minEditScore) {
      console.log(`skip edit (score ${entry.marketScore} <= ${opts.minEditScore}): ${entry.reviewName}`);
    }
    const passthroughInput = reviewExists ? entry.reviewPath : entry.sourceAbs;
    await symlinkForImport(passthroughInput, entry.outputPath, opts);
    passthrough += 1;
  }

  console.log(
    `run apply step complete: ${edited} edited, ${passthrough} passthrough, ${skipped} skipped missing inputs.`,
  );
}

async function runCommandChain(opts) {
  const entries = await linkCommand(opts);
  await applyForRun(entries, opts);

  const importArgs = ['scripts/process-gallery-import.mjs', '--input', opts.editedDir, '--update-manifest'];
  if (opts.includeScreenshots) importArgs.push('--include-screenshots');
  await runCommand('node', importArgs, { dryRun: opts.dryRun });
  await runCommand('npm', ['run', 'sync:gallery-ignore'], { dryRun: opts.dryRun });
  await runCommand('npm', ['run', 'verify:gallery-manifest'], { dryRun: opts.dryRun });

  if (opts.gitAdd) {
    await runCommand('git', ['add', 'src/gallery-manifest.json', '.gitignore', 'public/photos/still-life'], {
      dryRun: opts.dryRun,
    });
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  const command = opts.command;

  if (!command || command === 'help') {
    console.log(usage());
    return;
  }

  if (!['link', 'apply', 'run'].includes(command)) {
    console.error(`Unknown command: ${command}\n`);
    console.error(usage());
    process.exit(1);
  }

  if (command === 'link') await linkCommand(opts);
  else if (command === 'apply') await applyCommand(opts);
  else await runCommandChain(opts);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
