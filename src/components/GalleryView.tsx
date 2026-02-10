import { useState, useEffect } from 'react';
import { COLLECTIONS } from '../data';
import type { Photo } from '../types';

function PhotoCard({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="aspect-[4/3] border border-photo-border bg-photo-border/30 flex items-center justify-center text-photo-muted text-sm"
        aria-hidden
      >
        <span className="sr-only">Image unavailable</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-photo-fg focus-visible:ring-offset-2 focus-visible:ring-offset-photo-bg"
    >
      <img
        src={photo.src}
        alt={photo.alt}
        className="gallery-image w-full h-auto object-cover border border-photo-border hover:border-photo-muted transition-colors"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
      {photo.caption && (
        <p className="mt-2 text-photo-muted text-sm">{photo.caption}</p>
      )}
    </button>
  );
}

function Lightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-photo-muted hover:text-photo-fg text-sm uppercase tracking-wider z-10"
      >
        Close
      </button>
      <img
        src={photo.src}
        alt={photo.alt}
        className="max-w-full max-h-[90vh] w-auto h-auto object-contain pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function GalleryView() {
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  return (
    <div>
      <h2 className="font-display text-2xl sm:text-3xl text-photo-fg mb-8">
        Gallery
      </h2>

      {COLLECTIONS.map((collection) => (
        <section key={collection.id} className="mb-12 last:mb-0">
          <h3 className="font-display text-xl text-photo-fg mb-2">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="text-photo-muted text-sm mb-6 max-w-xl">
              {collection.description}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {collection.photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => setLightboxPhoto(photo)}
              />
            ))}
          </div>
        </section>
      ))}

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  );
}
