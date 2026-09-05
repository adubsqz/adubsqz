import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AboutView from './AboutView';

describe('AboutView', () => {
  it('renders only the portfolio pitch, contact CTA, and rights block', () => {
    render(<AboutView />);
    expect(
      screen.getByText(/I design and build lightweight portfolio sites for photographers/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Licensing, prints, or a custom site/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contact me/i })).toBeInTheDocument();
    expect(screen.getByText(/rights reserved/i)).toBeInTheDocument();
    expect(screen.getByText(/copyright © 2026 Alexander Ames/i)).toBeInTheDocument();
    expect(screen.queryByAltText(/portrait/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /instagram/i })).not.toBeInTheDocument();
  });

  it('invokes onContactClick from CONTACT ME', async () => {
    const onContactClick = vi.fn();
    const user = userEvent.setup();
    render(<AboutView onContactClick={onContactClick} />);
    await user.click(screen.getByRole('button', { name: /contact me/i }));
    expect(onContactClick).toHaveBeenCalledTimes(1);
  });
});
