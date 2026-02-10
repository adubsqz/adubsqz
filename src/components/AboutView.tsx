import { ABOUT } from '../data';

export default function AboutView() {
  return (
    <div className="max-w-xl">
      <h2 className="font-display text-2xl sm:text-3xl text-photo-fg mb-6">
        About
      </h2>
      <p className="font-display text-xl text-photo-muted mb-4">
        {ABOUT.name}
      </p>
      <p className="text-photo-fg leading-relaxed mb-8">
        {ABOUT.bio}
      </p>
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
