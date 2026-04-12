import { useState, useEffect } from 'react';
import { ABOUT } from '../data';
import { FilmTvClearanceBlock, TearsheetAndFulfillmentGrid } from './LicensingDetails';

interface ContactModalProps {
  onClose: () => void;
}

export default function ContactModal({ onClose }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const to = (ABOUT as { contactEmail?: string }).contactEmail ?? '';

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `From: ${name} (${email})\n\n${content}`;
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-photo-border bg-photo-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-photo-border px-5 py-4 sticky top-0 bg-photo-panel z-10">
          <h2 id="contact-modal-title" className="font-display text-xl text-photo-fg">
            Contact
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-photo-muted hover:text-photo-fg transition-colors p-1"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FilmTvClearanceBlock />
          <p className="text-xs text-photo-muted leading-relaxed">
            Licensing, syndication, and custom terms are handled privately by contract. Send a message to start that
            conversation—no public checkout.
          </p>
          <TearsheetAndFulfillmentGrid surface="modal" />
          <div>
            <label htmlFor="contact-name" className="block text-xs uppercase tracking-wider text-photo-muted mb-1">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-photo-bg border border-photo-border rounded-lg px-3 py-2 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-1 focus:ring-photo-accent"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-xs uppercase tracking-wider text-photo-muted mb-1">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-photo-bg border border-photo-border rounded-lg px-3 py-2 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-1 focus:ring-photo-accent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-subject" className="block text-xs uppercase tracking-wider text-photo-muted mb-1">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-photo-bg border border-photo-border rounded-lg px-3 py-2 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-1 focus:ring-photo-accent"
              placeholder="What's this about?"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-content" className="block text-xs uppercase tracking-wider text-photo-muted mb-1">
              Message
            </label>
            <textarea
              id="contact-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-photo-bg border border-photo-border rounded-lg px-3 py-2 text-photo-fg placeholder-photo-muted/60 focus:outline-none focus:ring-1 focus:ring-photo-accent resize-y"
              placeholder="Your message..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm uppercase tracking-wider text-photo-muted hover:text-photo-fg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-sm uppercase tracking-wider bg-photo-accent text-photo-bg font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
