import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InquiryModal from './InquiryModal';
import type { Photo } from '../types';

describe('InquiryModal (unit)', () => {
  const onClose = vi.fn();
  const photo: Photo = { id: 'bw-1', src: '/photos/still-life/bw/000220500001.jpg', alt: 'Still life 1' };

  const fetchMock = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the inquiry form dialog', () => {
    render(<InquiryModal photo={photo} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: /request invoice/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shipping address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/print size/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request invoice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows the custom size input when selecting "custom"', async () => {
    const user = userEvent.setup();
    render(<InquiryModal photo={photo} onClose={onClose} />);

    const printSizeSelect = screen.getByLabelText(/print size/i);
    await user.selectOptions(printSizeSelect, 'custom');

    expect(screen.getByLabelText(/custom dimensions/i)).toBeInTheDocument();
  });

  it('submits the form and shows success, then calls onClose after 2s', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, messageId: 'm1' }),
    });

    const realSetTimeout = globalThis.setTimeout;
    const setTimeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((cb, ms?: number, ...args: unknown[]) => {
        // Auto-close is scheduled for 2s; for unit tests, run immediately.
        // Delegate all other timeouts to the real implementation so
        // Testing Library's internal polling isn't disrupted.
        if (ms === 2000) {
          if (typeof cb === 'function') (cb as () => void)();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }
        return realSetTimeout(cb as Parameters<typeof setTimeout>[0], ms as number, ...args);
      });

    try {
      const user = userEvent.setup();
      render(<InquiryModal photo={photo} onClose={onClose} />);

      await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
      await user.type(screen.getByLabelText(/shipping address/i), '123 Main St\nNew York, NY 10001');

      // Default print size is already selected; submit should succeed.
      const submitButton = screen.getByRole('button', { name: /request invoice/i });
      fireEvent.click(submitButton);

      // Flush the async submit handler (fetch + state updates).
      await act(async () => {
        await Promise.resolve();
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/inquire');
      expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');

      // Validate payload shape (without being overly strict about optional fields).
      const sentBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as Record<string, unknown>;
      expect(sentBody.photoId).toBe(photo.id);
      expect(sentBody.photoAlt).toBe(photo.alt);
      expect(sentBody.photoSrc).toBe(photo.src);
      expect(sentBody.name).toBe('Jane Doe');
      expect(sentBody.email).toBe('jane@example.com');
      expect(sentBody.shippingAddress).toContain('123 Main St');

      expect(screen.getByText(/inquiry submitted/i)).toBeInTheDocument();
      expect(onClose).toHaveBeenCalledTimes(1);

      const scheduledAutoClose = setTimeoutSpy.mock.calls.some((call) => call[1] === 2000);
      expect(scheduledAutoClose).toBe(true);
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });

  it('maps custom print size to the custom dimensions value', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, messageId: 'm1' }),
    });

    const user = userEvent.setup();
    render(<InquiryModal photo={photo} onClose={onClose} />);

    await user.selectOptions(screen.getByLabelText(/print size/i), 'custom');
    await user.type(screen.getByLabelText(/custom dimensions/i), '30x40 inches');
    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/shipping address/i), '123 Main St\nNew York, NY 10001');

    await user.click(screen.getByRole('button', { name: /request invoice/i }));

    const sentBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as Record<string, unknown>;
    expect(sentBody.printSize).toBe('30x40 inches');
  });

  it('shows an error state when the API responds with !ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'bad request' }),
    });

    const user = userEvent.setup();
    render(<InquiryModal photo={photo} onClose={onClose} />);

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/shipping address/i), '123 Main St\nNew York, NY 10001');

    await user.click(screen.getByRole('button', { name: /request invoice/i }));

    // There are two error messages in the DOM (sr-only live region + visible <p>),
    // so match the longer visible text to avoid ambiguity.
    expect(
      await screen.findByText(
        /there was an error submitting your inquiry\. please try again or contact directly\./i
      )
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

