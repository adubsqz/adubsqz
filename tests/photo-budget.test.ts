import { readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Do not raise this to hide a fat import. Recompress via gallery:import instead. */
export const MAX_PUBLISHED_STILL_BYTES = Math.floor(1.8 * 1024 * 1024);

const STILL_ROOT = join(process.cwd(), 'public/photos/still-life');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function listPublishedStills(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listPublishedStills(path));
      continue;
    }
    if (IMAGE_EXT.has(extname(entry.name).toLowerCase())) out.push(path);
  }
  return out;
}

describe('published still budget', () => {
  it('keeps every public JPEG web-sized', () => {
    const stills = listPublishedStills(STILL_ROOT);
    expect(stills.length).toBeGreaterThan(0);

    const oversized = stills
      .map((path) => ({ path, bytes: statSync(path).size }))
      .filter((row) => row.bytes > MAX_PUBLISHED_STILL_BYTES)
      .sort((a, b) => b.bytes - a.bytes);

    expect(
      oversized,
      oversized
        .map((row) => `${row.path} is ${row.bytes} bytes (max ${MAX_PUBLISHED_STILL_BYTES})`)
        .join('\n'),
    ).toEqual([]);
  });
});
