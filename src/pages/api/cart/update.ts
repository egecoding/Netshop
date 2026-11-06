import type { APIRoute } from 'astro';
import { getOrCreateCart, updateItemQuantity } from '../../../lib/cart';

// Plain form-POST endpoint so the /cart page's quantity controls work without JS. The CartDrawer
// island uses the JSON `cart.updateQuantity` action instead for its instant, JS-driven updates --
// Astro Actions can't share one handler between JSON and FormData callers (see cart drawer vs.
// this page for why these are separate code paths).
export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const productId = String(form.get('productId') ?? '');
  const quantity = Number(form.get('quantity') ?? 0);

  if (productId) {
    const cart = await getOrCreateCart(context.cookies, context.locals.user);
    await updateItemQuantity(cart.id, productId, quantity);
  }

  return context.redirect('/cart');
};
