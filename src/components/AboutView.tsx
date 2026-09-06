import { ABOUT } from '../data';
import { Button } from './ui/button';
import { RightsReservedBlock } from './LicensingDetails';

interface AboutViewProps {
  onContactClick?: () => void;
}

export default function AboutView({ onContactClick }: AboutViewProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8 sm:space-y-12">
      <p className="font-display text-[1.65rem] leading-[1.35] text-photo-fg sm:text-4xl sm:leading-[1.3]">
        {ABOUT.voice}
      </p>
      <p className="text-[1.05rem] leading-relaxed text-photo-muted sm:text-lg">{ABOUT.portfolioPitch}</p>

      <div className="flex flex-col gap-4 rounded-3xl bg-photo-panel/80 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-7 sm:py-7">
        <p className="max-w-md text-[1.02rem] leading-snug text-photo-fg/85">
          Need prints, a license, or a site? One message. No funnel.
        </p>
        <Button
          type="button"
          onClick={onContactClick}
          className="h-12 shrink-0 rounded-full px-8 text-base font-medium normal-case tracking-normal shadow-none"
        >
          Let&apos;s talk
        </Button>
      </div>

      <RightsReservedBlock plain />
    </div>
  );
}
