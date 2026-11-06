import type { AstroCookies } from 'astro';
import { prisma } from './db';
import { CART_COOKIE } from './constants';
import { parseProduct } from './products';
import type { User } from '@prisma/client';

const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

// Read-only lookup for rendering (header badge, /cart page, checkout pages). Never creates a
// cart row or writes a cookie -- Astro forbids setting cookies from a layout/child component
// once the parent page has started streaming its response. Only the mutating Astro Actions
// (which get their own response, not a streamed page) are allowed to call getOrCreateCart below.
export async function getCartIdForDisplay(
  cookies: AstroCookies,
  user: User | null
): Promise<string | null> {
  if (user) {
    const existing = await prisma.cart.findUnique({ where: { userId: user.id } });
    return existing?.id ?? null;
  }

  const cookieCartId = cookies.get(CART_COOKIE)?.value;
  if (!cookieCartId) return null;

  const existing = await prisma.cart.findUnique({ where: { id: cookieCartId } });
  return existing && existing.userId === null ? existing.id : null;
}

export async function getCartSummaryForDisplay(cookies: AstroCookies, user: User | null) {
  const cartId = await getCartIdForDisplay(cookies, user);
  if (!cartId) return { lines: [], subtotalCents: 0, itemCount: 0 };
  return getCartSummary(cartId);
}

export async function getOrCreateCart(cookies: AstroCookies, user: User | null) {
  if (user) {
    const existing = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId: user.id } });
  }

  const cookieCartId = cookies.get(CART_COOKIE)?.value;
  if (cookieCartId) {
    const existing = await prisma.cart.findUnique({ where: { id: cookieCartId } });
    // Only trust the cookie if that cart is still a guest cart (not owned by someone else).
    if (existing && existing.userId === null) return existing;
  }

  const cart = await prisma.cart.create({ data: {} });
  cookies.set(CART_COOKIE, cart.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: GUEST_CART_MAX_AGE,
  });
  return cart;
}

export async function mergeGuestCartIntoUserCart(cookies: AstroCookies, userId: string) {
  const cookieCartId = cookies.get(CART_COOKIE)?.value;
  if (!cookieCartId) return;

  const guestCart = await prisma.cart.findUnique({
    where: { id: cookieCartId },
    include: { items: true },
  });
  if (!guestCart || guestCart.userId !== null) return;

  const userCart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  for (const item of guestCart.items) {
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
      update: { quantity: { increment: item.quantity } },
      create: { cartId: userCart.id, productId: item.productId, quantity: item.quantity },
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  cookies.delete(CART_COOKIE, { path: '/' });
}

export async function addItem(cartId: string, productId: string, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw new Error('Product not available');

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });
  const nextQuantity = Math.min(
    (existing?.quantity ?? 0) + quantity,
    Math.max(product.stockQuantity, 0)
  );

  if (nextQuantity <= 0) throw new Error('Item is out of stock');

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: nextQuantity },
    create: { cartId, productId, quantity: nextQuantity },
  });
}

export async function updateItemQuantity(cartId: string, productId: string, quantity: number) {
  if (quantity <= 0) {
    await prisma.cartItem
      .delete({ where: { cartId_productId: { cartId, productId } } })
      .catch(() => {});
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  const clamped = product ? Math.min(quantity, Math.max(product.stockQuantity, 0)) : quantity;

  await prisma.cartItem.update({
    where: { cartId_productId: { cartId, productId } },
    data: { quantity: Math.max(clamped, 1) },
  });
}

export async function removeItem(cartId: string, productId: string) {
  await prisma.cartItem
    .delete({ where: { cartId_productId: { cartId, productId } } })
    .catch(() => {});
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}

export async function getCartSummary(cartId: string) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: { product: { include: { category: true } } },
    orderBy: { id: 'asc' },
  });

  const lines = items.map((item) => {
    const product = parseProduct(item.product);
    const lineTotalCents = product.priceCents * item.quantity;
    return { ...item, product, lineTotalCents };
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return { lines, subtotalCents, itemCount };
}
