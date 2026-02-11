import { useState, useEffect } from 'react';
import { COLLECTIONS } from '../data';
import type { Photo, PhotoCollection } from '../types';
import type { GalleryFilter } from '../types';

const PER_PAGE = 4;

function PhotoCard({
  photo,
  onClick,
  onFail,
}: {
  photo: Photo;
  onClick: () => void;
  onFail: () => void;
}) {
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    setFailed(true);
    onFail();
  };

  if (failed) return null;

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
        onError={handleError}
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
      <div className="lightbox-frame max-w-[calc(100vw-1rem)] max-h-[180vh] flex items-center justify-center">
        <img
          src={photo.src}
          alt={photo.alt}
          className="max-w-full max-h-[calc(180vh-0.5rem)] w-auto h-auto object-contain block pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

function CollectionSection({
  collection,
  onPhotoClick,
}: {
  collection: PhotoCollection;
  onPhotoClick: (photo: Photo) => void;
}) {
  const [page, setPage] = useState(1);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const photos = collection.photos;
  const totalPages = Math.max(1, Math.ceil(photos.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pagePhotos = photos.slice(start, start + PER_PAGE);
  const pagePhotosToShow = pagePhotos.filter((p) => !failedIds.has(p.id));

  const handleFail = (id: string) => setFailedIds((prev) => new Set(prev).add(id));

  if (photos.length === 0) return null;

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {pagePhotosToShow.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => onPhotoClick(photo)}
            onFail={() => handleFail(photo.id)}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-photo-muted text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-sm uppercase tracking-wider text-photo-muted hover:text-photo-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 text-sm uppercase tracking-wider text-photo-muted hover:text-photo-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

interface GalleryViewProps {
  filter: GalleryFilter;
}

export default function GalleryView({ filter }: GalleryViewProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const collection = COLLECTIONS.find((c) => c.id === `still-life-${filter}`) ?? COLLECTIONS[0];

  return (
    <div>
      <p className="text-[0.6rem] sm:text-xs italic text-photo-muted mb-8 max-w-xl">
        *none of these photos have been altered and are shown exactly how they
        were shot and thus developed
      </p>

      <CollectionSection
        collection={collection}
        onPhotoClick={setLightboxPhoto}
      />

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  );
}
