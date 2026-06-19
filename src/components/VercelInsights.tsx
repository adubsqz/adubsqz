import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

/** Loaded in a separate chunk so gallery LCP is not blocked by observability SDKs. */
export default function VercelInsights() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
