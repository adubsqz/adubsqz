import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { COLLECTIONS } from '../data';
import type { Photo, PhotoCollection } from '../types';
import type { GalleryFilter } from '../types';
import {
  paginateByOrientation,
  reelLayoutFor,
  type PhotoOrientation,
  type ReelLayout,
} from '../gallery-reel';
import WatermarkedImage from './WatermarkedImage';
import InquiryModal from './InquiryModal';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

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
      return 'gallery-image block h-auto max-h-[min(90dvh,1080px)] w-auto max-w-[min(1220px,99vw)] object-contain';
    case 'horizontal-duo':
      return 'gallery-image block h-auto max-h-[min(82dvh,920px)] w-auto max-w-full object-contain';
    case 'horizontal-trio':
      return 'gallery-image block h-auto max-h-[min(72dvh,760px)] w-auto max-w-full object-contain';
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
      className={`block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mcm-rust focus-visible:ring-offset-2 focus-visible:ring-offset-mcm-ink group ${className}`}
      style={{ perspective: '880px' }}
    >
      <div
        className="relative mx-auto w-fit max-w-full rounded-sm border-[3px] border-mcm-cream/95 bg-mcm-ink shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(0,0,0,0.4)] transition-[border-color,box-shadow] duration-300 group-hover:border-mcm-sage/70 group-hover:shadow-[0_16px_52px_rgba(0,0,0,0.62)] motion-safe:transition-transform motion-safe:duration-300 [transform-style:preserve-3d]"
        style={
          reducedMotion
            ? undefined
            : {
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.002)`,
              }
        }
      >
        <span
          className="pointer-events-none absolute -left-1.5 top-2 z-[5] h-px w-4 bg-mcm-rust/90"
          aria-hidden
        />
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
        <div className="absolute inset-0 bg-gradient-to-t from-mcm-ink/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-sm" />
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

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] bg-black" aria-hidden onClick={onClose} />
      <div
        ref={scrollRef}
        className="fixed inset-0 z-[101] overflow-y-auto overflow-x-hidden overscroll-contain bg-photo-bg text-photo-fg"
        role="dialog"
        aria-modal="true"
        aria-label="Image lightbox"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-6 border-b border-photo-border bg-photo-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:py-5">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-photo-muted">
              Navigate
            </span>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Button
                type="button"
                onClick={onPrevious}
                variant="outline"
                className="rounded-sm px-5 py-2.5 text-[0.7rem] tracking-[0.18em]"
                aria-label="View previous photo"
              >
                Prev
              </Button>
              <Button
                type="button"
                onClick={onNext}
                variant="outline"
                className="rounded-sm px-5 py-2.5 text-[0.7rem] tracking-[0.18em]"
                aria-label="View next photo"
              >
                Next
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:border-l sm:border-photo-border sm:pl-6">
            <Button
              type="button"
              onClick={onInquire}
              variant="default"
              className="rounded-sm px-6 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em]"
            >
              Request Invoice
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="rounded-sm px-5 py-2.5 text-[0.7rem] tracking-[0.18em]"
            >
              Close
            </Button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[min(1200px,100vw)] flex-col px-4 pb-16 pt-8 sm:px-8 sm:pb-12 sm:pt-10 lg:pb-16">

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

        <div className="h-14 shrink-0 sm:h-20" aria-hidden />

        {photo.caption && (
          <>
            <Card className="rounded-sm border-photo-border bg-photo-panel/80">
              <CardContent className="px-5 py-4 sm:px-8">
                <p className="text-center text-sm italic leading-relaxed text-photo-muted">{photo.caption}</p>
              </CardContent>
            </Card>
            <div className="h-10 sm:h-14" aria-hidden />
          </>
        )}

        <section className="space-y-8 border-t border-photo-border pt-12 sm:space-y-10 sm:pt-16">
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-photo-muted">
            Licensing & fulfillment
          </div>
          <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:gap-12">
            <Card className="space-y-4 rounded-sm border-photo-border bg-photo-panel/60 p-6 sm:p-8">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-photo-muted">
                Trade Portal + Tearsheet
              </p>
              <p className="text-sm leading-relaxed text-photo-fg/90">
                Printable 8.5×11 lookbook pages with image SKU and title under each frame—available on request.
              </p>
              <Button
                type="button"
                onClick={onInquireTearsheet}
                variant="ghost"
                className="h-auto justify-start px-0 pt-2 text-left text-[0.75rem] tracking-[0.18em] text-mcm-rust hover:text-mcm-rust/90"
              >
                Inquire about tearsheet…
              </Button>
            </Card>
            <Card className="space-y-4 rounded-sm border-photo-border bg-photo-panel/60 p-6 sm:p-8">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-photo-muted">
                Fulfillment Options
              </p>
              <p className="text-sm leading-relaxed text-photo-fg/90">
                Digital licensing: 24 hours. Framed print production: 3-5 business days. Ready-to-hang NYC/NJ
                delivery: 5-7 business days.
              </p>
              <p className="text-sm leading-relaxed text-photo-fg/90">
                Short-term set rental is available at 20% of retail per 30-day term.
              </p>
            </Card>
          </div>
        </section>

        <div className="h-6 shrink-0 sm:h-8" aria-hidden />
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
      return 'grid grid-cols-1 md:grid-cols-2 w-full gap-3 sm:gap-5';
    case 'horizontal-trio':
      return 'grid grid-cols-1 md:grid-cols-3 w-full gap-2.5 sm:gap-4';
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
          fetchPriority={i < 2 ? 'high' : 'auto'}
          loading={i < 3 ? 'eager' : 'lazy'}
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
    const preloadTargets = pageSlice.slice(0, 2);
    if (preloadTargets.length === 0) return;
    const links: HTMLLinkElement[] = [];
    preloadTargets.forEach((p, i) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = p.src;
      if (i === 0) link.setAttribute('fetchpriority', 'high');
      head.appendChild(link);
      links.push(link);
    });
    return () => {
      links.forEach((l) => l.remove());
    };
  }, [pageSlice]);

  if (photos.length === 0) return null;

  return (
    <section aria-label={`Gallery reel for ${collection.title}`}>
      <div
        key={`${collection.id}-reel-${page}`}
        className="relative isolate pb-1 motion-safe:animate-slide-reveal"
      >
        <div
          className="pointer-events-none absolute -inset-3 sm:-inset-5 rounded-sm opacity-[0.12] motion-safe:animate-specimen-flash"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(196,92,38,0.25) 0%, transparent 55%), radial-gradient(circle at 20% 0%, rgba(235,230,220,0.12), transparent 50%)',
          }}
        />
        <ReelFrame
          photos={pageSlice}
          orientation={currentPage?.orientation ?? 'horizontal'}
          onPhotoClick={onPhotoClick}
        />
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-mcm-line/35 pt-5 font-mono">
          <div className="flex flex-col gap-1">
            <p className="text-photo-muted text-[0.7rem] uppercase tracking-[0.22em]">
              Reel {page} / {totalPages}
            </p>
            <p className="text-photo-muted/65 text-[0.62rem] uppercase tracking-[0.16em]">
              {pageSlice.length} frame{pageSlice.length === 1 ? '' : 's'} on this reel · {photos.length} total
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-[0.65rem] uppercase tracking-[0.24em] text-photo-fg border border-mcm-rust/35 rounded-sm bg-mcm-ink/40 hover:border-mcm-rust/55 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ◀ Rev −
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 text-[0.65rem] uppercase tracking-[0.24em] text-photo-fg border border-mcm-rust/35 rounded-sm bg-mcm-ink/40 hover:border-mcm-rust/55 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
  const [inquiry, setInquiry] = useState<{ photo: Photo; initialNotes?: string } | null>(null);
  const collection: PhotoCollection = COLLECTIONS.find((c) => c.id === filter)
    ?? COLLECTIONS[0]
    ?? { id: 'empty', title: 'Empty', photos: [] };

  useEffect(() => {
    if (!lightboxPhoto) return;
    const exists = collection.photos.some((photo) => photo.id === lightboxPhoto.id);
    if (!exists) setLightboxPhoto(null);
  }, [collection.photos, lightboxPhoto]);

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
    if (collection.photos.length === 0) return;
    const currentIndex = collection.photos.findIndex((photo) => photo.id === lightboxPhoto.id);
    if (currentIndex < 0) return;
    const step = direction === 'next' ? 1 : -1;
    const nextIndex =
      (currentIndex + step + collection.photos.length) % collection.photos.length;
    setLightboxPhoto(collection.photos[nextIndex]);
  };

  return (
    <div className="space-y-10 -mx-3 sm:-mx-5 lg:-mx-8">
      {collection.photos.length === 0 && (
        <p className="text-sm text-photo-muted">No photos found in this category.</p>
      )}

      <CollectionSection collection={collection} onPhotoClick={setLightboxPhoto} />

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
