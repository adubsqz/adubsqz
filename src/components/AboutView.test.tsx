import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutView from './AboutView';
import { ABOUT, ABOUT_IMAGE_SRC } from '../data';

describe('AboutView', () => {
  it('renders about content with name and tagline', () => {
    render(<AboutView />);
    expect(screen.getByText(ABOUT.name)).toBeInTheDocument();
    expect(screen.getByText(ABOUT.tagline)).toBeInTheDocument();
  });

  it('renders bio text', () => {
    render(<AboutView />);
    expect(screen.getByText(ABOUT.bio)).toBeInTheDocument();
  });

  it('renders portrait image with correct alt', () => {
    render(<AboutView />);
    const img = screen.getByAltText(/portrait, photographed on film/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', ABOUT_IMAGE_SRC);
  });

  it('renders photo credit under portrait', () => {
    render(<AboutView />);
    expect(screen.getByText(ABOUT.photoCredit)).toBeInTheDocument();
  });

  it('renders social links', () => {
    render(<AboutView />);
    ABOUT.socials.forEach((social) => {
      const link = screen.getByRole('link', { name: social.name });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', social.url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
