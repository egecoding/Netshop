import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { getOrCreateCart, addItem, updateItemQuantity, removeItem, getCartSummary } from '../lib/cart';

export const cart = {
  get: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const c = await getOrCreateCart(context.cookies, context.locals.user);
      const summary = await getCartSummary(c.id);
      return {
        itemCount: summary.itemCount,
        subtotalCents: summary.subtotalCents,
        lines: summary.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          lineTotalCents: line.lineTotalCents,
          name: line.product.name,
          slug: line.product.slug,
          sku: line.product.sku,
          priceCents: line.product.priceCents,
          stockQuantity: line.product.stockQuantity,
          image: line.product.images[0] ?? null,
        })),
      };
    },
  }),

  add: defineAction({
    input: z.object({
      productId: z.string(),
      quantity: z.number().int().min(1).max(999).default(1),
    }),
    handler: async (input, context) => {
      const c = await getOrCreateCart(context.cookies, context.locals.user);
      try {
        await addItem(c.id, input.productId, input.quantity);
      } catch (error) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Could not add item to cart',
        });
      }
      const summary = await getCartSummary(c.id);
      return { itemCount: summary.itemCount, subtotalCents: summary.subtotalCents };
    },
  }),

  updateQuantity: defineAction({
    input: z.object({
      productId: z.string(),
      quantity: z.number().int().min(0).max(999),
    }),
    handler: async (input, context) => {
      const c = await getOrCreateCart(context.cookies, context.locals.user);
      await updateItemQuantity(c.id, input.productId, input.quantity);
      const summary = await getCartSummary(c.id);
      return { itemCount: summary.itemCount, subtotalCents: summary.subtotalCents };
    },
  }),

  remove: defineAction({
    input: z.object({ productId: z.string() }),
    handler: async (input, context) => {
      const c = await getOrCreateCart(context.cookies, context.locals.user);
      await removeItem(c.id, input.productId);
      const summary = await getCartSummary(c.id);
      return { itemCount: summary.itemCount, subtotalCents: summary.subtotalCents };
    },
  }),
};
