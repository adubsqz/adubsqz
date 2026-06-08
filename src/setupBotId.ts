import { initBotId } from 'botid/client/core';

/** Vercel BotID client — attaches challenge headers to protected API calls. */
export function setupBotId(): void {
  if (import.meta.env.VITE_E2E === '1') return;

  initBotId({
    protect: [
      { path: '/api/inquire', method: 'POST' },
      { path: '/api/auth', method: 'POST' },
    ],
  });
}
