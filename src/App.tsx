import { useState } from 'react';
import type { PageView, GalleryFilter } from './types';
import GalleryView from './components/GalleryView';
import AboutView from './components/AboutView';
import ContactModal from './components/ContactModal';
import { COLLECTIONS, DEFAULT_GALLERY_FILTER } from './data';
import { RightsReservedBlock } from './components/LicensingDetails';
import { Card } from './components/ui/card';

const totalGalleryPhotos = COLLECTIONS.reduce((n, c) => n + c.photos.length, 0);

const TABS: { id: PageView; label: string }[] = [
  { id: 'gallery', label: 'Program' },
  { id: 'about', label: 'Liner notes' },
];

export default function App() {
  const [view, setView] = useState<PageView>('gallery');
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>(DEFAULT_GALLERY_FILTER);
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-[100dvh] text-photo-fg font-sans antialiased pb-28 sm:pb-32 relative selection:bg-mcm-rust/25">
      <div className="cinematic-grid" aria-hidden />
      <div className="relative z-[1] min-h-[100dvh]">
        <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-5 sm:py-8">
          <div className="mb-5 sm:mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-mcm-line/50 pb-4">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-mcm-rust/90">
                Specimen 01 — portfolio
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl font-normal tracking-tight text-mcm-cream">
                adubsqz
              </h1>
            </div>
            <p className="max-w-sm font-mono text-[0.65rem] leading-relaxed text-photo-muted">
              Still-life frames. Mid-century rigor, darkroom patience, HTTP delivery.
            </p>
          </div>
          <Card className="overflow-hidden rounded-sm border border-mcm-line/60 bg-photo-panel/95 shadow-[0_28px_100px_rgba(0,0,0,0.88)] backdrop-blur-md">
            <div className="pt-0">
              <nav className="flex font-mono bg-mcm-ink/35" role="tablist" aria-label="Main">
                {TABS.map((tab, idx) => {
                  const active = view === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls={`panel-${tab.id}`}
                      id={`tab-${tab.id}`}
                      onClick={() => setView(tab.id)}
                      className={`relative flex flex-1 flex-col items-center gap-1 py-4 sm:py-5 text-[0.68rem] font-medium uppercase tracking-[0.28em] transition-colors ${
                        active
                          ? 'text-mcm-cream border-b-2 border-mcm-rust -mb-px bg-mcm-paper/[0.04]'
                          : 'text-photo-muted hover:text-photo-fg border-b-2 border-transparent'
                      }`}
                    >
                      <span className="text-[0.55rem] text-mcm-rust/80 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
              {view === 'gallery' && (
                <div className="px-5 sm:px-8 pb-3 pt-4 space-y-3 border-b border-mcm-cream/[0.07]">
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-mcm-rust" aria-hidden />
                    <div className="text-[0.58rem] uppercase tracking-[0.26em] text-photo-muted font-mono">
                      Strip index — select channel
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[0.65rem] uppercase tracking-[0.2em] font-mono">
                    {COLLECTIONS.map((collection, i) => (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => setGalleryFilter(collection.id)}
                        className={`transition-colors px-3 py-1.5 rounded-sm border ${
                          galleryFilter === collection.id
                            ? 'text-mcm-cream border-mcm-rust/50 bg-mcm-rust/15 shadow-[inset_0_0_0_1px_rgba(196,92,38,0.25)]'
                            : 'text-photo-muted hover:text-photo-fg border-mcm-line/40 hover:border-mcm-sage/35'
                        }`}
                      >
                        <span className="mr-2 tabular-nums text-mcm-rust/70">{String(i + 1).padStart(2, '0')}</span>
                        {collection.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div
              className="p-5 sm:p-7 md:p-8 lg:p-10 animate-fade-up"
              role="tabpanel"
              id={`panel-${view}`}
              aria-labelledby={`tab-${view}`}
            >
              {view === 'gallery' && (
                <GalleryView filter={galleryFilter} />
              )}
              {view === 'gallery' && totalGalleryPhotos === 0 && (
                <p className="mt-4 text-sm text-photo-muted">
                  Gallery is empty. After you finish an import, finalized entries live in{' '}
                  <code className="text-photo-muted/90">src/gallery-manifest.json</code> and ship from{' '}
                  <code className="text-photo-muted/90">public/photos/still-life/</code> (see repo design spec for the
                  Python tool path).
                </p>
              )}
              {view === 'about' && <AboutView onContactClick={() => setShowContact(true)} />}
            </div>
            <footer className="border-t border-mcm-line/45 px-5 py-5 sm:px-7 md:px-8 lg:px-10">
              <RightsReservedBlock />
            </footer>
          </Card>
        </main>
        {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      </div>
    </div>
  );
}
