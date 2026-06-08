import { checkBotId } from 'botid/server';

/** Reject automated clients on protected POST routes. Returns a 403 Response or null. */
export async function denyIfBot(): Promise<Response | null> {
  const verification = await checkBotId();
  if (verification.isBot) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
