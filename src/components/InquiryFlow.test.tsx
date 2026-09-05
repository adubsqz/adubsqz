import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data')>();
  const fixture = {
    id: 'fixture-1',
    src: '/photos/still-life/bw/fixture-inquiry.jpg',
    alt: 'Photograph fixture_inquiry',
    caption: '',
  };
  return {
    ...actual,
    COLLECTIONS: [
      { ...actual.COLLECTIONS[0], photos: [fixture] },
      { ...actual.COLLECTIONS[1], photos: [] },
    ],
  };
});

import App from '../App';

describe('Inquiry flow (functional)', () => {
  beforeEach(() => {
    const location = window.location;
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: Location }).location = {
      ...location,
      href: '',
    } as Location;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens InquiryModal from a lightbox and submits via mailto', async () => {
    let autoCloseCb: (() => void) | undefined;
    const realSetTimeout = globalThis.setTimeout;
    const setTimeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((cb, ms?: number, ...args: unknown[]) => {
        if (ms === 2000) {
          autoCloseCb = () => {
            if (typeof cb === 'function') (cb as () => void)();
          };
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }
        return realSetTimeout(cb as Parameters<typeof setTimeout>[0], ms as number, ...args);
      });

    const user = userEvent.setup();
    const { container } = render(<App />);

    try {
      const clickTarget = container.querySelector('.absolute.inset-0.z-10');
      if (!clickTarget) throw new Error('Photo click target not found');

      await user.click(clickTarget);
      const lightbox = await screen.findByRole('dialog', { name: /image lightbox/i });
      expect(lightbox).toBeInTheDocument();

      await user.click(within(lightbox).getByRole('button', { name: /request invoice/i }));

      await user.type(await screen.findByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
      await user.type(
        screen.getByLabelText(/shipping address/i),
        '123 Main St\nNew York, NY 10001'
      );

      await user.click(screen.getByRole('button', { name: /submit inquiry/i }));

      expect(window.location.href).toContain('mailto:');
      expect(await screen.findByText(/inquiry submitted/i)).toBeInTheDocument();

      act(() => {
        autoCloseCb?.();
      });

      expect(screen.queryByText(/inquiry submitted/i)).not.toBeInTheDocument();
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });
});
