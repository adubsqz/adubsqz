#!/usr/bin/env node
/**
 * Score still-life photos for market sellability.
 *
 * - Recursively scans public/photos/still-life (or custom --input-dir)
 * - Produces a JSON report with per-image sellability and edit guidance
 * - Emits curation-map.json entries for top candidates
 * - Supports provider modes:
 *   - gemini: Gemini API only
 *   - local: no API usage (heuristic scorer)
 *   - auto: Gemini until quota/error, then local fallback
 * - Supports resume/retry to avoid re-scoring thousands of images repeatedly
 *
 * Usage:
 *   node scripts/score-sellable.mjs
 *   node scripts/score-sellable.mjs --limit 50 --min-score 6.5
 *   node scripts/score-sellable.mjs --provider local --retry-failed
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_INPUT_DIR = path.join(ROOT, 'public', 'photos', 'still-life');
const DEFAULT_REPORT_OUT = path.join(ROOT, '.tmp', 'sellable-report.json');
const DEFAULT_MAP_OUT = path.join(ROOT, 'curation-map.json');
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const DEFAULT_API_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const SCORING_PROVIDERS = new Set(['gemini', 'local', 'auto']);

const RECIPE_CHOICES = [
  'none',
  'improve-daylight-skyline',
  'improve-sunset-dusk',
  'improve-lowlight-neon',
  'improve-night-motion',
];

const RECIPE_MAP = {
  'improve-daylight-skyline': path.join(process.env.HOME || '', 'photo-prompt', 'recipes', 'improve-daylight-skyline.json'),
  'improve-sunset-dusk': path.join(process.env.HOME || '', 'photo-prompt', 'recipes', 'improve-sunset-dusk.json'),
  'improve-lowlight-neon': path.join(process.env.HOME || '', 'photo-prompt', 'recipes', 'improve-lowlight-neon.json'),
  'improve-night-motion': path.join(process.env.HOME || '', 'photo-prompt', 'recipes', 'improve-night-motion.json'),
};

function parseArgs(argv) {
  const opts = {
    inputDir: DEFAULT_INPUT_DIR,
    reportOut: DEFAULT_REPORT_OUT,
    mapOut: DEFAULT_MAP_OUT,
    model: DEFAULT_MODEL,
    apiBase: DEFAULT_API_BASE,
    provider: 'auto',
    minScore: 6.5,
    limit: Infinity,
    dryRun: false,
    resume: true,
    retryFailed: false,
    maxDimension: 1400,
    quality: 80,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input-dir' && argv[i + 1]) opts.inputDir = path.resolve(ROOT, argv[++i]);
    else if (arg === '--report-out' && argv[i + 1]) opts.reportOut = path.resolve(ROOT, argv[++i]);
    else if (arg === '--map-out' && argv[i + 1]) opts.mapOut = path.resolve(ROOT, argv[++i]);
    else if (arg === '--model' && argv[i + 1]) opts.model = argv[++i];
    else if (arg === '--api-base' && argv[i + 1]) opts.apiBase = argv[++i];
    else if (arg === '--provider' && argv[i + 1]) {
      const provider = String(argv[++i]).trim().toLowerCase();
      if (SCORING_PROVIDERS.has(provider)) opts.provider = provider;
    }
    else if (arg === '--min-score' && argv[i + 1]) {
      const n = Number.parseFloat(argv[++i]);
      if (Number.isFinite(n)) opts.minScore = n;
    } else if (arg === '--limit' && argv[i + 1]) {
      const n = Number.parseInt(argv[++i], 10);
      if (Number.isFinite(n) && n > 0) opts.limit = n;
    } else if (arg === '--max-dimension' && argv[i + 1]) {
      const n = Number.parseInt(argv[++i], 10);
      if (Number.isFinite(n) && n >= 512) opts.maxDimension = n;
    } else if (arg === '--quality' && argv[i + 1]) {
      const n = Number.parseInt(argv[++i], 10);
      if (Number.isFinite(n) && n >= 40 && n <= 95) opts.quality = n;
    } else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--no-resume') opts.resume = false;
    else if (arg === '--retry-failed') opts.retryFailed = true;
    else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  return opts;
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  node scripts/score-sellable.mjs [options]',
      '',
      'Options:',
      `  --input-dir <path>      Directory to scan (default: ${DEFAULT_INPUT_DIR})`,
      `  --report-out <path>     Report JSON output (default: ${DEFAULT_REPORT_OUT})`,
      `  --map-out <path>        Curation map output (default: ${DEFAULT_MAP_OUT})`,
      '  --provider <mode>       auto | gemini | local (default: auto)',
      `  --model <name>          Gemini model (default: ${DEFAULT_MODEL})`,
      '  --min-score <N>         Include in map when score >= N (default: 6.5)',
      '  --limit <N>             Score first N images',
      '  --no-resume             Ignore existing report cache and re-score everything',
      '  --retry-failed          With resume, retry previously failed rows',
      '  --max-dimension <px>    Resize longest edge before scoring (default: 1400)',
      '  --quality <N>           JPEG quality for scoring upload (default: 80)',
      '  --dry-run               Print plan; do not call API or write files',
    ].join('\n'),
  );
}

function normalizeJsonText(raw) {
  const text = String(raw || '').trim();
  if (!text.startsWith('```')) return text;
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeConfidence(value) {
  return Math.min(1, Math.max(0, safeNumber(value, 0.5)));
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function isFailedRow(row) {
  return String(row?.rationale || '').startsWith('scoring_failed:');
}

function normalizeRecipeSuggestion(value) {
  const s = String(value || '').trim();
  if (RECIPE_CHOICES.includes(s)) return s;
  return 'none';
}

function ensureStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => String(x).trim())
    .filter((x) => x.length > 0)
    .slice(0, 8);
}

async function listImagesRecursive(dir) {
  const out = [];
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) continue;
      if (entry.name === '.gitkeep') continue;
      out.push(full);
    }
  }
  await walk(dir);
  return out.sort((a, b) => a.localeCompare(b));
}

async function toSmallBase64Jpeg(filePath, maxDimension, quality) {
  const buf = await sharp(filePath)
    .rotate()
    .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
  return buf.toString('base64');
}

async function imageStatsForLocalScore(filePath) {
  const { data, info } = await sharp(filePath)
    .rotate()
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels || 3;
  if (channels < 3) {
    return { meanLum: 0.5, contrast: 0.3, clipping: 0.1, sharpness: 0.3, chromaMean: 0.1 };
  }

  const width = info.width || 1;
  const height = info.height || 1;
  const gray = new Float32Array(width * height);
  let lumSum = 0;
  let lumSqSum = 0;
  let clippingCount = 0;
  let chromaSum = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = (y * width + x) * channels;
      const r = data[p] / 255;
      const g = data[p + 1] / 255;
      const b = data[p + 2] / 255;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      gray[y * width + x] = lum;
      lumSum += lum;
      lumSqSum += lum * lum;
      if (lum <= 0.02 || lum >= 0.98) clippingCount += 1;
      chromaSum += Math.max(r, g, b) - Math.min(r, g, b);
    }
  }

  const n = width * height;
  const meanLum = lumSum / n;
  const variance = Math.max(0, lumSqSum / n - meanLum * meanLum);
  const std = Math.sqrt(variance);

  // Simple Laplacian sharpness estimate on luminance.
  let lapSum = 0;
  let lapSqSum = 0;
  let lapCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const center = gray[y * width + x];
      const left = gray[y * width + (x - 1)];
      const right = gray[y * width + (x + 1)];
      const up = gray[(y - 1) * width + x];
      const down = gray[(y + 1) * width + x];
      const lap = 4 * center - left - right - up - down;
      lapSum += lap;
      lapSqSum += lap * lap;
      lapCount += 1;
    }
  }
  const lapVar = lapCount > 0 ? Math.max(0, lapSqSum / lapCount - (lapSum / lapCount) ** 2) : 0;

  return {
    meanLum,
    contrast: std,
    clipping: clippingCount / n,
    sharpness: lapVar,
    chromaMean: chromaSum / n,
  };
}

function buildPrompt(recipeChoices) {
  return [
    'You are an expert photography market analyst.',
    'Task: score this single photo for commercial sellability in these channels:',
    '- home decor print buyers',
    '- boutique hospitality/interior licensing',
    '- editorial/art book curation',
    '',
    'Return STRICT JSON only with this schema:',
    '{',
    '  "score": number,                      // 0.0 to 10.0',
    '  "confidence": number,                 // 0.0 to 1.0',
    '  "sellable": boolean,',
    '  "marketFit": string[],                // short channel tags',
    '  "rationale": string,                  // <= 220 chars',
    '  "editNeeded": boolean,',
    '  "editPrompt": string,                 // empty if no edit needed',
    `  "recipeSuggestion": string            // one of: ${recipeChoices.join(', ')}`,
    '}',
    '',
    'Rules:',
    '- Be conservative; avoid over-scoring weak composition.',
    '- If photo already looks publication-ready, set editNeeded=false and recipeSuggestion="none".',
    '- Keep rationale and editPrompt concise and practical.',
  ].join('\n');
}

function geminiUrl(apiBase, model, apiKey) {
  return `${apiBase.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

async function scoreWithGemini({ apiBase, model, apiKey, imageB64 }) {
  const payload = {
    contents: [
      {
        parts: [
          { text: buildPrompt(RECIPE_CHOICES) },
          { inlineData: { mimeType: 'image/jpeg', data: imageB64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(geminiUrl(apiBase, model, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini error ${response.status}: ${body.slice(0, 350)}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Gemini response missing content');
  const parsed = JSON.parse(normalizeJsonText(rawText));

  const score = Math.min(10, Math.max(0, safeNumber(parsed.score, 0)));
  const confidence = safeConfidence(parsed.confidence);
  const recipeSuggestion = normalizeRecipeSuggestion(parsed.recipeSuggestion);
  const editNeeded = Boolean(parsed.editNeeded) && recipeSuggestion !== 'none';

  return {
    score: Number(score.toFixed(2)),
    confidence: Number(confidence.toFixed(3)),
    sellable: Boolean(parsed.sellable ?? score >= 6.5),
    marketFit: ensureStringArray(parsed.marketFit),
    rationale: String(parsed.rationale || '').trim().slice(0, 220),
    editNeeded,
    editPrompt: String(parsed.editPrompt || '').trim().slice(0, 220),
    recipeSuggestion,
  };
}

async function scoreWithLocalHeuristic(filePath) {
  const stats = await imageStatsForLocalScore(filePath);
  const sharpnessNorm = clamp01(stats.sharpness / 0.012);
  const contrastNorm = clamp01(stats.contrast / 0.22);
  const exposureNorm = clamp01(1 - Math.abs(stats.meanLum - 0.5) / 0.5);
  const clippingNorm = clamp01(stats.clipping / 0.1);
  const chromaNorm = clamp01(stats.chromaMean / 0.25);

  const technical =
    0.35 * sharpnessNorm + 0.25 * contrastNorm + 0.25 * exposureNorm + 0.15 * (1 - clippingNorm);
  const score = 10 * technical;

  let recipeSuggestion = 'none';
  let editNeeded = score < 8;
  if (editNeeded) {
    if (stats.meanLum < 0.36) recipeSuggestion = 'improve-lowlight-neon';
    else if (stats.meanLum < 0.5) recipeSuggestion = 'improve-sunset-dusk';
    else if (sharpnessNorm < 0.35) recipeSuggestion = 'improve-night-motion';
    else recipeSuggestion = 'improve-daylight-skyline';
  }

  const marketFit = [];
  if (contrastNorm > 0.55 && sharpnessNorm > 0.45) marketFit.push('hospitality-licensing');
  if (chromaNorm > 0.45) marketFit.push('home-decor-prints');
  if (stats.meanLum >= 0.4 && stats.meanLum <= 0.7) marketFit.push('editorial-curation');

  return {
    score: Number(score.toFixed(2)),
    confidence: 0.52,
    sellable: score >= 6.5,
    marketFit: marketFit.slice(0, 3),
    rationale: `local heuristic: sharp=${sharpnessNorm.toFixed(2)}, contrast=${contrastNorm.toFixed(2)}, exposure=${exposureNorm.toFixed(2)}, clipping=${clippingNorm.toFixed(2)}`.slice(
      0,
      220,
    ),
    editNeeded,
    editPrompt: editNeeded
      ? `Improve tonal balance and clarity; prioritize ${recipeSuggestion.replace(/^improve-/, '').replace(/-/g, ' ')} treatment.`
      : '',
    recipeSuggestion,
  };
}

function toMapEntry(filePath, analysis, minScore) {
  if (analysis.score < minScore) return null;
  const relName = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const stem = path.basename(filePath, path.extname(filePath));
  const outputSlug = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const outputName = `${outputSlug || 'image'}-sellable.jpg`;

  let recipe = '';
  if (analysis.editNeeded && analysis.recipeSuggestion !== 'none') {
    recipe = RECIPE_MAP[analysis.recipeSuggestion] || '';
  }

  return {
    source: filePath,
    sourceRepoRelative: relName,
    marketScore: analysis.score,
    reviewScore: `${analysis.score}/10`,
    confidence: analysis.confidence,
    editNeeded: analysis.editNeeded,
    editPrompt: analysis.editPrompt,
    recipeSuggestion: analysis.recipeSuggestion,
    recipe,
    outputName,
  };
}

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readExistingReport(reportOut) {
  try {
    const raw = await fs.readFile(reportOut, 'utf8');
    const parsed = JSON.parse(raw);
    const results = Array.isArray(parsed?.results) ? parsed.results : [];
    return results;
  } catch {
    return [];
  }
}

function shouldSkipByResume(existing, opts) {
  if (!opts.resume) return false;
  if (!existing) return false;
  if (opts.retryFailed && isFailedRow(existing)) return false;
  return true;
}

async function main() {
  const opts = parseArgs(process.argv);
  const apiKey = process.env.GEMINI_API_KEY || '';

  const images = await listImagesRecursive(opts.inputDir);
  const selected = Number.isFinite(opts.limit) ? images.slice(0, opts.limit) : images;
  const existingRows = await readExistingReport(opts.reportOut);
  const existingByFile = new Map(
    existingRows.map((row) => [String(row?.file || ''), row]).filter(([file]) => file.length > 0),
  );
  const keptRows = [];
  const toScore = [];

  for (const filePath of selected) {
    const existing = existingByFile.get(filePath);
    if (shouldSkipByResume(existing, opts)) {
      keptRows.push(existing);
      continue;
    }
    toScore.push(filePath);
  }

  if (!selected.length) {
    throw new Error(`No images found under ${opts.inputDir}`);
  }

  let providerMode = opts.provider;
  if (providerMode === 'auto') {
    providerMode = apiKey ? 'gemini' : 'local';
  }

  console.log(`Scoring ${selected.length} image(s) from ${opts.inputDir}`);
  console.log(`To score now: ${toScore.length}; reusing from report: ${keptRows.length}`);
  console.log(`Report: ${opts.reportOut}`);
  console.log(`Map: ${opts.mapOut}`);
  console.log(`Min score for map: ${opts.minScore}`);
  console.log(`Provider: ${opts.provider} (active: ${providerMode})`);
  if (providerMode === 'gemini') console.log(`Model: ${opts.model}`);

  if (opts.dryRun) {
    console.log('\nDry run mode: no API calls, no files written.');
    return;
  }

  if (providerMode === 'gemini' && !apiKey) {
    throw new Error('GEMINI_API_KEY is required for score-sellable.');
  }

  const newlyScored = [];
  let fallbackTriggered = false;
  for (let i = 0; i < toScore.length; i += 1) {
    const filePath = toScore[i];
    const label = `[${i + 1}/${toScore.length}] ${path.relative(ROOT, filePath)}`;
    try {
      let analysis;
      let scoredBy = providerMode;
      if (providerMode === 'gemini') {
        const imageB64 = await toSmallBase64Jpeg(filePath, opts.maxDimension, opts.quality);
        analysis = await scoreWithGemini({
          apiBase: opts.apiBase,
          model: opts.model,
          apiKey,
          imageB64,
        });
      } else {
        analysis = await scoreWithLocalHeuristic(filePath);
      }
      newlyScored.push({
        file: filePath,
        fileRepoRelative: path.relative(ROOT, filePath).replace(/\\/g, '/'),
        scoredBy,
        ...analysis,
      });
      console.log(`${label} -> score ${analysis.score.toFixed(2)} (${analysis.recipeSuggestion}) [${scoredBy}]`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isQuota = /Gemini error 429|quota exceeded/i.test(message);
      if (opts.provider === 'auto' && providerMode === 'gemini' && isQuota) {
        providerMode = 'local';
        fallbackTriggered = true;
        console.warn(`${label} -> Gemini quota hit, switching remaining images to local scorer.`);
        i -= 1; // retry this image with local provider
        continue;
      }

      newlyScored.push({
        file: filePath,
        fileRepoRelative: path.relative(ROOT, filePath).replace(/\\/g, '/'),
        scoredBy: providerMode,
        score: 0,
        confidence: 0,
        sellable: false,
        marketFit: [],
        rationale: `scoring_failed: ${message.slice(0, 180)}`,
        editNeeded: false,
        editPrompt: '',
        recipeSuggestion: 'none',
      });
      console.warn(`${label} -> failed (${message})`);
    }
  }

  const reportRows = [...keptRows, ...newlyScored];
  const sorted = [...reportRows].sort((a, b) => b.score - a.score);
  const mapEntries = sorted
    .map((row) => toMapEntry(row.file, row, opts.minScore))
    .filter((x) => x !== null);

  const summary = {
    scanned: selected.length,
    sellableCount: reportRows.filter((r) => r.sellable).length,
    aboveThresholdCount: mapEntries.length,
    avgScore: Number(
      (
        reportRows.reduce((sum, row) => sum + safeNumber(row.score, 0), 0) / Math.max(reportRows.length, 1)
      ).toFixed(2),
    ),
  };

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    model: opts.model,
    providerRequested: opts.provider,
    providerEffective: providerMode,
    inputDir: opts.inputDir,
    minScoreForMap: opts.minScore,
    resume: opts.resume,
    retryFailed: opts.retryFailed,
    summary,
    results: sorted,
  };

  const mapPayload = { entries: mapEntries };

  await ensureParentDir(opts.reportOut);
  await ensureParentDir(opts.mapOut);
  await fs.writeFile(opts.reportOut, `${JSON.stringify(reportPayload, null, 2)}\n`, 'utf8');
  await fs.writeFile(opts.mapOut, `${JSON.stringify(mapPayload, null, 2)}\n`, 'utf8');

  console.log('\nDone.');
  console.log(`Report written: ${opts.reportOut}`);
  console.log(`Map written: ${opts.mapOut}`);
  if (fallbackTriggered) {
    console.log('Note: auto mode fell back from Gemini to local scoring after quota/rate-limit errors.');
  }
  console.log(
    `Summary: scanned=${summary.scanned}, sellable=${summary.sellableCount}, mapEntries=${summary.aboveThresholdCount}, avg=${summary.avgScore}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
