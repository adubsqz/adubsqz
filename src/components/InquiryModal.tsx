import { useState, useEffect } from 'react';
import type { Photo } from '../types';
import { FilmTvClearanceBlock, RightsReservedBlock, TearsheetAndFulfillmentGrid } from './LicensingDetails';
import WatermarkedImage from './WatermarkedImage';

interface InquiryModalProps {
  photo: Photo;
  /** Seed the notes field (e.g. tearsheet inquiry from the lightbox) */
  initialNotes?: string;
  onClose: () => void;
}

type PrintSize = '8x10' | '11x14' | '16x20' | '20x24' | '24x30' | 'custom';
type PrintMedium = 'fine-art-paper' | 'canvas' | 'metal' | 'acrylic';
type PrintFinish = 'matte' | 'gloss' | 'lustre';

export default function InquiryModal({ photo, initialNotes, onClose }: InquiryModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [printSize, setPrintSize] = useState<PrintSize>('16x20');
  const [customSize, setCustomSize] = useState('');
  const [printMedium, setPrintMedium] = useState<PrintMedium>('fine-art-paper');
  const [printFinish, setPrintFinish] = useState<PrintFinish>('matte');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setNotes(initialNotes ?? '');
  }, [initialNotes, photo.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/inquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoId: photo.id,
          photoAlt: photo.alt,
          photoSrc: photo.src,
          name,
          email,
          company,
          shippingAddress,
          printSize: printSize === 'custom' ? customSize : printSize,
          printMedium,
          printFinish,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit inquiry');
      }

      setSubmitStatus('success');
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Inquiry submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div
        className="fixed inset-0 z-[110] flex items-start justify-center bg-black/80 p-0 backdrop-blur-sm sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
      <div
        className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col justify-center p-8 sm:min-h-0 sm:flex-none sm:rounded-2xl sm:border sm:border-photo-border"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">✓</div>
            <h2 id="inquiry-modal-title" className="font-display text-2xl text-photo-fg mb-2">
              Inquiry Submitted
            </h2>
            <p className="text-photo-muted text-sm">
              Thank you for your interest. I&apos;ll review your request and send an invoice via email shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/80 p-0 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div
        className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none border-0 border-photo-border bg-photo-panel shadow-2xl sm:max-h-[min(94dvh,56rem)] sm:max-w-5xl sm:rounded-2xl sm:border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-photo-border bg-photo-panel px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 id="inquiry-modal-title" className="font-display text-xl text-photo-fg mb-1">
              Request Invoice
            </h2>
            <p className="text-xs text-photo-muted uppercase tracking-wider">
              Print-on-Demand Inquiry
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-photo-muted hover:text-photo-fg transition-colors p-1 disabled:opacity-40"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <aside className="order-2 flex min-h-0 w-full shrink-0 flex-col gap-4 overflow-y-auto overscroll-y-contain border-photo-border px-4 py-4 sm:px-6 lg:order-1 lg:w-[min(100%,26rem)] lg:border-r lg:py-5">
              <WatermarkedImage
                src={photo.src}
                alt=""
                loading="eager"
                decoding="sync"
                wrapperClassName="relative w-full overflow-hidden rounded-xl bg-black/35"
                className="max-h-52 w-full object-contain sm:max-h-60"
              />
              <div className="border-b border-photo-border pb-3">
                <p className="text-xs uppercase tracking-wider text-photo-muted mb-1">Selected print</p>
                <p className="text-sm text-photo-fg italic leading-snug">{photo.alt}</p>
              </div>
              <FilmTvClearanceBlock />
              <TearsheetAndFulfillmentGrid surface="modal" className="md:grid-cols-1" />
              <RightsReservedBlock className="bg-photo-bg/50" />
            </aside>

            <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col lg:order-2">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-4 py-4 sm:space-y-5 sm:px-6 lg:py-5">
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {submitStatus === 'error' && 'There was an error submitting your inquiry.'}
          </div>

          <p className="text-xs text-photo-muted leading-relaxed">
            Quotes, rights, and delivery timelines are confirmed in writing before work proceeds—use the form below
            to request an invoice for this print.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="inquiry-name" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="inquiry-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-2 focus:ring-photo-accent"
                placeholder="John Doe"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="inquiry-email" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="inquiry-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-2 focus:ring-photo-accent"
                placeholder="john@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="inquiry-company" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
              Company / Organization
            </label>
            <input
              id="inquiry-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-2 focus:ring-photo-accent"
              placeholder="Interior Design Studio"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="inquiry-address" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
              Shipping Address <span className="text-red-400">*</span>
            </label>
            <textarea
              id="inquiry-address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-2 focus:ring-photo-accent resize-y"
              placeholder="123 Main St, Suite 100&#10;New York, NY 10001"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="inquiry-size" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
              Print Size <span className="text-red-400">*</span>
            </label>
            <select
              id="inquiry-size"
              value={printSize}
              onChange={(e) => setPrintSize(e.target.value as PrintSize)}
              className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg focus:outline-none focus:ring-2 focus:ring-photo-accent"
              required
              disabled={isSubmitting}
            >
              <option value="8x10">8&quot; × 10&quot;</option>
              <option value="11x14">11&quot; × 14&quot;</option>
              <option value="16x20">16&quot; × 20&quot;</option>
              <option value="20x24">20&quot; × 24&quot;</option>
              <option value="24x30">24&quot; × 30&quot;</option>
              <option value="custom">Custom Size</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="inquiry-medium" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Print Medium
              </label>
              <select
                id="inquiry-medium"
                value={printMedium}
                onChange={(e) => setPrintMedium(e.target.value as PrintMedium)}
                className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg focus:outline-none focus:ring-2 focus:ring-photo-accent"
                disabled={isSubmitting}
              >
                <option value="fine-art-paper">Fine Art Paper</option>
                <option value="canvas">Canvas</option>
                <option value="metal">Metal</option>
                <option value="acrylic">Acrylic</option>
              </select>
            </div>
            <div>
              <label htmlFor="inquiry-finish" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Finish
              </label>
              <select
                id="inquiry-finish"
                value={printFinish}
                onChange={(e) => setPrintFinish(e.target.value as PrintFinish)}
                className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg focus:outline-none focus:ring-2 focus:ring-photo-accent"
                disabled={isSubmitting}
              >
                <option value="matte">Matte</option>
                <option value="gloss">Gloss</option>
                <option value="lustre">Lustre</option>
              </select>
            </div>
          </div>

          {printSize === 'custom' && (
            <div>
              <label htmlFor="inquiry-custom-size" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Custom Dimensions <span className="text-red-400">*</span>
              </label>
              <input
                id="inquiry-custom-size"
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-2 focus:ring-photo-accent"
                placeholder="e.g., 30x40 inches"
                required={printSize === 'custom'}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div>
            <label htmlFor="inquiry-notes" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
              Additional Notes
            </label>
            <textarea
              id="inquiry-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-photo-bg border border-photo-border rounded-lg px-4 py-2.5 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-2 focus:ring-photo-accent resize-y"
              placeholder="Special instructions, framing preferences, quantity, etc."
              disabled={isSubmitting}
            />
          </div>

          {submitStatus === 'error' && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-400">
                There was an error submitting your inquiry. Please try again or contact directly.
              </p>
            </div>
          )}

              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-photo-border bg-photo-panel px-4 py-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-photo-border bg-photo-bg px-5 py-3 text-sm font-medium uppercase tracking-wider text-photo-fg shadow-sm transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-photo-accent px-5 py-3 text-sm font-medium uppercase tracking-wider text-photo-bg shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Request Invoice'}
              </button>
            </div>
            <p className="mt-3 text-center text-[0.65rem] leading-snug text-photo-muted/80">
              After submission, you&apos;ll receive an invoice via email for payment via Zelle or Venmo.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
