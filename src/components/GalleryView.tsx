import { useState, useEffect } from 'react';
import { COLLECTIONS } from '../data';
import type { Photo, PhotoCollection } from '../types';
import type { GalleryFilter, OrientationFilter } from '../types';
import WatermarkedImage from './WatermarkedImage';
import InquiryModal from './InquiryModal';

const PER_PAGE = 8;

type PhotoWithOrientation = Photo & { orientation: 'horizontal' | 'vertical' | 'square' };

function PhotoCard({
  photo,
  onClick,
  onFail,
  className = '',
}: {
  photo: PhotoWithOrientation;
  onClick: () => void;
  onFail: () => void;
  className?: string;
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
      aria-label={`Open photo: ${photo.alt}`}
      className={`block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-photo-fg focus-visible:ring-offset-2 focus-visible:ring-offset-photo-bg group ${className}`}
    >
      <div className="relative overflow-hidden rounded-sm">
        <WatermarkedImage
          src={photo.src}
          alt={photo.alt}
          className="gallery-image w-full h-auto max-h-[70vh] mx-auto object-cover border border-photo-border/60 hover:border-photo-border transition-all duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
          onError={handleError}
          onClick={onClick}
          watermarkOpacity={0.3}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
      {photo.caption && (
        <p className="mt-3 text-photo-muted/80 text-xs italic leading-relaxed">{photo.caption}</p>
      )}
    </button>
  );
}

// Hook to detect image orientation
function useImageOrientation(photos: Photo[]): PhotoWithOrientation[] {
  const [orientedPhotos, setOrientedPhotos] = useState<PhotoWithOrientation[]>(
    photos.map(p => ({ ...p, orientation: p.orientation || 'square' as const }))
  );

  useEffect(() => {
    const loadOrientations = async () => {
      const results = await Promise.all(
        photos.map(photo => {
          if (photo.orientation) {
            return Promise.resolve({ ...photo, orientation: photo.orientation });
          }
          
          return new Promise<PhotoWithOrientation>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const ratio = img.width / img.height;
              let orientation: 'horizontal' | 'vertical' | 'square';
              
              if (ratio > 1.2) {
                orientation = 'horizontal';
              } else if (ratio < 0.8) {
                orientation = 'vertical';
              } else {
                orientation = 'square';
              }
              
              resolve({ ...photo, orientation });
            };
            img.onerror = () => {
              resolve({ ...photo, orientation: 'square' });
            };
            img.src = photo.src;
          });
        })
      );
      setOrientedPhotos(results);
    };

    loadOrientations();
  }, [photos]);

  return orientedPhotos;
}

function Lightbox({ 
  photo, 
  onClose, 
  onInquire,
  onPrevious,
  onNext,
}: { 
  photo: Photo; 
  onClose: () => void;
  onInquire: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrevious, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute top-4 right-4 flex gap-3 z-10">
        <button
          type="button"
          onClick={onPrevious}
          className="px-4 py-2 text-photo-muted hover:text-photo-fg text-xs uppercase tracking-wider bg-photo-panel/80 backdrop-blur-sm border border-photo-border rounded transition-colors focus-visible:ring-2 focus-visible:ring-photo-fg"
          aria-label="View previous photo"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-4 py-2 text-photo-muted hover:text-photo-fg text-xs uppercase tracking-wider bg-photo-panel/80 backdrop-blur-sm border border-photo-border rounded transition-colors focus-visible:ring-2 focus-visible:ring-photo-fg"
          aria-label="View next photo"
        >
          Next
        </button>
        <button
          type="button"
          onClick={onInquire}
          className="px-4 py-2 bg-photo-accent text-photo-bg text-xs uppercase tracking-wider font-medium rounded hover:opacity-90 transition-opacity shadow-lg focus-visible:ring-2 focus-visible:ring-photo-fg"
        >
          Request Invoice
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-photo-muted hover:text-photo-fg text-xs uppercase tracking-wider bg-photo-panel/80 backdrop-blur-sm border border-photo-border rounded transition-colors focus-visible:ring-2 focus-visible:ring-photo-fg"
        >
          Close
        </button>
      </div>
      <div className="flex flex-col items-center pt-14 pb-6 px-4 max-h-[100vh] overflow-y-auto">
        <div className="lightbox-frame w-fit max-w-[calc(100vw-2rem)]">
          <WatermarkedImage
            src={photo.src}
            alt={photo.alt}
            className="max-w-full max-h-[calc(100vh-22rem)] w-auto h-auto object-contain block pointer-events-none"
            watermarkOpacity={0.35}
            loading="eager"
          />
        </div>
        {photo.caption && (
          <div className="mt-3 bg-photo-panel/90 backdrop-blur-sm border border-photo-border rounded-lg px-4 py-2 max-w-2xl">
            <p className="text-xs text-photo-muted text-center italic">{photo.caption}</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-4">
          <div className="rounded-xl border border-photo-border/60 bg-photo-panel/90 p-3 space-y-1.5">
            <p className="text-[0.66rem] uppercase tracking-[0.18em] text-photo-muted">Trade Portal + Tearsheet</p>
            <p className="text-xs text-photo-fg/90 leading-relaxed">
              Download the printable lookbook for 8.5x11 mood boards with image SKU/title under each frame.
            </p>
            <a
              href="/lookbook.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-xs uppercase tracking-[0.14em] text-photo-accent hover:opacity-85 transition-opacity"
            >
              Download Tearsheet PDF
            </a>
          </div>
          <div className="rounded-xl border border-photo-border/60 bg-photo-panel/90 p-3 space-y-1.5">
            <p className="text-[0.66rem] uppercase tracking-[0.18em] text-photo-muted">Fulfillment Options</p>
            <p className="text-xs text-photo-fg/90 leading-relaxed">
              Digital licensing: 24 hours. Framed print production: 3-5 business days. Ready-to-hang NYC/NJ delivery: 5-7 business days.
            </p>
            <p className="text-xs text-photo-fg/90 leading-relaxed">
              Short-term set rental is available at 20% of retail per 30-day term.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Smart layout grouping algorithm
type PhotoGroup = {
  photos: PhotoWithOrientation[];
  layout: 'two-horizontal' | 'vertical-plus-two' | 'three-horizontal' | 'single';
};

function createPhotoGroups(photos: PhotoWithOrientation[], forcePairs = false): PhotoGroup[] {
  const groups: PhotoGroup[] = [];
  let i = 0;

  while (i < photos.length) {
    const current = photos[i];
    const next = photos[i + 1];
    const third = photos[i + 2];

    if (forcePairs && next) {
      groups.push({
        photos: [current, next],
        layout: 'two-horizontal',
      });
      i += 2;
      continue;
    }

    // Pattern 1: Vertical photo + 2 horizontals beside it
    if (
      current.orientation === 'vertical' &&
      next?.orientation === 'horizontal' &&
      third?.orientation === 'horizontal'
    ) {
      groups.push({
        photos: [current, next, third],
        layout: 'vertical-plus-two',
      });
      i += 3;
    }
    // Pattern 2: Two horizontal photos side by side
    else if (
      current.orientation === 'horizontal' &&
      next?.orientation === 'horizontal'
    ) {
      groups.push({
        photos: [current, next],
        layout: 'two-horizontal',
      });
      i += 2;
    }
    // Pattern 3: Three horizontal photos in a row (only on wider screens)
    else if (
      current.orientation === 'horizontal' &&
      next?.orientation === 'horizontal' &&
      third?.orientation === 'horizontal'
    ) {
      groups.push({
        photos: [current, next, third],
        layout: 'three-horizontal',
      });
      i += 3;
    }
    // Pattern 4: Single photo (fallback)
    else {
      groups.push({
        photos: [current],
        layout: 'single',
      });
      i += 1;
    }
  }

  return groups;
}

function PhotoGroup({
  group,
  onPhotoClick,
  onFail,
  preferSideBySide = false,
}: {
  group: PhotoGroup;
  onPhotoClick: (photo: Photo) => void;
  onFail: (id: string) => void;
  preferSideBySide?: boolean;
}) {
  if (group.layout === 'vertical-plus-two') {
    // 1 vertical on left, 2 horizontals stacked on right
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <PhotoCard
          photo={group.photos[0]}
          onClick={() => onPhotoClick(group.photos[0])}
          onFail={() => onFail(group.photos[0].id)}
        />
        <div className="grid grid-rows-2 gap-6 sm:gap-8">
          <PhotoCard
            photo={group.photos[1]}
            onClick={() => onPhotoClick(group.photos[1])}
            onFail={() => onFail(group.photos[1].id)}
          />
          <PhotoCard
            photo={group.photos[2]}
            onClick={() => onPhotoClick(group.photos[2])}
            onFail={() => onFail(group.photos[2].id)}
          />
        </div>
      </div>
    );
  }

  if (group.layout === 'two-horizontal') {
    return (
      <div className={`grid grid-cols-1 ${preferSideBySide ? 'sm:grid-cols-2' : 'lg:grid-cols-2'} gap-6 sm:gap-8`}>
        {group.photos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => onPhotoClick(photo)}
            onFail={() => onFail(photo.id)}
          />
        ))}
      </div>
    );
  }

  if (group.layout === 'three-horizontal') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {group.photos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => onPhotoClick(photo)}
            onFail={() => onFail(photo.id)}
          />
        ))}
      </div>
    );
  }

  // Single photo
  const singlePhoto = group.photos[0];
  const singlePhotoWidthClass =
    singlePhoto.orientation === 'vertical' ? 'max-w-xl' : 'max-w-3xl';

  return (
    <div className={`${singlePhotoWidthClass} mx-auto`}>
      <PhotoCard
        photo={singlePhoto}
        onClick={() => onPhotoClick(singlePhoto)}
        onFail={() => onFail(singlePhoto.id)}
      />
    </div>
  );
}

function CollectionSection({
  collection,
  onPhotoClick,
  preferSideBySide = false,
}: {
  collection: PhotoCollection;
  onPhotoClick: (photo: Photo) => void;
  preferSideBySide?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const photos = collection.photos;
  const orientedPhotos = useImageOrientation(photos);
  
  const totalPages = Math.max(1, Math.ceil(photos.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pagePhotos = orientedPhotos.slice(start, start + PER_PAGE);
  const pagePhotosToShow = pagePhotos.filter((p) => !failedIds.has(p.id));

  const handleFail = (id: string) => setFailedIds((prev) => new Set(prev).add(id));

  const photoGroups = createPhotoGroups(pagePhotosToShow, preferSideBySide);

  if (photos.length === 0) return null;

  return (
    <section>
      <div className="space-y-12 sm:space-y-16">
        {photoGroups.map((group, idx) => (
          <div key={`group-${idx}`} role="group" aria-label={`Photo group ${idx + 1}`}>
            <PhotoGroup
              group={group}
              onPhotoClick={onPhotoClick}
              onFail={handleFail}
              preferSideBySide={preferSideBySide}
            />
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
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
  orientationFilter?: OrientationFilter;
}

export default function GalleryView({ filter, orientationFilter = 'all' }: GalleryViewProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [inquiryPhoto, setInquiryPhoto] = useState<Photo | null>(null);
  const collection: PhotoCollection = COLLECTIONS.find((c) => c.id === filter)
    ?? COLLECTIONS[0]
    ?? { id: 'empty', title: 'Empty', photos: [] };
  const orientedPhotos = useImageOrientation(collection.photos);
  const filteredPhotos = orientedPhotos.filter((photo) => {
    if (orientationFilter === 'all') return true;
    if (orientationFilter === 'horizontal') {
      return photo.orientation === 'horizontal' || photo.orientation === 'square';
    }
    return photo.orientation === 'vertical' || photo.orientation === 'square';
  });
  const filteredCollection: PhotoCollection = {
    ...collection,
    photos: filteredPhotos,
  };
  const preferSideBySide = false;

  useEffect(() => {
    if (!lightboxPhoto) return;
    const exists = filteredCollection.photos.some((photo) => photo.id === lightboxPhoto.id);
    if (!exists) setLightboxPhoto(null);
  }, [filteredCollection.photos, lightboxPhoto]);

  const handleInquire = () => {
    if (lightboxPhoto) {
      setInquiryPhoto(lightboxPhoto);
      setLightboxPhoto(null);
    }
  };
  
  const handleLightboxMove = (direction: 'next' | 'previous') => {
    if (!lightboxPhoto) return;
    if (filteredCollection.photos.length === 0) return;
    const currentIndex = filteredCollection.photos.findIndex((photo) => photo.id === lightboxPhoto.id);
    if (currentIndex < 0) return;
    const step = direction === 'next' ? 1 : -1;
    const nextIndex =
      (currentIndex + step + filteredCollection.photos.length) % filteredCollection.photos.length;
    setLightboxPhoto(filteredCollection.photos[nextIndex]);
  };

  return (
    <div className="space-y-12">
      <div className="max-w-3xl">
        <p className="text-[0.65rem] sm:text-xs italic text-photo-muted/80 leading-relaxed">
          *none of these photos have been altered and are shown exactly how they
          were shot and thus developed
        </p>
      </div>

      {filteredCollection.photos.length === 0 && (
        <p className="text-sm text-photo-muted">
          No photos matched this orientation in the selected category.
        </p>
      )}

      <CollectionSection
        collection={filteredCollection}
        onPhotoClick={setLightboxPhoto}
        preferSideBySide={preferSideBySide}
      />

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          onInquire={handleInquire}
          onPrevious={() => handleLightboxMove('previous')}
          onNext={() => handleLightboxMove('next')}
        />
      )}

      {inquiryPhoto && (
        <InquiryModal
          photo={inquiryPhoto}
          onClose={() => setInquiryPhoto(null)}
        />
      )}
    </div>
  );
}
