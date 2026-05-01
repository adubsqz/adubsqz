import { useState, useEffect, useMemo, useRef } from 'react';
import { COLLECTIONS } from '../data';
import type { Photo, PhotoCollection } from '../types';
import type { GalleryFilter } from '../types';
import WatermarkedImage from './WatermarkedImage';
import InquiryModal from './InquiryModal';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

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
      <div className="relative mx-auto w-fit max-w-full rounded-sm border-[6px] border-white/88 shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-all duration-500 group-hover:border-white group-hover:scale-[1.01]">
        <WatermarkedImage
          src={photo.src}
          alt={photo.alt}
          wrapperClassName="relative inline-block max-w-full w-fit"
          className="gallery-image block h-auto max-h-[70vh] w-auto max-w-full object-contain"
          loading="lazy"
          decoding="async"
          onError={handleError}
          onClick={onClick}
          watermarkOpacity={0.1}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-sm" />
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

  // Key off stable photo identity (id+src) instead of array reference so callers
  // that build a fresh array each render don't retrigger the effect in a loop.
  const photosKey = photos.map((p) => `${p.id}|${p.src}`).join('\n');

  useEffect(() => {
    let cancelled = false;
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
              
              // Portrait formats like 4:5 (0.8) and 3:4 (0.75) must read as vertical, not square.
              if (ratio > 1.05) {
                orientation = 'horizontal';
              } else if (ratio < 0.95) {
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
      if (!cancelled) setOrientedPhotos(results);
    };

    loadOrientations();
    return () => {
      cancelled = true;
    };
    // photosKey captures the only inputs that should retrigger detection; using
    // `photos` directly would re-run on every render when callers pass a fresh
    // array (e.g. result of Array#slice).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photosKey]);

  return orientedPhotos;
}

function Lightbox({ 
  photo, 
  onClose, 
  onInquire,
  onInquireTearsheet,
  onPrevious,
  onNext,
}: { 
  photo: Photo; 
  onClose: () => void;
  onInquire: () => void;
  onInquireTearsheet: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrevious, onNext]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = 0;
  }, [photo.id, photo.src]);

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden overscroll-contain bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[min(1200px,100vw)] flex-col px-6 pb-28 pt-8 sm:px-12 sm:pb-36 sm:pt-12">
        <header className="flex shrink-0 flex-col gap-8 border-b border-white/[0.06] pb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-12 sm:pb-12">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="text-[0.65rem] uppercase tracking-[0.22em] text-white/35">Navigate</span>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Button
                type="button"
                onClick={onPrevious}
                variant="lightbox"
                className="rounded-md px-5 py-2.5 text-[0.7rem] tracking-[0.18em]"
                aria-label="View previous photo"
              >
                Prev
              </Button>
              <Button
                type="button"
                onClick={onNext}
                variant="lightbox"
                className="rounded-md px-5 py-2.5 text-[0.7rem] tracking-[0.18em]"
                aria-label="View next photo"
              >
                Next
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:pl-4 sm:border-l sm:border-white/[0.08]">
            <Button
              type="button"
              onClick={onInquire}
              variant="lightboxPrimary"
              className="rounded-md px-6 py-2.5 text-[0.7rem] tracking-[0.16em] focus-visible:ring-white"
            >
              Request Invoice
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="lightbox"
              className="rounded-md px-5 py-2.5 text-[0.7rem] tracking-[0.18em]"
            >
              Close
            </Button>
          </div>
        </header>

        <div className="h-12 shrink-0 sm:h-20" aria-hidden />

        <figure className="flex w-full shrink-0 justify-center px-0">
          <div className="lightbox-frame lightbox-frame--hero w-auto max-w-[calc(100vw-3rem)] sm:max-w-[min(1100px,calc(100vw-4rem))]">
            <WatermarkedImage
              src={photo.src}
              alt={photo.alt}
              wrapperClassName="relative flex w-full max-w-full items-center justify-center"
              className="pointer-events-none block h-auto max-h-[min(78dvh,920px)] w-auto min-h-0 max-w-full object-contain sm:max-h-[min(80dvh,960px)]"
              watermarkOpacity={0.12}
              loading="eager"
            />
          </div>
        </figure>

        <div className="h-14 shrink-0 sm:h-20" aria-hidden />

        {photo.caption && (
          <>
            <Card className="rounded-xl border-white/10 bg-white/[0.04] backdrop-blur-sm">
              <CardContent className="px-5 py-4 sm:px-8">
                <p className="text-center text-sm italic leading-relaxed text-white/65">{photo.caption}</p>
              </CardContent>
            </Card>
            <div className="h-10 sm:h-14" aria-hidden />
          </>
        )}

        <section className="space-y-12 border-t border-white/10 pt-16 sm:space-y-16 sm:pt-20">
          <div className="text-[0.65rem] uppercase tracking-[0.28em] text-white/30">Licensing & fulfillment</div>
          <div className="grid w-full grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-14 lg:gap-20">
            <Card className="space-y-4 border-white/[0.12] bg-white/[0.04] p-6 sm:p-8">
              <p className="text-[0.7rem] uppercase tracking-[0.2em] text-white/45">Trade Portal + Tearsheet</p>
              <p className="text-sm leading-relaxed text-white/85">
                Printable 8.5×11 lookbook pages with image SKU and title under each frame—available on request.
              </p>
              <Button
                type="button"
                onClick={onInquireTearsheet}
                variant="ghost"
                className="h-auto justify-start px-0 pt-2 text-left text-[0.75rem] tracking-[0.18em] text-photo-accent hover:text-photo-accent/90"
              >
                Inquire about tearsheet…
              </Button>
            </Card>
            <Card className="space-y-4 border-white/[0.12] bg-white/[0.04] p-6 sm:p-8">
              <p className="text-[0.7rem] uppercase tracking-[0.2em] text-white/45">Fulfillment Options</p>
              <p className="text-sm leading-relaxed text-white/85">
                Digital licensing: 24 hours. Framed print production: 3-5 business days. Ready-to-hang NYC/NJ
                delivery: 5-7 business days.
              </p>
              <p className="text-sm leading-relaxed text-white/85">
                Short-term set rental is available at 20% of retail per 30-day term.
              </p>
            </Card>
          </div>
        </section>

        <div className="min-h-[15vh] shrink-0" aria-hidden />
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

  const totalPages = Math.max(1, Math.ceil(photos.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pageSlice = useMemo(
    () => photos.slice(start, start + PER_PAGE),
    [photos, start],
  );
  const orientedPhotos = useImageOrientation(pageSlice);

  useEffect(() => {
    setPage(1);
    setFailedIds(new Set());
  }, [collection.id]);

  const pagePhotosToShow = orientedPhotos.filter((p) => !failedIds.has(p.id));

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
}

export default function GalleryView({ filter }: GalleryViewProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [inquiry, setInquiry] = useState<{ photo: Photo; initialNotes?: string } | null>(null);
  const collection: PhotoCollection = COLLECTIONS.find((c) => c.id === filter)
    ?? COLLECTIONS[0]
    ?? { id: 'empty', title: 'Empty', photos: [] };
  const filteredCollection: PhotoCollection = {
    ...collection,
    photos: collection.photos,
  };
  const preferSideBySide = false;

  useEffect(() => {
    if (!lightboxPhoto) return;
    const exists = filteredCollection.photos.some((photo) => photo.id === lightboxPhoto.id);
    if (!exists) setLightboxPhoto(null);
  }, [filteredCollection.photos, lightboxPhoto]);

  const handleInquire = () => {
    if (!lightboxPhoto) return;
    setInquiry({ photo: lightboxPhoto });
    setLightboxPhoto(null);
  };

  const handleInquireTearsheet = () => {
    if (!lightboxPhoto) return;
    setInquiry({
      photo: lightboxPhoto,
      initialNotes:
        "I'm interested in the printable tearsheet / lookbook for this image (8.5×11 mood board with SKU and title under each frame). Please share availability and next steps.",
    });
    setLightboxPhoto(null);
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

      {filteredCollection.photos.length === 0 && (
        <p className="text-sm text-photo-muted">
          No photos found in this category.
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
          onInquireTearsheet={handleInquireTearsheet}
          onPrevious={() => handleLightboxMove('previous')}
          onNext={() => handleLightboxMove('next')}
        />
      )}

      {inquiry && (
        <InquiryModal
          photo={inquiry.photo}
          initialNotes={inquiry.initialNotes}
          onClose={() => setInquiry(null)}
        />
      )}
    </div>
  );
}