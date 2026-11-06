import type { APIRoute } from 'astro';
import { invalidateSession, clearSessionCookie } from '../lib/auth';

// A plain POST endpoint rather than an Astro Action: logout can be triggered from any account
// page via the shared AccountLayout sidebar, and a plain redirect is simpler than wiring
// Astro.getActionResult into every page that embeds that layout.
export const POST: APIRoute = async (context) => {
  if (context.locals.sessionId) {
    await invalidateSession(context.locals.sessionId);
  }
  clearSessionCookie(context.cookies);
  return context.redirect('/');
};
