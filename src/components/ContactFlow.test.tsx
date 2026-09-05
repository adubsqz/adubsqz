import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { ABOUT } from '../data';

describe('Contact me flow (functional)', () => {
  beforeEach(() => {
    const location = window.location;
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: Location }).location = {
      ...location,
      href: '',
    } as Location;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('submits contact via mailto:adubsqz@gmail.com when FormSubmit fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /about me/i }));
    await user.click(await screen.findByRole('button', { name: /contact me/i }));

    expect(await screen.findByRole('dialog', { name: /contact/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/name/i), 'Jane');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Hello');
    await user.type(screen.getByLabelText(/message/i), 'Hi there');

    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(window.location.href).toContain('mailto:adubsqz@gmail.com');
    expect(window.location.href).toContain(ABOUT.contactEmail ?? '');
    expect(window.location.href).toContain('subject=');
    expect(window.location.href).toContain(encodeURIComponent('Hello'));
    expect(window.location.href).toContain(encodeURIComponent('Jane'));
    expect(window.location.href).toContain(encodeURIComponent('jane@example.com'));
    expect(window.location.href).toContain(encodeURIComponent('Hi there'));

    expect(screen.queryByRole('dialog', { name: /contact/i })).not.toBeInTheDocument();
  });

  it('posts CONTACT ME to FormSubmit at adubsqz@gmail.com when fetch succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /about me/i }));
    await user.click(await screen.findByRole('button', { name: /contact me/i }));
    await user.type(screen.getByLabelText(/name/i), 'Jane');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Hello');
    await user.type(screen.getByLabelText(/message/i), 'Hi there');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      `https://formsubmit.co/ajax/${encodeURIComponent('adubsqz@gmail.com')}`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(window.location.href).not.toMatch(/^mailto:/);
    expect(screen.queryByRole('dialog', { name: /contact/i })).not.toBeInTheDocument();
  });
});
