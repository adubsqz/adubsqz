import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ABOUT } from '../data';

describe('Contact me flow (functional)', () => {
  beforeEach(() => {
    // Prevent jsdom navigation when ContactModal sets `window.location.href` to a mailto URL.
    const location = window.location;
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: Location }).location = {
      ...location,
      href: '',
    } as Location;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits contact form from the About page and closes the modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /about/i }));
    await user.click(screen.getByRole('button', { name: /contact me/i }));

    expect(screen.getByRole('dialog', { name: /contact/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/name/i), 'Jane');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Hello');
    await user.type(screen.getByLabelText(/message/i), 'Hi there');

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(window.location.href).toContain('mailto:');
    expect(window.location.href).toContain(ABOUT.contactEmail ?? '');
    expect(window.location.href).toContain('subject=');
    expect(window.location.href).toContain(encodeURIComponent('Hello'));
    expect(window.location.href).toContain(encodeURIComponent('Jane'));
    expect(window.location.href).toContain(encodeURIComponent('jane@example.com'));
    expect(window.location.href).toContain(encodeURIComponent('Hi there'));

    expect(screen.queryByRole('dialog', { name: /contact/i })).not.toBeInTheDocument();
  });
});

