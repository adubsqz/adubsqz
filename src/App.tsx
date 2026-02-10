import { useState } from 'react';
import type { PageView } from './types';
import GalleryView from './components/GalleryView';
import AboutView from './components/AboutView';
import { ABOUT } from './data';

const NAV_ITEMS: { id: PageView; label: string }[] = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'about', label: 'About' },
];

export default function App() {
  const [view, setView] = useState<PageView>('gallery');

  return (
    <div className="min-h-screen bg-photo-bg text-photo-fg font-sans antialiased">
      <div className="relative min-h-screen">
        <div className="pointer-events-none fixed inset-0 opacity-80" aria-hidden="true" />

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

            <div className="hidden md:block text-[0.65rem] text-photo-muted max-w-xs leading-relaxed">
              Do you like the site? By trade, Alexander works as a data scientist and software
              engineer at a biomolecular research company focused on fighting cancer.
            </div>
          </aside>

          <section className="md:flex-1">
            <div className="rounded-3xl border border-photo-border/70 bg-photo-panel/90 shadow-[0_26px_80px_rgba(0,0,0,0.85)] backdrop-blur-md p-5 sm:p-7 md:p-8 animate-fade-up">
              {view === 'gallery' && <GalleryView />}
              {view === 'about' && <AboutView />}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
