import { ABOUT } from './data';
import type { Photo } from './types';

export type InquirePayload = {
  photo: Photo;
  name: string;
  email: string;
  company: string;
  shippingAddress: string;
  size: string;
  printMedium: string;
  printFinish: string;
  notes: string;
};

function bodyText(p: InquirePayload): string {
  return [
    `From: ${p.name} (${p.email})`,
    p.company ? `Company: ${p.company}` : '',
    `Photo: ${p.photo.id}`,
    `Src: ${p.photo.src}`,
    `Size: ${p.size}`,
    `Medium: ${p.printMedium}`,
    `Finish: ${p.printFinish}`,
    `Ship to: ${p.shippingAddress}`,
    p.notes ? `Notes: ${p.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function mailto(p: InquirePayload): void {
  const subject = `Print inquiry: ${p.photo.alt || p.photo.id}`;
  window.location.href = `mailto:${ABOUT.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText(p))}`;
}

/** FormSubmit AJAX. No API key. First submission sends a confirm-the-email message. */
async function formsubmit(p: InquirePayload, to: string): Promise<boolean> {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: p.name,
      email: p.email,
      _subject: `Print inquiry: ${p.photo.alt || p.photo.id}`,
      message: bodyText(p),
    }),
  });
  return res.ok;
}

/** Web3Forms. Access key is meant for the browser. */
async function web3forms(p: InquirePayload, accessKey: string): Promise<boolean> {
  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `Print inquiry: ${p.photo.alt || p.photo.id}`,
      from_name: p.name,
      email: p.email,
      message: bodyText(p),
    }),
  });
  return res.ok;
}

export async function submitPrintInquiry(p: InquirePayload): Promise<void> {
  const web3 = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();
  const formTo = import.meta.env.VITE_FORMSUBMIT_EMAIL?.trim();
  try {
    if (web3) {
      if (await web3forms(p, web3)) return;
    } else if (formTo) {
      if (await formsubmit(p, formTo)) return;
    }
  } catch {
    // Fall through to mailto so a static host never eats a sale.
  }
  mailto(p);
}
