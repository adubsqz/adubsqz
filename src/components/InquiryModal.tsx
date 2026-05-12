import { useState, useEffect } from 'react';
import type { Photo } from '../types';
import { FilmTvClearanceBlock, RightsReservedBlock, TearsheetAndFulfillmentGrid } from './LicensingDetails';
import WatermarkedImage from './WatermarkedImage';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';

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
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xl p-8">
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">✓</div>
            <DialogTitle className="font-display text-2xl mb-2">
              Inquiry Submitted
            </DialogTitle>
            <p className="text-photo-muted text-sm">
              Thank you for your interest. I&apos;ll review your request and send an invoice via email shortly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="h-[100dvh] max-h-[100dvh] max-w-none rounded-none border-0 p-0 sm:max-h-[min(94dvh,56rem)] sm:max-w-5xl sm:rounded-2xl sm:border">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-photo-border bg-photo-panel px-4 py-4 sm:px-6 sm:py-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display mb-1">
              Request Invoice
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-wider">
              Print-on-Demand Inquiry
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 px-2 text-lg leading-none"
            variant="ghost"
            aria-label="Close"
          >
            ×
          </Button>
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
                Full Name <span className="text-photo-muted">*</span>
              </label>
              <Input
                id="inquiry-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-2.5"
                placeholder="John Doe"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="inquiry-email" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Email <span className="text-photo-muted">*</span>
              </label>
              <Input
                id="inquiry-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2.5"
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
            <Input
              id="inquiry-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="px-4 py-2.5"
              placeholder="Interior Design Studio"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="inquiry-address" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
              Shipping Address <span className="text-photo-muted">*</span>
            </label>
            <Textarea
              id="inquiry-address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              className="resize-y px-4 py-2.5"
              placeholder="123 Main St, Suite 100&#10;New York, NY 10001"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="inquiry-size" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
              Print Size <span className="text-photo-muted">*</span>
            </label>
            <Select
              id="inquiry-size"
              value={printSize}
              onChange={(e) => setPrintSize(e.target.value as PrintSize)}
              className="px-4 py-2.5"
              required
              disabled={isSubmitting}
            >
              <option value="8x10">8&quot; × 10&quot;</option>
              <option value="11x14">11&quot; × 14&quot;</option>
              <option value="16x20">16&quot; × 20&quot;</option>
              <option value="20x24">20&quot; × 24&quot;</option>
              <option value="24x30">24&quot; × 30&quot;</option>
              <option value="custom">Custom Size</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="inquiry-medium" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Print Medium
              </label>
              <Select
                id="inquiry-medium"
                value={printMedium}
                onChange={(e) => setPrintMedium(e.target.value as PrintMedium)}
                className="px-4 py-2.5"
                disabled={isSubmitting}
              >
                <option value="fine-art-paper">Fine Art Paper</option>
                <option value="canvas">Canvas</option>
                <option value="metal">Metal</option>
                <option value="acrylic">Acrylic</option>
              </Select>
            </div>
            <div>
              <label htmlFor="inquiry-finish" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Finish
              </label>
              <Select
                id="inquiry-finish"
                value={printFinish}
                onChange={(e) => setPrintFinish(e.target.value as PrintFinish)}
                className="px-4 py-2.5"
                disabled={isSubmitting}
              >
                <option value="matte">Matte</option>
                <option value="gloss">Gloss</option>
                <option value="lustre">Lustre</option>
              </Select>
            </div>
          </div>

          {printSize === 'custom' && (
            <div>
              <label htmlFor="inquiry-custom-size" className="block text-xs uppercase tracking-wider text-photo-muted mb-2">
                Custom Dimensions <span className="text-photo-muted">*</span>
              </label>
              <Input
                id="inquiry-custom-size"
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                className="px-4 py-2.5"
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
            <Textarea
              id="inquiry-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-y px-4 py-2.5"
              placeholder="Special instructions, framing preferences, quantity, etc."
              disabled={isSubmitting}
            />
          </div>

          {submitStatus === 'error' && (
            <div className="p-3 bg-white/[0.04] border border-photo-border/60 rounded-lg">
              <p className="text-sm text-photo-muted">
                There was an error submitting your inquiry. Please try again or contact directly.
              </p>
            </div>
          )}

              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-photo-border bg-photo-panel px-4 py-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-5 py-3"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-5 py-3"
              >
                {isSubmitting ? 'Submitting...' : 'Request Invoice'}
              </Button>
            </div>
            <p className="mt-3 text-center text-[0.65rem] leading-snug text-photo-muted/80">
              After submission, you&apos;ll receive an invoice via email for payment via Zelle or Venmo.
            </p>
          </div>
        </form>
    </DialogContent>
    </Dialog>
  );
}
