import { useState } from 'react';
import type { PageView } from './types';
import GalleryView from './components/GalleryView';
import AboutView from './components/AboutView';
import ContactModal from './components/ContactModal';

const NAV_ITEMS: { id: PageView; label: string }[] = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'about', label: 'About' },
];

export default function App() {
  const [view, setView] = useState<PageView>('gallery');
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-screen text-photo-fg font-sans antialiased">
      <div className="relative min-h-screen">

        <main className="relative max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col md:flex-row gap-10 md:gap-16">
          <aside className="md:w-1/3 space-y-8 md:space-y-10 md:sticky md:top-12 self-start">
            <nav className="space-y-3">
              {NAV_ITEMS.map((item) => {
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    className={`group w-full text-left flex items-center gap-3 text-xs tracking-[0.22em] uppercase transition-colors ${
                      active ? 'text-photo-accent' : 'text-photo-muted hover:text-photo-fg'
                    }`}
                  >
                    <span
                      className={`h-px w-8 transition-all ${
                        active ? 'bg-photo-accent w-10' : 'bg-photo-border group-hover:bg-photo-fg'
                      }`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="text-[0.65rem] text-photo-muted max-w-xs leading-relaxed">
              I made this site and hosted it for free (and so could you).{' '}
              <button
                type="button"
                onClick={() => setShowContact(true)}
                className="text-photo-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-photo-accent rounded"
              >
                Contact me
              </button>
              {' '}if you&apos;re interested.
            </div>
          </aside>
          {showContact && <ContactModal onClose={() => setShowContact(false)} />}

          <section className="md:flex-1">
            <div className="rounded-3xl bg-photo-panel/95 shadow-[0_26px_80px_rgba(0,0,0,0.9)] backdrop-blur-md p-5 sm:p-7 md:p-8 animate-fade-up">
              {view === 'gallery' && <GalleryView />}
              {view === 'about' && <AboutView />}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
