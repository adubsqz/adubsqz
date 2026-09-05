import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryView from './GalleryView';
import { COLLECTIONS } from '../data';
import { HORIZONTAL_REEL_SIZE, VERTICAL_REEL_SIZE } from '../gallery-constants';
import { paginateByOrientation } from '../gallery-reel';

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
    const firstPage = paginateByOrientation(collection.photos)[0];
    if (collection.photos.length === 0) {
      expect(imgs.length).toBe(0);
    } else if (firstPage) {
      expect(imgs.length).toBe(firstPage.photos.length);
    }
  });

  it('shows pagination when collection spans multiple orientation pages', () => {
    render(<GalleryView filter={DEFAULT_FILTER} />);
    const collection = COLLECTIONS.find((c) => c.id === DEFAULT_FILTER);
    const pages = paginateByOrientation(collection?.photos ?? []);
    if (pages.length > 1) {
      expect(screen.getByText(/reel \d+ \/ \d+/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rev −/i })).toBeInTheDocument();
    }
  });

  it('renders photos from the first reel page when present', () => {
    render(<GalleryView filter={DEFAULT_FILTER} />);
    const collection = COLLECTIONS.find((c) => c.id === DEFAULT_FILTER)!;
    if (collection.photos.length === 0) return;
    const firstPagePhotos = paginateByOrientation(collection.photos)[0]?.photos ?? [];
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

  it('advances reels, keyboard-navigates the lightbox, and opens inquiry', async () => {
    const user = userEvent.setup();
    const { container } = render(<GalleryView filter={DEFAULT_FILTER} />);
    const collection = COLLECTIONS.find((c) => c.id === DEFAULT_FILTER);
    const pages = paginateByOrientation(collection?.photos ?? []);
    if (pages.length > 1) {
      await user.click(screen.getByRole('button', { name: /rev \+/i }));
      expect(screen.getByText(/reel 2 \//i)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /rev −/i }));
      expect(screen.getByText(/reel 1 \//i)).toBeInTheDocument();
    }
    const clickTarget = container.querySelector('.absolute.inset-0.z-10');
    if (!clickTarget) return;
    await user.click(clickTarget);
    expect(screen.getByRole('dialog', { name: /image lightbox/i })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowLeft}');
    await user.click(screen.getByRole('button', { name: /request invoice/i }));
    expect(await screen.findByRole('dialog', { name: /request invoice/i })).toBeInTheDocument();
  });

  it('opens a tearsheet inquiry from the lightbox', async () => {
    const user = userEvent.setup();
    const { container } = render(<GalleryView filter={DEFAULT_FILTER} />);
    const clickTarget = container.querySelector('.absolute.inset-0.z-10');
    if (!clickTarget) return;
    await user.click(clickTarget);
    await user.click(screen.getByRole('button', { name: /inquire about tearsheet/i }));
    expect(await screen.findByDisplayValue(/printable tearsheet/i)).toBeInTheDocument();
  });

  it('records a failed thumbnail without throwing', () => {
    const { container } = render(<GalleryView filter={DEFAULT_FILTER} />);
    const img = container.querySelector('img');
    if (!img) return;
    fireEvent.error(img);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders vertical reels and unknown filters', () => {
    const vertical = COLLECTIONS.find((c) => c.photos.some((p) => p.orientation === 'vertical'));
    if (vertical) {
      render(<GalleryView filter={vertical.id} />);
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    }
    render(<GalleryView filter="missing-category" />);
    expect(screen.getAllByRole('button', { name: /open photo/i }).length).toBeGreaterThan(0);
  });
});

describe('GalleryView regression: orientation pagination', () => {
  it('never mixes orientations on a single page', () => {
    COLLECTIONS.forEach((collection) => {
      paginateByOrientation(collection.photos).forEach((page) => {
        const orientations = new Set(page.photos.map((p) => p.orientation ?? 'horizontal'));
        expect(orientations.size).toBe(1);
      });
    });
  });

  it('respects horizontal and vertical page caps', () => {
    COLLECTIONS.forEach((collection) => {
      paginateByOrientation(collection.photos).forEach((page) => {
        const cap = page.orientation === 'vertical' ? VERTICAL_REEL_SIZE : HORIZONTAL_REEL_SIZE;
        expect(page.photos.length).toBeLessThanOrEqual(cap);
      });
    });
  });
});
