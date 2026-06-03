import { describe, it, expect } from 'vitest';
import { escapeHtml, isSafePhotoSrc, isValidInquiryEmail } from '../api/inquireEmail.ts';

describe('inquireEmail helpers', () => {
  it('escapeHtml neutralizes markup', () => {
    expect(escapeHtml('<b>"x"</b>')).toBe('&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
  });

  it('isValidInquiryEmail accepts normal addresses', () => {
    expect(isValidInquiryEmail('info@adubsqz.shop')).toBe(true);
    expect(isValidInquiryEmail('not-an-email')).toBe(false);
  });

  it('isSafePhotoSrc allows relative gallery paths only when safe', () => {
    expect(isSafePhotoSrc('/photos/still-life/bw/1.jpg')).toBe(true);
    expect(isSafePhotoSrc('javascript:alert(1)')).toBe(false);
    expect(isSafePhotoSrc('https://adubs.shop/photos/1.jpg')).toBe(true);
  });
});
