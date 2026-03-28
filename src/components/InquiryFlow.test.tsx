import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Inquiry flow (functional)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens InquiryModal from a lightbox, submits, and auto-closes on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, messageId: 'm1' }),
    });

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

      // Fill required fields.
      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
      await user.type(
        screen.getByLabelText(/shipping address/i),
        '123 Main St\nNew York, NY 10001'
      );

      // Submit.
      await user.click(screen.getByRole('button', { name: /request invoice/i }));

      expect(fetchMock).toHaveBeenCalledTimes(1);

      expect(await screen.findByText(/inquiry submitted/i)).toBeInTheDocument();

      // Trigger the captured auto-close callback (scheduled for 2s).
      act(() => {
        autoCloseCb?.();
      });

      // Auto-close should remove the modal from the DOM.
      expect(screen.queryByText(/inquiry submitted/i)).not.toBeInTheDocument();
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });

  it('stays in the inquiry form and shows error when the API responds !ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'bad request' }),
    });

    const user = userEvent.setup();
    const { container } = render(<App />);

    const clickTarget = container.querySelector('.absolute.inset-0.z-10');
    if (!clickTarget) throw new Error('Photo click target not found');

    await user.click(clickTarget);
    const lightbox = await screen.findByRole('dialog', { name: /image lightbox/i });
    await user.click(within(lightbox).getByRole('button', { name: /request invoice/i }));

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/shipping address/i), '123 Main St\nNew York, NY 10001');

    await user.click(screen.getByRole('button', { name: /request invoice/i }));

    expect(await screen.findByText(/contact directly/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /request invoice/i })).toBeInTheDocument();
  });
});

