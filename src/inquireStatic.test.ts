import { describe, it, expect, vi, afterEach } from 'vitest';
import { submitPrintInquiry, type InquirePayload } from './inquireStatic';

const photo = { id: 'p1', src: '/photos/still-life/color/x.jpg', alt: 'Neon' };

function payload(extra: Partial<InquirePayload> = {}): InquirePayload {
  return {
    photo,
    name: 'Ada',
    email: 'ada@example.com',
    company: '',
    shippingAddress: '1 Main',
    size: '16x20',
    printMedium: 'fine-art-paper',
    printFinish: 'matte',
    notes: '',
    ...extra,
  };
}

describe('submitPrintInquiry', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses Web3Forms when the access key is set and the request succeeds', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', 'wk');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await submitPrintInquiry(payload({ company: 'Studio', notes: 'rush' }));
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.web3forms.com/submit',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(window.location.href).not.toMatch(/^mailto:/);
  });

  it('uses FormSubmit when Web3 is unset and FormSubmit succeeds', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', '');
    vi.stubEnv('VITE_FORMSUBMIT_EMAIL', 'inbox@example.com');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await submitPrintInquiry(payload());
    expect(fetchMock).toHaveBeenCalledWith(
      'https://formsubmit.co/ajax/inbox%40example.com',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('falls back to mailto when remote submit fails', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', 'wk');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const location = window.location;
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: Location }).location = { ...location, href: '' } as Location;
    await submitPrintInquiry(payload({ photo: { ...photo, alt: '' } }));
    expect(window.location.href).toContain('mailto:info@adubsqz.shop');
    expect(window.location.href).toContain(encodeURIComponent('Print inquiry: p1'));
  });

  it('falls back to mailto when fetch throws', async () => {
    vi.stubEnv('VITE_FORMSUBMIT_EMAIL', 'inbox@example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const location = window.location;
    delete (window as unknown as { location?: Location }).location;
    (window as unknown as { location: Location }).location = { ...location, href: '' } as Location;
    await submitPrintInquiry(payload());
    expect(window.location.href).toContain('mailto:');
  });
});
