import { lazy, Suspense, useState } from 'react';
import type { PageView, GalleryFilter } from './types';
import GalleryView from './components/GalleryView';
import { COLLECTIONS, DEFAULT_GALLERY_FILTER } from './data';
import { RightsReservedBlock } from './components/LicensingDetails';

const AboutView = lazy(() => import('./components/AboutView'));
const ContactModal = lazy(() => import('./components/ContactModal'));

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
    <div className="relative min-h-[100dvh] pb-16 font-sans text-photo-fg antialiased selection:bg-mcm-rust/20 sm:pb-24">
      <div className="cinematic-grid" aria-hidden />
      <div className="relative z-[1] min-h-[100dvh]">
        <main className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-8 sm:py-10 lg:px-10">
          <header className="mb-4 flex items-center justify-between gap-3 sm:mb-8 sm:items-end">
            <div>
              <h1 className="font-display text-[2rem] font-normal leading-none tracking-tight text-photo-fg sm:text-5xl">
                adubsqz
              </h1>
              <p className="mt-2 hidden max-w-[14rem] text-[0.95rem] leading-snug text-photo-muted sm:block">
                film stills. one conversation.
              </p>
            </div>
            <nav
              className="flex shrink-0 rounded-full bg-photo-panel/90 p-1 shadow-[inset_0_0_0_1px_rgba(26,23,20,0.06)]"
              role="tablist"
              aria-label="Main"
            >
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
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-5 sm:py-2.5 sm:text-[0.95rem] ${
                      active
                        ? 'bg-mcm-cream text-photo-fg shadow-[0_6px_18px_rgba(26,23,20,0.08)]'
                        : 'text-photo-muted hover:text-photo-fg'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </header>

          {view === 'gallery' && (
            <div className="no-scrollbar mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
              {COLLECTIONS.map((collection) => {
                const active = galleryFilter === collection.id;
                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => setGalleryFilter(collection.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-mcm-rust text-mcm-cream'
                        : 'bg-photo-panel text-photo-muted hover:text-photo-fg'
                    }`}
                  >
                    {collection.title}
                  </button>
                );
              })}
            </div>
          )}

          <div
            className={
              view === 'gallery'
                ? 'animate-fade-up px-0 py-4 sm:py-6'
                : 'animate-fade-up px-0 py-6 sm:px-2 sm:py-8'
            }
            role="tabpanel"
            id={`panel-${view}`}
            aria-labelledby={`tab-${view}`}
          >
            {view === 'gallery' && <GalleryView filter={galleryFilter} />}
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

          {view === 'gallery' && (
            <footer className="hidden px-1 py-8 sm:block">
              <RightsReservedBlock plain />
            </footer>
          )}
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
