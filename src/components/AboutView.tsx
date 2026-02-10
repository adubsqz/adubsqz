import { ABOUT } from '../data';

export default function AboutView() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-black/45">
        <img
          src="/photos/still-life/kodak_200_c_41_ABOUTME.jpg"
          alt="Portrait of Alexander Ames seated in a chair, photographed on film."
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent" />
        <div className="absolute bottom-5 sm:bottom-7 left-5 sm:left-7 right-5 sm:right-7">
          <p className="text-[0.7rem] tracking-[0.25em] uppercase text-photo-muted mb-2">
            Alexander Ames
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl leading-tight mb-3">
            Film, rediscovered.
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
    </div>
  );
}
