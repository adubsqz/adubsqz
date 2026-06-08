import type { Photo } from './types';
import { HORIZONTAL_REEL_SIZE, VERTICAL_REEL_SIZE } from './gallery-constants';

export type PhotoOrientation = NonNullable<Photo['orientation']>;

/** One reel page — single orientation, fixed capacity per orientation. */
export type OrientationPage = {
  photos: Photo[];
  orientation: PhotoOrientation;
};

function photoOrientation(photo: Photo): PhotoOrientation {
  return photo.orientation ?? 'horizontal';
}

export function pageSizeFor(orientation: PhotoOrientation): number {
  return orientation === 'vertical' ? VERTICAL_REEL_SIZE : HORIZONTAL_REEL_SIZE;
}

export type ReelLayout = 'hero' | 'horizontal-duo' | 'horizontal-trio' | 'vertical-solo' | 'vertical-duo';

export function reelLayoutFor(count: number, orientation: PhotoOrientation): ReelLayout {
  if (orientation === 'vertical') {
    return count === 1 ? 'vertical-solo' : 'vertical-duo';
  }
  if (count === 1) return 'hero';
  if (count === 2) return 'horizontal-duo';
  return 'horizontal-trio';
}

/**
 * Paginate without mixing orientations on the same reel page (preserves manifest order).
 * Horizontal/square pages hold up to 3; vertical pages hold up to 2.
 */
export function paginateByOrientation(photos: Photo[]): OrientationPage[] {
  if (photos.length === 0) return [];

  const pages: OrientationPage[] = [];
  let current: Photo[] = [];
  let currentOrientation: PhotoOrientation | null = null;

  const flush = () => {
    if (current.length === 0 || currentOrientation === null) return;
    pages.push({ photos: current, orientation: currentOrientation });
    current = [];
    currentOrientation = null;
  };

  for (const photo of photos) {
    const o = photoOrientation(photo);
    if (currentOrientation !== null && o !== currentOrientation) flush();
    const cap = pageSizeFor(currentOrientation ?? o);
    if (current.length >= cap) flush();
    if (currentOrientation === null) currentOrientation = o;
    current.push(photo);
  }
  flush();
  return pages;
}
