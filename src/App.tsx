import { useState } from 'react';
import type { PageView, GalleryFilter, OrientationFilter } from './types';
import GalleryView from './components/GalleryView';
import AboutView from './components/AboutView';
import ContactModal from './components/ContactModal';
import { COLLECTIONS, DEFAULT_GALLERY_FILTER } from './data';

const TABS: { id: PageView; label: string }[] = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'about', label: 'About' },
];

export default function App() {
  const [view, setView] = useState<PageView>('gallery');
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>(DEFAULT_GALLERY_FILTER);
  const [orientationFilter, setOrientationFilter] = useState<OrientationFilter>('all');
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-screen text-photo-fg font-sans antialiased">
      <div className="relative min-h-screen">
        <main className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
          <div className="rounded-3xl bg-photo-panel/95 shadow-[0_26px_80px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden">
            <div className="pt-1">
              <nav className="flex" role="tablist" aria-label="Main">
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
                      className={`flex-1 py-4 sm:py-5 text-sm font-medium uppercase tracking-wider transition-colors ${
                        active
                          ? 'text-photo-accent border-b-2 border-photo-accent -mb-px'
                          : 'text-photo-muted hover:text-photo-fg border-b-2 border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
              {view === 'gallery' && (
                <div className="px-6 sm:px-8 pb-3 pt-1 space-y-3">
                  <div className="text-[0.63rem] uppercase tracking-[0.18em] text-photo-muted">
                    Vibe + Palette Categories
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wider">
                    {COLLECTIONS.map((collection) => (
                      <button
                        key={collection.id}
                        type="button"
                        onClick={() => setGalleryFilter(collection.id)}
                        className={`transition-colors ${
                          galleryFilter === collection.id
                            ? 'text-photo-accent border-b-2 border-photo-accent -mb-px pb-1'
                            : 'text-photo-muted hover:text-photo-fg border-b-2 border-transparent pb-1'
                        }`}
                      >
                        {collection.title}
                      </button>
                    ))}
                  </div>
                  <div className="text-[0.63rem] uppercase tracking-[0.18em] text-photo-muted">
                    Orientation
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wider">
                    {(['all', 'horizontal', 'vertical', 'square'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setOrientationFilter(option)}
                        className={`transition-colors ${
                          orientationFilter === option
                            ? 'text-photo-accent border-b-2 border-photo-accent -mb-px pb-1'
                            : 'text-photo-muted hover:text-photo-fg border-b-2 border-transparent pb-1'
                        }`}
                      >
                        {option}
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
              {view === 'gallery' && COLLECTIONS.length > 0 && (
                <GalleryView filter={galleryFilter} orientationFilter={orientationFilter} />
              )}
              {view === 'gallery' && COLLECTIONS.length === 0 && (
                <p className="text-sm text-photo-muted">
                  No gallery categories found yet. Run the photo categorization script first.
                </p>
              )}
              {view === 'about' && <AboutView onContactClick={() => setShowContact(true)} />}
            </div>
          </div>
        </main>
        {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      </div>
    </div>
  );
}
