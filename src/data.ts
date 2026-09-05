import type { PhotoCollection } from './types';
import type { Photo } from './types';
import galleryManifest from './gallery-manifest.json';

/**
 * Gallery layout is derived from gallery-manifest.json:
 * - `bw` / `color` / `redscale` → Greyscale / Full Spectrum / Redscale collections (array order = reel order)
 * - Row objects may include internal curation/orientation (not shown in the public UI)
 * - `about` → bare filenames at publish root (About page portrait only; not a gallery tab)
 */

const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
const galleryPhotosBase =
  (base.endsWith('/') ? base.slice(0, -1) : base) + '/photos/still-life';
const SUPPORTED_IMAGE_FILE = /\.(jpe?g|png|webp)$/i;

const ABOUT_MANIFEST_KEY = 'about';

const GREYSCALE_ID = 'greyscale';
const FULL_SPECTRUM_ID = 'full-spectrum';
const REDSCALE_ID = 'redscale';

const GALLERY_MANIFEST_KEYS = ['bw', 'color', 'redscale'] as const;

type ManifestRow =
  | string
  | {
      path: string;
      /** Pixel aspect from publish pipeline. */
      orientation?: string;
      /** Optional composition override for reel paging (portrait-style in landscape file). */
      reel_orientation?: string;
      palette?: string;
      vibe?: string[];
      versatility?: string[];
    };

type GalleryManifest = {
  about?: string[];
  bw?: ManifestRow[];
  color?: ManifestRow[];
  redscale?: ManifestRow[];
};

const IMPORT_NUMERIC_ONLY = /^import-\d+\.(jpe?g|webp)$/i;
const DIGITS_ONLY_FILENAME = /^\d+\.(jpe?g|webp)$/i;

function parseOrientationValue(raw: string | undefined): Photo['orientation'] {
  const o = raw?.trim().toLowerCase();
  if (o === 'horizontal' || o === 'vertical' || o === 'square') return o;
  return undefined;
}

/** Reel paging uses composition override when set, else pixel orientation. */
function parseReelOrientation(row: ManifestRow): Photo['orientation'] {
  if (typeof row === 'string') return undefined;
  return parseOrientationValue(row.reel_orientation) ?? parseOrientationValue(row.orientation);
}

function rowPath(manifestCategory: string, row: ManifestRow): string {
  const entry = typeof row === 'string' ? row : row.path;
  return normalizeManifestEntry(manifestCategory, entry);
}

function entryBasename(entry: string): string {
  return (entry.split('/').pop() ?? '').trim();
}

function normalizeManifestEntry(manifestCategory: string, entry: string): string {
  const normalized = entry.trim().replace(/^\/+/, '');
  if (!normalized) return '';
  if (normalized.includes('/')) return normalized;
  if (manifestCategory === 'bw' || manifestCategory === 'color' || manifestCategory === 'redscale') {
    return `${manifestCategory}/${normalized}`;
  }
  return normalized;
}

function selectGalleryEntries(entries: string[]): string[] {
  return entries.filter((entry) => {
    const lastSegment = entry.split('/').pop() ?? entry;
    return SUPPORTED_IMAGE_FILE.test(lastSegment);
  });
}

function classifyManifestEntry(entry: string):
  | { kind: 'public'; bucket: typeof GREYSCALE_ID | typeof FULL_SPECTRUM_ID | typeof REDSCALE_ID }
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
  if (normalized.startsWith('redscale/')) return { kind: 'public', bucket: REDSCALE_ID };
  return { kind: 'hidden', reason: 'unsupported_path' };
}

function resolveGalleryImagePath(collectionId: string, entry: string): string {
  const normalized = entry.trim().replace(/^\/+/, '');
  if (!normalized) return '';
  if (normalized.includes('/')) return `${galleryPhotosBase}/${normalized}`;
  return `${galleryPhotosBase}/${collectionId}/${normalized}`;
}

function photosFromRows(rows: { path: string; orientation?: Photo['orientation'] }[], collectionId: string) {
  return rows.map(({ path: entry, orientation }, i) => {
    const slug = entry.replace(/\.[^.]+$/, '').replace(/[^a-z0-9/_-]/gi, '_');
    return {
      id: `${collectionId}-${i + 1}`,
      src: resolveGalleryImagePath(collectionId, entry),
      alt: `Photograph ${slug.replace(/\//g, ' ')}`,
      caption: '',
      orientation,
    };
  });
}

function buildPublicCollections(): PhotoCollection[] {
  const raw = galleryManifest as GalleryManifest;
  const greyscaleRows: { path: string; orientation?: Photo['orientation'] }[] = [];
  const fullSpectrumRows: { path: string; orientation?: Photo['orientation'] }[] = [];
  const redscaleRows: { path: string; orientation?: Photo['orientation'] }[] = [];
  const seenGrey = new Set<string>();
  const seenColor = new Set<string>();
  const seenRedscale = new Set<string>();

  for (const manifestCategory of GALLERY_MANIFEST_KEYS) {
    const arr = raw[manifestCategory] ?? [];
    for (const rawEntry of arr) {
      const normalizedEntry = rowPath(manifestCategory, rawEntry);
      if (!normalizedEntry) continue;
      const ok = selectGalleryEntries([normalizedEntry]);
      if (ok.length === 0) continue;
      const entry = ok[0]!;
      const result = classifyManifestEntry(entry);
      if (result.kind !== 'public') continue;
      const orientation = parseReelOrientation(rawEntry);
      if (result.bucket === GREYSCALE_ID) {
        if (!seenGrey.has(entry)) {
          seenGrey.add(entry);
          greyscaleRows.push({ path: entry, orientation });
        }
      } else if (result.bucket === FULL_SPECTRUM_ID) {
        if (!seenColor.has(entry)) {
          seenColor.add(entry);
          fullSpectrumRows.push({ path: entry, orientation });
        }
      } else if (result.bucket === REDSCALE_ID) {
        if (!seenRedscale.has(entry)) {
          seenRedscale.add(entry);
          redscaleRows.push({ path: entry, orientation });
        }
      }
    }
  }

  return [
    {
      id: GREYSCALE_ID,
      title: 'Greyscale',
      photos: photosFromRows(greyscaleRows, GREYSCALE_ID),
    },
    {
      id: FULL_SPECTRUM_ID,
      title: 'Full Spectrum',
      photos: photosFromRows(fullSpectrumRows, FULL_SPECTRUM_ID),
    },
    {
      id: REDSCALE_ID,
      title: 'Redscale',
      photos: photosFromRows(redscaleRows, REDSCALE_ID),
    },
  ];
}

function resolveAboutImagePath(entry: string): string {
  const normalized = entry.trim().replace(/^\/+/, '');
  if (!normalized) return '';
  return `${galleryPhotosBase}/${normalized}`;
}

const manifest = galleryManifest as GalleryManifest;
const aboutFilename = (manifest[ABOUT_MANIFEST_KEY] ?? []).find((filename) =>
  SUPPORTED_IMAGE_FILE.test(typeof filename === 'string' ? filename : ''),
);
export const ABOUT_IMAGE_SRC = aboutFilename
  ? resolveAboutImagePath(typeof aboutFilename === 'string' ? aboutFilename : '')
  : `${galleryPhotosBase}/about_me.jpg`;

export const COLLECTIONS: PhotoCollection[] = buildPublicCollections();

export const GALLERY_FILTERS = COLLECTIONS.map((collection) => collection.id);
export const DEFAULT_GALLERY_FILTER = GALLERY_FILTERS[0] ?? '';

export const ABOUT = {
  name: 'adubsqz',
  tagline: 'Photography',
  contactEmail: 'info@adubsqz.shop',
  photoCredit: 'Photo captured by Cayla Holling.',
  bio: 'Originally from the Southwest, now residing in New York. By trade, a data scientist and software engineer at a biomolecular research company focused on fighting cancer. At night, the world of cinema, art, and storytelling awaits. Bobs your uncle, adubs is your nephew rolling tobacco by the dumpster to make it through a dull family reunion.',
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/adubsqz/' },
    { name: 'GitHub', url: 'https://github.com/adubsqz/' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/alexanderames/' },
  ],
};
