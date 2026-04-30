import type { PhotoCollection } from './types';
import galleryManifest from './gallery-manifest.json';

/**
 * Gallery layout is derived from gallery-manifest.json:
 * - Named files (not import-########.jpg / not digits-only names) under bw/ → Greyscale
 * - Same under color/ → Full Spectrum
 * - Legacy bw/color arrays with bare filenames are normalized to bw/<name> and color/<name>
 * - Everything else is excluded from the UI and listed in GALLERY_HIDDEN_REGISTRY
 */

const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
const stillLifeBase = (base.endsWith('/') ? base.slice(0, -1) : base) + '/photos/still-life';
const SUPPORTED_IMAGE_FILE = /\.(jpe?g|png|webp)$/i;
const ABOUT_KEY = 'still-life';

const GREYSCALE_ID = 'greyscale';
const FULL_SPECTRUM_ID = 'full-spectrum';

type GalleryManifest = {
  [category: string]: string[] | undefined;
  'still-life'?: string[];
};

export type HiddenGalleryEntry = {
  path: string;
  manifestCategory: string;
  reason: 'import_numeric' | 'numeric_only_filename' | 'unsupported_path' | 'unsupported_mime';
};

/** import-12345.jpg — back-burner batch filenames */
const IMPORT_NUMERIC_ONLY = /^import-\d+\.(jpe?g|webp)$/i;
/** 000230040012.jpg — frame roll numbers without a slug */
const DIGITS_ONLY_FILENAME = /^\d+\.(jpe?g|webp)$/i;

type ClassifyResult =
  | { kind: 'public'; bucket: typeof GREYSCALE_ID | typeof FULL_SPECTRUM_ID }
  | { kind: 'hidden'; reason: HiddenGalleryEntry['reason'] };

function entryBasename(entry: string): string {
  return (entry.split('/').pop() ?? '').trim();
}

function normalizeManifestEntry(manifestCategory: string, entry: string): string {
  const normalized = entry.trim().replace(/^\/+/, '');
  if (!normalized) return '';
  if (normalized.includes('/')) return normalized;
  if (manifestCategory === 'bw' || manifestCategory === 'color') return `${manifestCategory}/${normalized}`;
  return normalized;
}

function selectGalleryEntries(entries: string[]): string[] {
  return entries.filter((entry) => {
    const lastSegment = entry.split('/').pop() ?? entry;
    return SUPPORTED_IMAGE_FILE.test(lastSegment);
  });
}

function classifyEntry(entry: string): ClassifyResult {
  const normalized = entry.trim().replace(/^\/+/, '');
  const baseName = entryBasename(normalized);

  if (!SUPPORTED_IMAGE_FILE.test(baseName)) {
    return { kind: 'hidden', reason: 'unsupported_mime' };
  }
  if (IMPORT_NUMERIC_ONLY.test(baseName)) {
    return { kind: 'hidden', reason: 'import_numeric' };
  }
  if (DIGITS_ONLY_FILENAME.test(baseName)) {
    return { kind: 'hidden', reason: 'numeric_only_filename' };
  }
  if (normalized.startsWith('bw/')) return { kind: 'public', bucket: GREYSCALE_ID };
  if (normalized.startsWith('color/')) return { kind: 'public', bucket: FULL_SPECTRUM_ID };
  return { kind: 'hidden', reason: 'unsupported_path' };
}

function resolveGalleryImagePath(collectionId: string, entry: string): string {
  const normalized = entry.trim().replace(/^\/+/, '');
  if (!normalized) return '';
  if (normalized.includes('/')) return `${stillLifeBase}/${normalized}`;
  return `${stillLifeBase}/${collectionId}/${normalized}`;
}

function photosFromEntries(entries: string[], collectionId: string) {
  return entries.map((entry, i) => {
    const slug = entry.replace(/\.[^.]+$/, '').replace(/[^a-z0-9/_-]/gi, '_');
    return {
      id: `${collectionId}-${i + 1}`,
      src: resolveGalleryImagePath(collectionId, entry),
      alt: `Photograph ${slug.replace(/\//g, ' ')}`,
      caption: '',
    };
  });
}

function manifestGalleryCategories(manifest: GalleryManifest): string[] {
  return Object.keys(manifest)
    .filter((k) => k !== ABOUT_KEY && Array.isArray(manifest[k]))
    .sort();
}

function buildHiddenRegistry(): HiddenGalleryEntry[] {
  const raw = galleryManifest as GalleryManifest;
  const hidden: HiddenGalleryEntry[] = [];
  const seenHidden = new Set<string>();

  for (const manifestCategory of manifestGalleryCategories(raw)) {
    const arr = raw[manifestCategory] ?? [];
    for (const rawEntry of arr) {
      if (typeof rawEntry !== 'string') continue;
      const normalizedEntry = normalizeManifestEntry(manifestCategory, rawEntry);
      if (!normalizedEntry) continue;

      const ok = selectGalleryEntries([normalizedEntry]);
      if (ok.length === 0) {
        if (!seenHidden.has(normalizedEntry)) {
          seenHidden.add(normalizedEntry);
          hidden.push({ path: normalizedEntry, manifestCategory, reason: 'unsupported_mime' });
        }
        continue;
      }

      const entry = ok[0]!;
      const result = classifyEntry(entry);
      if (result.kind === 'hidden' && !seenHidden.has(entry)) {
        seenHidden.add(entry);
        hidden.push({ path: entry, manifestCategory, reason: result.reason });
      }
    }
  }
  return hidden;
}

function buildPublicCollections(): PhotoCollection[] {
  const raw = galleryManifest as GalleryManifest;
  const greyscalePaths: string[] = [];
  const fullSpectrumPaths: string[] = [];
  const seenGrey = new Set<string>();
  const seenColor = new Set<string>();

  for (const manifestCategory of manifestGalleryCategories(raw)) {
    const arr = raw[manifestCategory] ?? [];
    for (const rawEntry of arr) {
      if (typeof rawEntry !== 'string') continue;
      const normalizedEntry = normalizeManifestEntry(manifestCategory, rawEntry);
      if (!normalizedEntry) continue;
      const ok = selectGalleryEntries([normalizedEntry]);
      if (ok.length === 0) continue;
      const entry = ok[0]!;
      const result = classifyEntry(entry);
      if (result.kind !== 'public') continue;
      if (result.bucket === GREYSCALE_ID) {
        if (!seenGrey.has(entry)) {
          seenGrey.add(entry);
          greyscalePaths.push(entry);
        }
      } else {
        if (!seenColor.has(entry)) {
          seenColor.add(entry);
          fullSpectrumPaths.push(entry);
        }
      }
    }
  }

  return [
    { id: GREYSCALE_ID, title: 'Greyscale', photos: photosFromEntries(greyscalePaths, GREYSCALE_ID) },
    { id: FULL_SPECTRUM_ID, title: 'Full Spectrum', photos: photosFromEntries(fullSpectrumPaths, FULL_SPECTRUM_ID) },
  ];
}

function resolveAboutImagePath(entry: string): string {
  const normalized = entry.trim().replace(/^\/+/, '');
  if (!normalized) return '';
  return `${stillLifeBase}/${normalized}`;
}

const manifest = galleryManifest as GalleryManifest;
const aboutFilename = (manifest[ABOUT_KEY] ?? []).find((filename) => SUPPORTED_IMAGE_FILE.test(filename));
export const ABOUT_IMAGE_SRC = aboutFilename
  ? resolveAboutImagePath(aboutFilename)
  : `${stillLifeBase}/about_me.jpg`;

export const COLLECTIONS: PhotoCollection[] = buildPublicCollections();

export const GALLERY_FILTERS = COLLECTIONS.map((collection) => collection.id);
export const DEFAULT_GALLERY_FILTER = GALLERY_FILTERS[0] ?? '';

/** Entries excluded from the live gallery (review before re-enabling). */
export const GALLERY_HIDDEN_REGISTRY: readonly HiddenGalleryEntry[] = buildHiddenRegistry();

export const ABOUT = {
  name: 'adubsqz',
  tagline: 'Photography',
  contactEmail: 'adubsqz@gmail.com',
  bio: 'Originally from the Southwest, now residing in New York for several years, a rediscovered love for film photography, acting, and writing all came together, stars aligned, or dead weight dropped, either way. with film photography, first learning the craft in high school, spending long hours in the darkroom developing film and making silver prints—a passion that stayed dormant until recently. By trade, a data scientist and software engineer at a biomolecular research company focused on fighting cancer. At night, the world of cinema, art, and storytelling awaits. Bobs your uncle, adubs is your nephew rolling spliffs by the dumpster to make it through a dull family reunion.',
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/adubsqz/' },
    { name: 'GitHub', url: 'https://github.com' },
  ],
};
