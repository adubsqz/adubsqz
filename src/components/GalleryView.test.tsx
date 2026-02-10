import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryView from './GalleryView';
import { COLLECTIONS } from '../data';

describe('GalleryView', () => {
  it('renders Gallery heading', () => {
    render(<GalleryView />);
    expect(screen.getByRole('heading', { name: /gallery/i })).toBeInTheDocument();
  });

  it('renders all collections with titles and descriptions', () => {
    render(<GalleryView />);
    COLLECTIONS.forEach((collection) => {
      expect(screen.getByRole('heading', { name: collection.title })).toBeInTheDocument();
      if (collection.description) {
        expect(screen.getByText(collection.description)).toBeInTheDocument();
      }
    });
  });

  it('renders all photos from collections', () => {
    render(<GalleryView />);
    COLLECTIONS.forEach((collection) => {
      collection.photos.forEach((photo) => {
        const img = screen.getByAltText(photo.alt);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', photo.src);
      });
    });
  });

  it('opens lightbox when a photo is clicked', async () => {
    const user = userEvent.setup();
    render(<GalleryView />);
    const firstPhoto = COLLECTIONS[0].photos[0];
    const img = screen.getByAltText(firstPhoto.alt);
    await user.click(img.closest('button')!);
    const dialog = screen.getByRole('dialog', { name: /image lightbox/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByAltText(firstPhoto.alt)).toBeInTheDocument();
  });

  it('shows Close button in lightbox', async () => {
    const user = userEvent.setup();
    render(<GalleryView />);
    const firstPhoto = COLLECTIONS[0].photos[0];
    await user.click(screen.getByAltText(firstPhoto.alt).closest('button')!);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('closes lightbox when Close is clicked', async () => {
    const user = userEvent.setup();
    render(<GalleryView />);
    const firstPhoto = COLLECTIONS[0].photos[0];
    await user.click(screen.getByAltText(firstPhoto.alt).closest('button')!);
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog', { name: /image lightbox/i })).not.toBeInTheDocument();
  });

  it('closes lightbox on Escape key', async () => {
    const user = userEvent.setup();
    render(<GalleryView />);
    const firstPhoto = COLLECTIONS[0].photos[0];
    await user.click(screen.getByAltText(firstPhoto.alt).closest('button')!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /image lightbox/i })).not.toBeInTheDocument();
  });
});
