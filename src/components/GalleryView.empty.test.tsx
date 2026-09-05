import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../data', () => ({
  COLLECTIONS: [{ id: 'greyscale', title: 'Greyscale', photos: [] }],
}));

import GalleryView from './GalleryView';

describe('GalleryView empty collection', () => {
  it('shows the empty-category message', () => {
    render(<GalleryView filter="greyscale" />);
    expect(screen.getByText(/no photos found in this category/i)).toBeInTheDocument();
  });
});
