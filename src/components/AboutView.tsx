import { ABOUT, ABOUT_IMAGE_SRC } from '../data';

interface AboutViewProps {
  onContactClick?: () => void;
}

export default function AboutView({ onContactClick }: AboutViewProps) {
  return (
    <div className="max-w-xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-black/45">
        <img
          src={ABOUT_IMAGE_SRC}
          alt="Portrait of adubs seated in a chair, photographed on film."
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent" />
        <div className="absolute bottom-5 sm:bottom-7 left-5 sm:left-7 right-5 sm:right-7">
          <p className="text-[0.7rem] tracking-[0.25em] uppercase text-photo-muted mb-2">
            {ABOUT.name}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl leading-tight mb-3">
            {ABOUT.tagline}
          </h2>
          <p className="text-xs sm:text-sm md:text-[0.9rem] leading-relaxed text-slate-100/90 max-w-xl">
            {ABOUT.bio}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {ABOUT.socials.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-photo-muted hover:text-photo-fg text-sm uppercase tracking-wider transition-colors"
          >
            {social.name}
          </a>
        ))}
      </div>

      <p className="text-[0.65rem] sm:text-xs italic text-photo-muted pt-4 border-t border-photo-border/50">
        I made this site and hosted it for free (and so could you).{' '}
        {onContactClick ? (
          <>
            <button
              type="button"
              onClick={onContactClick}
              className="text-photo-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-photo-accent rounded"
            >
              Contact me
            </button>
            {' '}if you&apos;re interested.
          </>
        ) : (
          'Contact me if you&apos;re interested.'
        )}
      </p>
    </div>
  );
}
