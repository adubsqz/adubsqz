import { describe, it, expect, vi, afterEach } from 'vitest';
import { submitPrintInquiry, submitContactMessage, type InquirePayload } from './inquireStatic';
import { ABOUT } from './data';

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

function stubLocation() {
  const location = window.location;
  delete (window as unknown as { location?: Location }).location;
  (window as unknown as { location: Location }).location = { ...location, href: '' } as Location;
}

describe('submitPrintInquiry', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses Web3Forms when the access key is set and the request succeeds', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', 'wk');
    stubLocation();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await submitPrintInquiry(payload({ company: 'Studio', notes: 'rush' }));
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.web3forms.com/submit',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(window.location.href).not.toMatch(/^mailto:/);
  });

  it('uses FormSubmit to adubsqz@gmail.com when Web3 is unset and FormSubmit succeeds', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', '');
    vi.stubEnv('VITE_FORMSUBMIT_EMAIL', '');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await submitPrintInquiry(payload());
    expect(fetchMock).toHaveBeenCalledWith(
      `https://formsubmit.co/ajax/${encodeURIComponent(ABOUT.contactEmail)}`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(ABOUT.contactEmail).toBe('adubsqz@gmail.com');
  });

  it('honors VITE_FORMSUBMIT_EMAIL when set', async () => {
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

  it('falls back to mailto:adubsqz@gmail.com when remote submit fails', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', 'wk');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    stubLocation();
    await submitPrintInquiry(payload({ photo: { ...photo, alt: '' } }));
    expect(window.location.href).toContain('mailto:adubsqz@gmail.com');
    expect(window.location.href).toContain(encodeURIComponent('Print inquiry: p1'));
  });

  it('falls back to mailto when fetch throws', async () => {
    vi.stubEnv('VITE_FORMSUBMIT_EMAIL', 'inbox@example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    stubLocation();
    await submitPrintInquiry(payload());
    expect(window.location.href).toContain('mailto:adubsqz@gmail.com');
  });
});

describe('submitContactMessage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts contact mail to FormSubmit at adubsqz@gmail.com', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', '');
    stubLocation();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await submitContactMessage({
      name: 'Jane',
      email: 'jane@example.com',
      subject: 'Hello',
      message: 'Hi there',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://formsubmit.co/ajax/${encodeURIComponent('adubsqz@gmail.com')}`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(window.location.href).not.toMatch(/^mailto:/);
  });

  it('falls back to mailto:adubsqz@gmail.com when FormSubmit fails', async () => {
    vi.stubEnv('VITE_WEB3FORMS_ACCESS_KEY', '');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    stubLocation();
    await submitContactMessage({
      name: 'Jane',
      email: 'jane@example.com',
      subject: 'Hello',
      message: 'Hi there',
    });
    expect(window.location.href).toContain('mailto:adubsqz@gmail.com');
    expect(window.location.href).toContain(encodeURIComponent('Hello'));
  });
});
