import { useState, useEffect } from 'react';
import { COLLECTIONS } from '../data';
import type { Photo, PhotoCollection } from '../types';
import type { GalleryFilter } from '../types';
import WatermarkedImage from './WatermarkedImage';

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
    <div className={`block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-photo-fg focus-visible:ring-offset-2 focus-visible:ring-offset-photo-bg ${className}`}>
      <WatermarkedImage
        src={photo.src}
        alt={photo.alt}
        className="gallery-image w-full h-auto object-cover border border-photo-border hover:border-photo-muted transition-colors"
        loading="lazy"
        decoding="async"
        onError={handleError}
        onClick={onClick}
        watermarkOpacity={0.3}
      />
      {photo.caption && (
        <p className="mt-2 text-photo-muted text-sm">{photo.caption}</p>
      )}
    </div>
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
        <WatermarkedImage
          src={photo.src}
          alt={photo.alt}
          className="max-w-full max-h-[calc(180vh-0.5rem)] w-auto h-auto object-contain block pointer-events-none"
          watermarkOpacity={0.35}
          loading="eager"
        />
      </div>
    </div>
  );
}

// Smart layout grouping algorithm
type PhotoGroup = {
  photos: PhotoWithOrientation[];
  layout: 'two-horizontal' | 'vertical-plus-two' | 'three-horizontal' | 'single';
};

function createPhotoGroups(photos: PhotoWithOrientation[]): PhotoGroup[] {
  const groups: PhotoGroup[] = [];
  let i = 0;

  while (i < photos.length) {
    const current = photos[i];
    const next = photos[i + 1];
    const third = photos[i + 2];

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
}: {
  group: PhotoGroup;
  onPhotoClick: (photo: Photo) => void;
  onFail: (id: string) => void;
}) {
  if (group.layout === 'vertical-plus-two') {
    // 1 vertical on left, 2 horizontals stacked on right
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PhotoCard
          photo={group.photos[0]}
          onClick={() => onPhotoClick(group.photos[0])}
          onFail={() => onFail(group.photos[0].id)}
        />
        <div className="grid grid-rows-2 gap-4 sm:gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
}: {
  collection: PhotoCollection;
  onPhotoClick: (photo: Photo) => void;
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

  const photoGroups = createPhotoGroups(pagePhotosToShow);

  if (photos.length === 0) return null;

  return (
    <section>
      <div className="space-y-8">
        {photoGroups.map((group, idx) => (
          <PhotoGroup
            key={`group-${idx}`}
            group={group}
            onPhotoClick={onPhotoClick}
            onFail={handleFail}
          />
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
