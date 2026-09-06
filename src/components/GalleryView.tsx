import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { COLLECTIONS } from '../data';
import { contactPrefillForPhoto } from '../inquireStatic';
import type { Photo, PhotoCollection } from '../types';
import type { GalleryFilter } from '../types';
import {
  paginateByOrientation,
  reelLayoutFor,
  type PhotoOrientation,
  type ReelLayout,
} from '../gallery-reel';
import WatermarkedImage from './WatermarkedImage';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const ContactModal = lazy(() => import('./ContactModal'));

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function imageClassForReelLayout(layout: ReelLayout): string {
  switch (layout) {
    case 'hero':
      return 'gallery-image block h-auto max-h-[min(92dvh,1120px)] w-auto max-w-[min(1240px,99vw)] object-contain';
    case 'horizontal-duo':
      return 'gallery-image block h-auto max-h-[min(84dvh,980px)] w-auto max-w-full object-contain';
    case 'horizontal-trio':
      return 'gallery-image block h-auto max-h-[min(78dvh,860px)] w-auto max-w-full object-contain';
    case 'vertical-solo':
      return 'gallery-image block h-auto max-h-[min(84dvh,960px)] w-auto max-w-full object-contain';
    default:
      return 'gallery-image block h-auto max-h-[min(80dvh,840px)] w-auto max-w-full object-contain';
  }
}

function PhotoCard({
  photo,
  onClick,
  fetchPriority,
  loading,
  reelLayout,
  className = '',
}: {
  photo: Photo;
  onClick: () => void;
  fetchPriority?: 'high' | 'low' | 'auto';
  /** First screenful uses eager loads so lazy+layout containment cannot starve fetches (incl. Strict Mode remounts). */
  loading?: 'lazy' | 'eager';
  reelLayout: ReelLayout;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const acceptErrorsRef = useRef(false);

  useLayoutEffect(() => {
    acceptErrorsRef.current = true;
    return () => {
      acceptErrorsRef.current = false;
    };
  }, []);

  const handleError = () => {
    if (!acceptErrorsRef.current) return;
    console.error('Gallery photo failed to load:', photo.src ?? photo.id);
    setFailed(true);
  };

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reducedMotion || !btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      setTilt({ rx: y * -5.5, ry: x * 5.5 });
    },
    [reducedMotion],
  );

  const onPointerLeave = useCallback(() => setTilt({ rx: 0, ry: 0 }), []);

  if (failed) {
    return (
      <div
        className={`aspect-[4/5] w-full rounded-sm border-[3px] border-mcm-line/40 bg-mcm-paper/30 flex items-center justify-center ${className}`}
      >
        <span className="text-photo-muted/40 text-sm select-none font-mono">—</span>
      </div>
    );
  }

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      aria-label={`Open photo: ${photo.alt}`}
      className={`block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mcm-rust focus-visible:ring-offset-2 focus-visible:ring-offset-photo-bg group ${className}`}
      style={{ perspective: '880px' }}
    >
      <div
        className="relative mx-auto w-fit max-w-full rounded-sm border-[3px] border-photo-fg/80 bg-photo-panel shadow-[0_10px_28px_rgba(26,23,20,0.12),inset_0_0_0_1px_rgba(26,23,20,0.08)] transition-[border-color,box-shadow] duration-300 group-hover:border-mcm-rust group-hover:shadow-[0_14px_36px_rgba(197,106,58,0.18)] motion-safe:transition-transform motion-safe:duration-300 [transform-style:preserve-3d]"
        style={
          reducedMotion
            ? undefined
            : {
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.002)`,
              }
        }
      >
        <WatermarkedImage
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          wrapperClassName="relative inline-block max-w-full w-fit"
          className={imageClassForReelLayout(reelLayout)}
          loading={loading ?? 'lazy'}
          decoding="async"
          fetchPriority={fetchPriority}
          onError={handleError}
          onClick={onClick}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mcm-sky/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-sm" />
      </div>
      {photo.caption && (
        <p className="mt-3 text-photo-muted/85 text-[0.7rem] leading-relaxed font-mono tracking-wide">
          {photo.caption}
        </p>
      )}
    </button>
  );
}

function Lightbox({
  photo,
  onClose,
  onContact,
  onPrevious,
  onNext,
}: {
  photo: Photo;
  onClose: () => void;
  onContact: () => void;
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

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] bg-white" aria-hidden onClick={onClose} />
      <div
        ref={scrollRef}
        className="lightbox-shell fixed inset-0 z-[101] overflow-y-auto overflow-x-hidden overscroll-contain bg-mcm-cream text-photo-fg"
        role="dialog"
        aria-modal="true"
        aria-label="Image lightbox"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white/95 px-3 py-3 backdrop-blur-sm sm:px-8 sm:py-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onPrevious}
              variant="outline"
              className="rounded-sm border-neutral-300 bg-white px-3 py-2 text-[0.65rem] tracking-[0.16em] text-neutral-800 hover:bg-neutral-50 focus-visible:ring-offset-white sm:px-5 sm:text-[0.7rem]"
              aria-label="View previous photo"
            >
              Prev
            </Button>
            <Button
              type="button"
              onClick={onNext}
              variant="outline"
              className="rounded-sm border-neutral-300 bg-white px-3 py-2 text-[0.65rem] tracking-[0.16em] text-neutral-800 hover:bg-neutral-50 focus-visible:ring-offset-white sm:px-5 sm:text-[0.7rem]"
              aria-label="View next photo"
            >
              Next
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onContact}
              variant="lightboxPrimary"
              className="rounded-sm px-3 py-2 text-[0.65rem] font-semibold tracking-[0.14em] focus-visible:ring-offset-white sm:px-6 sm:text-[0.7rem]"
            >
              Contact Me
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-sm border-neutral-300 bg-white px-3 py-2 text-[0.65rem] tracking-[0.16em] text-neutral-800 hover:bg-neutral-50 focus-visible:ring-offset-white sm:px-5 sm:text-[0.7rem]"
            >
              Close
            </Button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[min(1200px,100vw)] flex-col px-4 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-10">
        <figure className="flex w-full shrink-0 justify-center px-0">
          <div className="lightbox-frame lightbox-frame--hero w-auto max-w-[calc(100vw-3rem)] sm:max-w-[min(1100px,calc(100vw-4rem))]">
            <WatermarkedImage
              src={photo.src}
              alt={photo.alt}
              wrapperClassName="relative flex w-full max-w-full items-center justify-center"
              className="pointer-events-none block h-auto max-h-[min(78dvh,920px)] w-auto min-h-0 max-w-full object-contain sm:max-h-[min(80dvh,960px)]"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </figure>

        {photo.caption && (
          <Card className="mt-6 rounded-sm border-neutral-200 bg-neutral-50">
            <CardContent className="px-5 py-4 sm:px-8">
              <p className="text-center text-sm italic leading-relaxed text-neutral-600">{photo.caption}</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </>,
    document.body,
  );
}

function reelGridClass(layout: ReelLayout): string {
  switch (layout) {
    case 'hero':
      return 'grid grid-cols-1 place-items-center w-full';
    case 'horizontal-duo':
      return 'grid grid-cols-1 md:grid-cols-2 w-full gap-2 sm:gap-4';
    case 'horizontal-trio':
      return 'grid grid-cols-1 md:grid-cols-3 w-full gap-1.5 sm:gap-2.5';
    case 'vertical-solo':
      return 'grid grid-cols-1 place-items-center max-w-xl mx-auto w-full';
    case 'vertical-duo':
      return 'grid grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto w-full gap-3 sm:gap-6';
  }
}

function ReelFrame({
  photos,
  orientation,
  onPhotoClick,
}: {
  photos: Photo[];
  orientation: PhotoOrientation;
  onPhotoClick: (photo: Photo) => void;
}) {
  const layout = reelLayoutFor(photos.length, orientation);
  const gridClass = reelGridClass(layout);

  return (
    <div className={gridClass}>
      {photos.map((photo, i) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          reelLayout={layout}
          onClick={() => onPhotoClick(photo)}
          fetchPriority={i === 0 ? 'high' : 'auto'}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}
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
  const photos = collection.photos;

  const pages = useMemo(() => paginateByOrientation(photos), [photos]);
  const totalPages = Math.max(1, pages.length);
  const currentPage = pages[page - 1];
  const pageSlice = currentPage?.photos ?? [];

  useEffect(() => {
    setPage(1);
  }, [collection.id]);

  useEffect(() => {
    const head = document.head;
    const lcpPhoto = pageSlice[0];
    if (!lcpPhoto) return;
    const links: HTMLLinkElement[] = [];
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = lcpPhoto.src;
    link.setAttribute('fetchpriority', 'high');
    head.appendChild(link);
    links.push(link);
    return () => {
      links.forEach((l) => l.remove());
    };
  }, [pageSlice]);

  if (photos.length === 0) return null;

  return (
    <section aria-label={`Gallery reel for ${collection.title}`}>
      <div
        key={`${collection.id}-reel-${page}`}
        className="relative isolate motion-safe:animate-slide-reveal"
      >
        <ReelFrame
          photos={pageSlice}
          orientation={currentPage?.orientation ?? 'horizontal'}
          onPhotoClick={onPhotoClick}
        />
      </div>
      {totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 font-mono">
          <div className="flex flex-col gap-1">
            <p className="text-photo-muted/80 text-[0.68rem] uppercase tracking-[0.2em]">
              Reel {page} / {totalPages}
            </p>
            <p className="text-photo-muted/50 text-[0.6rem] uppercase tracking-[0.14em]">
              {pageSlice.length} frame{pageSlice.length === 1 ? '' : 's'} · {photos.length} total
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-[0.65rem] uppercase tracking-[0.22em] text-photo-muted hover:text-photo-fg disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              ◀ Rev −
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-[0.65rem] uppercase tracking-[0.22em] text-photo-muted hover:text-photo-fg disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              Rev + ▶
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
  const [contactPhoto, setContactPhoto] = useState<Photo | null>(null);
  const collection: PhotoCollection = COLLECTIONS.find((c) => c.id === filter)
    ?? COLLECTIONS[0]
    ?? { id: 'empty', title: 'Empty', photos: [] };

  useEffect(() => {
    if (!lightboxPhoto) return;
    const exists = collection.photos.some((photo) => photo.id === lightboxPhoto.id);
    if (!exists) setLightboxPhoto(null);
  }, [collection.photos, lightboxPhoto]);

  const handleContact = () => {
    if (!lightboxPhoto) return;
    setContactPhoto(lightboxPhoto);
    setLightboxPhoto(null);
  };

  const handleLightboxMove = (direction: 'next' | 'previous') => {
    if (!lightboxPhoto) return;
    if (collection.photos.length === 0) return;
    const currentIndex = collection.photos.findIndex((photo) => photo.id === lightboxPhoto.id);
    if (currentIndex < 0) return;
    const step = direction === 'next' ? 1 : -1;
    const nextIndex =
      (currentIndex + step + collection.photos.length) % collection.photos.length;
    setLightboxPhoto(collection.photos[nextIndex]);
  };

  const contactPrefill = contactPhoto ? contactPrefillForPhoto(contactPhoto) : null;

  return (
    <div className="space-y-6">
      {collection.photos.length === 0 && (
        <p className="text-sm text-photo-muted">No photos found in this category.</p>
      )}

      <CollectionSection collection={collection} onPhotoClick={setLightboxPhoto} />

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          onContact={handleContact}
          onPrevious={() => handleLightboxMove('previous')}
          onNext={() => handleLightboxMove('next')}
        />
      )}

      {contactPhoto && contactPrefill && (
        <Suspense fallback={null}>
          <ContactModal
            initialSubject={contactPrefill.subject}
            initialMessage={contactPrefill.message}
            onClose={() => setContactPhoto(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
