import type { APIRoute } from 'astro';
import { getOrCreateCart, removeItem } from '../../../lib/cart';

// See update.ts for why this is a plain endpoint rather than an Astro Action.
export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const productId = String(form.get('productId') ?? '');

  if (productId) {
    const cart = await getOrCreateCart(context.cookies, context.locals.user);
    await removeItem(cart.id, productId);
  }

  return context.redirect('/cart');
};
