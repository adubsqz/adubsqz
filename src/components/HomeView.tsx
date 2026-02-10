import type { PageView } from '../types';

interface HomeViewProps {
  onNavigate: (view: PageView) => void;
}

export default function HomeView({ onNavigate }: HomeViewProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <header className="mb-12 sm:mb-16">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-photo-fg tracking-tight">
          Alexander Ames
        </h1>
        <p className="font-sans text-photo-muted text-lg sm:text-xl mt-2">
          Photography
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => onNavigate('gallery')}
          className="px-6 py-3 border border-photo-border text-photo-fg hover:border-photo-fg hover:bg-photo-border/50 transition-colors text-sm uppercase tracking-wider"
        >
          Gallery
        </button>
        <button
          type="button"
          onClick={() => onNavigate('about')}
          className="px-6 py-3 border border-photo-border text-photo-muted hover:text-photo-fg hover:border-photo-fg transition-colors text-sm uppercase tracking-wider"
        >
          About
        </button>
      </div>
    </div>
  );
}
