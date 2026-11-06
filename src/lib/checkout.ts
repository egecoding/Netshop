import type { AstroCookies } from 'astro';
import type { Prisma } from '@prisma/client';
import { CHECKOUT_DRAFT_COOKIE, FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS, VAT_RATE } from './constants';
import type { shippingStepSchema } from './validation';
import type { z } from 'zod';

export type ShippingDraft = z.infer<typeof shippingStepSchema>;

const DRAFT_MAX_AGE = 60 * 60; // 1 hour

export function getCheckoutDraft(cookies: AstroCookies): ShippingDraft | null {
  const raw = cookies.get(CHECKOUT_DRAFT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShippingDraft;
  } catch {
    return null;
  }
}

export function setCheckoutDraft(cookies: AstroCookies, draft: ShippingDraft): void {
  cookies.set(CHECKOUT_DRAFT_COOKIE, JSON.stringify(draft), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: DRAFT_MAX_AGE,
  });
}

export function clearCheckoutDraft(cookies: AstroCookies): void {
  cookies.delete(CHECKOUT_DRAFT_COOKIE, { path: '/' });
}

export function computeTotals(subtotalCents: number) {
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS || subtotalCents === 0
    ? 0
    : FLAT_SHIPPING_CENTS;
  const taxCents = Math.round(subtotalCents * VAT_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;
  return { shippingCents, taxCents, totalCents };
}

export async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const count = await tx.order.count();
  return `NS-${100000 + count}`;
}
