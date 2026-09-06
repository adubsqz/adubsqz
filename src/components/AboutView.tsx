import { ABOUT } from '../data';
import { Button } from './ui/button';
import { RightsReservedBlock } from './LicensingDetails';

interface AboutViewProps {
  onContactClick?: () => void;
}

export default function AboutView({ onContactClick }: AboutViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-10 sm:space-y-14">
      <p className="text-[0.95rem] leading-[1.75] text-photo-fg/85 sm:text-base">{ABOUT.voice}</p>
      <p className="text-[0.95rem] leading-[1.75] text-photo-fg/85 sm:text-base">{ABOUT.portfolioPitch}</p>

      <div className="flex flex-col gap-5 rounded-xl border border-photo-border/80 bg-black/[0.03] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-6 sm:py-6">
        <p className="max-w-xl text-[0.85rem] leading-relaxed text-photo-fg/80 sm:text-[0.9rem]">
          <span className="font-semibold text-photo-fg">Licensing, prints, or a custom site?</span>{' '}
          <span className="text-photo-muted">Use the form for availability and terms—replies are direct.</span>
        </p>
        <Button
          type="button"
          onClick={onContactClick}
          className="shrink-0 rounded-md border-2 border-mcm-rust bg-mcm-rust px-8 py-3.5 text-[0.72rem] font-bold tracking-[0.2em] text-mcm-cream shadow-none hover:bg-mcm-rust/90"
        >
          CONTACT ME
        </Button>
      </div>

      <RightsReservedBlock plain />
    </div>
  );
}
