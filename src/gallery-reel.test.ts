import { describe, it, expect } from 'vitest';
import { paginateByOrientation, reelLayoutFor } from './gallery-reel';
import type { Photo } from './types';

function p(id: string, orientation: Photo['orientation']): Photo {
  return { id, src: `/photos/still-life/color/${id}.jpg`, alt: id, orientation };
}

describe('paginateByOrientation', () => {
  it('never mixes orientations on one page', () => {
    const photos = [
      p('a', 'horizontal'),
      p('b', 'horizontal'),
      p('c', 'vertical'),
      p('d', 'horizontal'),
    ];
    const pages = paginateByOrientation(photos);
    expect(pages).toHaveLength(3);
    expect(pages[0]?.photos.map((x) => x.id)).toEqual(['a', 'b']);
    expect(pages[1]?.photos.map((x) => x.id)).toEqual(['c']);
    expect(pages[2]?.photos.map((x) => x.id)).toEqual(['d']);
  });

  it('caps horizontal pages at 2 and vertical at 2', () => {
    const photos = [
      p('h1', 'horizontal'),
      p('h2', 'horizontal'),
      p('h3', 'horizontal'),
      p('h4', 'horizontal'),
      p('v1', 'vertical'),
      p('v2', 'vertical'),
      p('v3', 'vertical'),
    ];
    const pages = paginateByOrientation(photos);
    expect(pages[0]?.photos).toHaveLength(2);
    expect(pages[1]?.photos).toHaveLength(2);
    expect(pages[2]?.photos).toHaveLength(2);
    expect(pages[3]?.photos).toHaveLength(1);
  });

  it('maps singleton vertical and empty lists', () => {
    expect(paginateByOrientation([])).toEqual([]);
    expect(reelLayoutFor(1, 'vertical')).toBe('vertical-solo');
    expect(reelLayoutFor(2, 'horizontal')).toBe('horizontal-duo');
    const square = paginateByOrientation([p('s', 'square')]);
    expect(square[0]?.orientation).toBe('square');
  });
});
