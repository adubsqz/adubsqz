import { ABOUT, ABOUT_IMAGE_SRC } from '../data';

interface AboutViewProps {
  onContactClick?: () => void;
}

export default function AboutView({ onContactClick }: AboutViewProps) {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
        <div className="relative overflow-hidden rounded-3xl bg-black/45 aspect-[4/5] max-h-[32rem]">
          <img
            src={ABOUT_IMAGE_SRC}
            alt="Portrait of adubs seated in a chair, photographed on film."
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        </div>

        <div className="rounded-2xl border border-photo-border/60 bg-black/35 p-5 sm:p-7 space-y-4">
          <p className="text-[0.7rem] tracking-[0.25em] uppercase text-photo-muted">
            {ABOUT.name}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl leading-tight">
            {ABOUT.tagline}
          </h2>
          <p className="text-xs sm:text-sm md:text-[0.92rem] leading-relaxed text-slate-100/90">
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

      <div className="pt-4 border-t border-photo-border/50 flex flex-wrap items-center gap-3">
        <p className="text-[0.65rem] sm:text-xs italic text-photo-muted">
          I made this site and hosted it for free (and so could you).
        </p>
        {onContactClick ? (
          <button
            type="button"
            onClick={onContactClick}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-photo-accent text-photo-bg text-xs uppercase tracking-[0.16em] font-semibold shadow-lg shadow-photo-accent/20 hover:brightness-110 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-photo-accent"
          >
            Contact me
          </button>
        ) : (
          <span className="text-[0.68rem] sm:text-xs uppercase tracking-[0.12em] text-photo-accent">
            Contact me if you&apos;re interested.
          </span>
        )}
      </div>
    </div>
  );
}
