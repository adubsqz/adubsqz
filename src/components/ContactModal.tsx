import { useState } from 'react';
import { ABOUT } from '../data';
import { FilmTvClearanceBlock, RightsReservedBlock, TearsheetAndFulfillmentGrid } from './LicensingDetails';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface ContactModalProps {
  onClose: () => void;
}

export default function ContactModal({ onClose }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const to = (ABOUT as { contactEmail?: string }).contactEmail ?? '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `From: ${name} (${email})\n\n${content}`;
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-photo-border bg-photo-panel px-5 py-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display">
              Contact
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-wider">
              Start a private licensing conversation
            </DialogDescription>
          </DialogHeader>
          <Button aria-label="Close" className="h-8 px-2 text-lg leading-none" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FilmTvClearanceBlock />
          <p className="text-xs text-photo-muted leading-relaxed">
            Licensing, syndication, and custom terms are handled privately by contract. Send a message to start that
            conversation—no public checkout.
          </p>
          <TearsheetAndFulfillmentGrid surface="modal" />
          <RightsReservedBlock className="bg-photo-bg/50" />
          <div>
            <label htmlFor="contact-name" className="block text-xs uppercase tracking-wider text-photo-muted mb-1">
              Name
            </label>
            <Input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-xs uppercase tracking-wider text-photo-muted mb-1">
              Email
            </label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-subject" className="block text-xs uppercase tracking-wider text-photo-muted mb-1">
              Subject
            </label>
            <Input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?"
              required
            />
          </div>
          <div>
            <label htmlFor="contact-content" className="block text-xs uppercase tracking-wider text-photo-muted mb-1">
              Message
            </label>
            <Textarea
              id="contact-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-y"
              placeholder="Your message..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Send
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
