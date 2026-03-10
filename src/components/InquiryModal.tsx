import { useState, useEffect } from 'react';
import type { Photo } from '../types';

interface InquiryModalProps {
  photo: Photo;
  onClose: () => void;
}

type PrintSize = '8x10' | '11x14' | '16x20' | '20x24' | '24x30' | 'custom';
type PrintMedium = 'fine-art-paper' | 'canvas' | 'metal' | 'acrylic';
type PrintFinish = 'matte' | 'gloss' | 'lustre';

export default function InquiryModal({ photo, onClose }: InquiryModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [printSize, setPrintSize] = useState<PrintSize>('16x20');
  const [customSize, setCustomSize] = useState('');
  const [printMedium, setPrintMedium] = useState<PrintMedium>('fine-art-paper');
  const [printFinish, setPrintFinish] = useState<PrintFinish>('matte');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="w-full max-w-lg rounded-2xl border border-photo-border bg-photo-panel shadow-2xl p-8"
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-photo-border bg-photo-panel shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-photo-border px-6 py-5 sticky top-0 bg-photo-panel z-10">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {submitStatus === 'error' && 'There was an error submitting your inquiry.'}
          </div>

          {/* Photo Preview */}
          <div className="mb-6 pb-6 border-b border-photo-border">
            <p className="text-xs uppercase tracking-wider text-photo-muted mb-2">Selected Print</p>
            <p className="text-sm text-photo-fg italic">{photo.alt}</p>
          </div>

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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm uppercase tracking-wider text-photo-muted hover:text-photo-fg transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm uppercase tracking-wider bg-photo-accent text-photo-bg font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Request Invoice'}
            </button>
          </div>

          <p className="text-[0.65rem] text-photo-muted/80 text-center pt-2">
            After submission, you&apos;ll receive an invoice via email for payment via Zelle or Venmo.
          </p>
        </form>
      </div>
    </div>
  );
}
