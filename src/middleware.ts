import { defineMiddleware } from 'astro:middleware';
import { initDb } from './lib/db';
import { initR2 } from './lib/uploads';
import { validateSessionToken } from './lib/auth';
import { SESSION_COOKIE } from './lib/constants';

export const onRequest = defineMiddleware(async (context, next) => {
  const runtime = (context.locals as any).runtime;
  if (runtime?.env) {
    initDb(runtime.env.DB);
    initR2(runtime.env.PRODUCT_IMAGES);
  }

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  let user = null;
  let sessionId: string | null = null;

  if (token) {
    const result = await validateSessionToken(token);
    if (result) {
      user = result.user;
      sessionId = result.sessionId;
    }
  }

  context.locals.user = user;
  context.locals.sessionId = sessionId;

  const path = context.url.pathname;

  if (path.startsWith('/account') && !user) {
    return context.redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  if (path.startsWith('/admin')) {
    if (!user) {
      return context.redirect(`/login?next=${encodeURIComponent(path)}`);
    }
    if (user.role !== 'ADMIN') {
      return context.redirect('/');
    }
  }

  return next();
});
