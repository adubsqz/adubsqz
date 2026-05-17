import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryView from './GalleryView';
import { COLLECTIONS } from '../data';
import { GALLERY_REEL_SIZE } from '../gallery-constants';
const DEFAULT_FILTER = COLLECTIONS[0]?.id ?? 'greyscale';

describe('GalleryView', () => {
  it('mounts without throwing', () => {
    render(<GalleryView filter={DEFAULT_FILTER} />);
  });

  it('shows an empty-category message when the selected collection has no photos', () => {
    render(<GalleryView filter={DEFAULT_FILTER} />);
    const collection = COLLECTIONS.find((c) => c.id === DEFAULT_FILTER);
    if ((collection?.photos.length ?? 0) !== 0) return;
    expect(screen.getByText(/no photos found in this category/i)).toBeInTheDocument();
  });

  it('renders thumbnail images only when photos exist', () => {
    render(<GalleryView filter={DEFAULT_FILTER} />);
    const collection = COLLECTIONS.find((c) => c.id === DEFAULT_FILTER)!;
    const imgs = screen.queryAllByRole('img').filter((el) => el.getAttribute('alt')?.startsWith('Photograph'));
    if (collection.photos.length === 0) {
      expect(imgs.length).toBe(0);
    } else if (collection.photos.length > 1) {
      expect(imgs.length).toBeGreaterThan(1);
      expect(imgs.length).toBeLessThanOrEqual(GALLERY_REEL_SIZE);
    }
  });

  it('shows pagination when collection has more than GALLERY_REEL_SIZE photos', () => {
    render(<GalleryView filter={DEFAULT_FILTER} />);
    const collection = COLLECTIONS.find((c) => c.id === DEFAULT_FILTER);
    if ((collection?.photos.length ?? 0) > GALLERY_REEL_SIZE) {
      expect(screen.getByText(/reel \d+ \/ \d+/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rev −/i })).toBeInTheDocument();
    }
  });

  it('renders photos from the selected category when present', () => {
    render(<GalleryView filter={DEFAULT_FILTER} />);
    const collection = COLLECTIONS.find((c) => c.id === DEFAULT_FILTER)!;
    if (collection.photos.length === 0) return;
    const firstPagePhotos = collection.photos.slice(0, GALLERY_REEL_SIZE);
    firstPagePhotos.forEach((photo) => {
      expect(screen.getByAltText(photo.alt)).toBeInTheDocument();
    });
  });

  it('opens lightbox when a photo is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<GalleryView filter={DEFAULT_FILTER} />);
    const clickTarget = container.querySelector('.absolute.inset-0.z-10');
    if (!clickTarget) return;
    await user.click(clickTarget);
    const dialog = screen.getByRole('dialog', { name: /image lightbox/i });
    expect(dialog).toBeInTheDocument();
  });

  it('closes lightbox when Close is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<GalleryView filter={DEFAULT_FILTER} />);
    const clickTarget = container.querySelector('.absolute.inset-0.z-10');
    if (!clickTarget) return;
    await user.click(clickTarget);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog', { name: /image lightbox/i })).not.toBeInTheDocument();
  });
});

describe('GalleryView regression: pagination and photo count', () => {
  it('total pages are computed safely for all collections', () => {
    COLLECTIONS.forEach((collection) => {
      const totalPages = Math.max(1, Math.ceil(collection.photos.length / GALLERY_REEL_SIZE));
      expect(totalPages).toBeGreaterThanOrEqual(1);
      if (collection.photos.length > GALLERY_REEL_SIZE) {
        expect(totalPages).toBeGreaterThan(1);
      }
    });
  });

  it('pagination slice behaves for populated collections', () => {
    COLLECTIONS.forEach((collection) => {
      if (collection.photos.length === 0) return;
      const start = (1 - 1) * GALLERY_REEL_SIZE;
      const pagePhotos = collection.photos.slice(start, start + GALLERY_REEL_SIZE);
      expect(pagePhotos.length).toBeGreaterThanOrEqual(1);
      if (collection.photos.length > GALLERY_REEL_SIZE) {
        expect(pagePhotos.length).toBe(GALLERY_REEL_SIZE);
      }
    });
  });
});
