import { lazy, Suspense, useState } from 'react';
import type { PageView, GalleryFilter } from './types';
import GalleryView from './components/GalleryView';
import { COLLECTIONS, DEFAULT_GALLERY_FILTER } from './data';

const AboutView = lazy(() => import('./components/AboutView'));
const ContactModal = lazy(() => import('./components/ContactModal'));
import { RightsReservedBlock } from './components/LicensingDetails';

const totalGalleryPhotos = COLLECTIONS.reduce((n, c) => n + c.photos.length, 0);

const TABS: { id: PageView; label: string }[] = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'about', label: 'About me' },
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
          <div className="mb-4 sm:mb-6 flex flex-wrap items-end justify-between gap-4 pb-2">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-mcm-cream">
                adubsqz
              </h1>
            </div>
            <p className="max-w-sm font-mono text-[0.65rem] leading-relaxed text-photo-muted">
              Still-life frames. Mid-century rigor, darkroom patience, HTTP delivery.
            </p>
          </div>
          <div className="overflow-hidden">
            <div className="pt-0">
              <nav className="flex font-mono" role="tablist" aria-label="Main">
                {TABS.map((tab) => {
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
                      className={`relative flex flex-1 flex-col items-center py-3 sm:py-4 text-[0.72rem] font-medium uppercase tracking-[0.24em] transition-colors ${
                        active
                          ? 'text-mcm-cream border-b-2 border-mcm-rust'
                          : 'text-photo-muted hover:text-photo-fg'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
              {view === 'gallery' && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-1 sm:px-3 pb-2 pt-3 font-mono text-[0.68rem] uppercase tracking-[0.22em]">
                  {COLLECTIONS.map((collection, i) => (
                    <span key={collection.id} className="inline-flex items-center gap-3">
                      {i > 0 && (
                        <span className="text-photo-muted/25 select-none" aria-hidden>
                          |
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setGalleryFilter(collection.id)}
                        className={`transition-colors ${
                          galleryFilter === collection.id
                            ? 'text-mcm-cream underline decoration-mcm-rust decoration-2 underline-offset-[6px]'
                            : 'text-photo-muted hover:text-photo-fg'
                        }`}
                      >
                        {collection.title}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div
              className={
                view === 'gallery'
                  ? 'px-0 py-2 sm:px-2 sm:py-3 animate-fade-up'
                  : 'px-2 py-4 sm:px-4 sm:py-6 md:px-6 animate-fade-up'
              }
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
              {view === 'about' && (
                <Suspense fallback={<p className="text-sm text-photo-muted">Loading…</p>}>
                  <AboutView onContactClick={() => setShowContact(true)} />
                </Suspense>
              )}
            </div>
            <footer className="px-1 py-6 sm:px-3 sm:py-8">
              <RightsReservedBlock plain />
            </footer>
          </div>
        </main>
        {showContact && (
          <Suspense fallback={null}>
            <ContactModal onClose={() => setShowContact(false)} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
