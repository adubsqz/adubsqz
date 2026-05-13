import { ABOUT, ABOUT_IMAGE_SRC } from '../data';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface AboutViewProps {
  onContactClick?: () => void;
}

export default function AboutView({ onContactClick }: AboutViewProps) {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
        <div className="flex flex-col gap-2">
          <div className="relative overflow-hidden rounded-3xl bg-black/45 aspect-[4/5] max-h-[32rem]">
            <img
              src={ABOUT_IMAGE_SRC}
              alt="Portrait, photographed on film."
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          </div>
          {ABOUT.photoCredit && (
            <p className="text-center text-[0.65rem] italic leading-snug text-photo-muted sm:text-xs md:text-left">
              {ABOUT.photoCredit}
            </p>
          )}
        </div>

        <Card className="bg-black/35">
          <CardContent className="space-y-4 p-5 sm:p-7">
          <p className="text-[0.7rem] tracking-[0.25em] uppercase text-photo-muted">
            {ABOUT.name}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl leading-tight">
            {ABOUT.tagline}
          </h2>
          <p className="text-xs sm:text-sm md:text-[0.92rem] leading-relaxed text-photo-fg/90">
            {ABOUT.bio}
          </p>
          </CardContent>
        </Card>
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

      <div className="space-y-5 pt-4 border-t border-photo-border/50">
        <p className="max-w-prose text-[0.65rem] leading-relaxed text-photo-muted sm:text-xs">
          I design and build lightweight portfolio sites for photographers, visual artists, musicians, and
          filmmakers—gallery layouts, audio and video embeds, contact flows, and hosting handled end to end. If you
          need a site for your own work, say what you have in mind and we can talk scope and budget.
        </p>
        {onContactClick && (
          <Card className="flex flex-col gap-5 border-white/[0.14] bg-gradient-to-br from-white/[0.07] via-black/20 to-black/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6">
            <p className="max-w-xl text-[0.8rem] leading-relaxed text-photo-fg/80 sm:text-sm">
              <span className="font-medium text-white/95">Licensing, prints, or a custom site?</span>{' '}
              <span className="text-photo-muted/88">Use the form for availability and terms—replies are direct.</span>
            </p>
            <Button
              type="button"
              onClick={onContactClick}
              className="shrink-0 border-2 border-photo-accent px-8 py-3.5 text-[0.72rem] font-bold tracking-[0.24em] shadow-[0_2px_0_rgba(0,0,0,0.35),0_12px_36px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.14)_inset] transition-[transform,filter,box-shadow] hover:-translate-y-0.5 active:translate-y-0"
            >
              CONTACT ME
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
