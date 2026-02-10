import { useState } from 'react';
import type { PageView } from './types';
import HomeView from './components/HomeView';
import GalleryView from './components/GalleryView';
import AboutView from './components/AboutView';

export default function App() {
  const [view, setView] = useState<PageView>('home');

  return (
    <div className="min-h-screen bg-photo-bg text-photo-fg font-sans antialiased">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {view !== 'home' && (
          <nav className="mb-8">
            <button
              type="button"
              onClick={() => setView('home')}
              className="text-photo-muted hover:text-photo-fg text-sm transition-colors"
            >
              ← Back
            </button>
          </nav>
        )}
        {view === 'home' && <HomeView onNavigate={setView} />}
        {view === 'gallery' && <GalleryView />}
        {view === 'about' && <AboutView />}
      </main>
    </div>
  );
}
