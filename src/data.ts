import type { PhotoCollection } from './types';
import galleryManifest from './gallery-manifest.json';

/**
 * Gallery layout is derived from gallery-manifest.json:
 * - `bw` / `color` → Greyscale / Full Spectrum collections
 * - `about` → bare filenames at publish root (About page portrait only; not a gallery tab)
 */

const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
const galleryPhotosBase =
  (base.endsWith('/') ? base.slice(0, -1) : base) + '/photos/still-life';
const SUPPORTED_IMAGE_FILE = /\.(jpe?g|png|webp)$/i;

const ABOUT_MANIFEST_KEY = 'about';

const GREYSCALE_ID = 'greyscale';
const FULL_SPECTRUM_ID = 'full-spectrum';

/** Manifest keys scanned for bw/color gallery rows only */
const GALLERY_MANIFEST_KEYS = ['bw', 'color'] as const;

type GalleryManifest = {
  about?: string[];
  bw?: string[];
  color?: string[];
};

/** import-12345.jpg — back-burner batch filenames */
const IMPORT_NUMERIC_ONLY = /^import-\d+\.(jpe?g|webp)$/i;
/** 000230040012.jpg — frame roll numbers without a slug */
const DIGITS_ONLY_FILENAME = /^\d+\.(jpe?g|webp)$/i;

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

function classifyManifestEntry(entry: string):
  | { kind: 'public'; bucket: typeof GREYSCALE_ID | typeof FULL_SPECTRUM_ID }
  | { kind: 'hidden'; reason: 'import_numeric' | 'numeric_only_filename' | 'unsupported_path' | 'unsupported_mime' } {
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
  if (normalized.includes('/')) return `${galleryPhotosBase}/${normalized}`;
  return `${galleryPhotosBase}/${collectionId}/${normalized}`;
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

function buildPublicCollections(): PhotoCollection[] {
  const raw = galleryManifest as GalleryManifest;
  const greyscalePaths: string[] = [];
  const fullSpectrumPaths: string[] = [];
  const seenGrey = new Set<string>();
  const seenColor = new Set<string>();

  for (const manifestCategory of GALLERY_MANIFEST_KEYS) {
    const arr = raw[manifestCategory] ?? [];
    for (const rawEntry of arr) {
      if (typeof rawEntry !== 'string') continue;
      const normalizedEntry = normalizeManifestEntry(manifestCategory, rawEntry);
      if (!normalizedEntry) continue;
      const ok = selectGalleryEntries([normalizedEntry]);
      if (ok.length === 0) continue;
      const entry = ok[0]!;
      const result = classifyManifestEntry(entry);
      if (result.kind !== 'public') continue;
      if (result.bucket === GREYSCALE_ID) {
        if (!seenGrey.has(entry)) {
          seenGrey.add(entry);
          greyscalePaths.push(entry);
        }
      } else if (result.bucket === FULL_SPECTRUM_ID) {
        if (!seenColor.has(entry)) {
          seenColor.add(entry);
          fullSpectrumPaths.push(entry);
        }
      }
    }
  }

  const out: PhotoCollection[] = [];
  if (greyscalePaths.length > 0) {
    out.push({ id: GREYSCALE_ID, title: 'Greyscale', photos: photosFromEntries(greyscalePaths, GREYSCALE_ID) });
  }
  if (fullSpectrumPaths.length > 0) {
    out.push({
      id: FULL_SPECTRUM_ID,
      title: 'Full Spectrum',
      photos: photosFromEntries(fullSpectrumPaths, FULL_SPECTRUM_ID),
    });
  }
  return out;
}

function resolveAboutImagePath(entry: string): string {
  const normalized = entry.trim().replace(/^\/+/, '');
  if (!normalized) return '';
  return `${galleryPhotosBase}/${normalized}`;
}

const manifest = galleryManifest as GalleryManifest;
const aboutFilename = (manifest[ABOUT_MANIFEST_KEY] ?? []).find((filename) =>
  SUPPORTED_IMAGE_FILE.test(filename),
);
export const ABOUT_IMAGE_SRC = aboutFilename
  ? resolveAboutImagePath(aboutFilename)
  : `${galleryPhotosBase}/about_me.jpg`;

export const COLLECTIONS: PhotoCollection[] = buildPublicCollections();

export const GALLERY_FILTERS = COLLECTIONS.map((collection) => collection.id);
export const DEFAULT_GALLERY_FILTER = GALLERY_FILTERS[0] ?? '';

export const ABOUT = {
  name: 'adubsqz',
  tagline: 'Photography',
  contactEmail: 'adubsqz@gmail.com',
  photoCredit: 'Photo captured by Cayla Holling.',
  bio: 'Originally from the Southwest, now residing in New York for several years, a rediscovered love for film photography, acting, and writing all came together, stars aligned, or dead weight dropped, either way. with film photography, first learning the craft in high school, spending long hours in the darkroom developing film and making silver prints—a passion that stayed dormant until recently. By trade, a data scientist and software engineer at a biomolecular research company focused on fighting cancer. At night, the world of cinema, art, and storytelling awaits. Bobs your uncle, adubs is your nephew rolling spliffs by the dumpster to make it through a dull family reunion.',
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/adubsqz/' },
    { name: 'GitHub', url: 'https://github.com' },
  ],
};
