import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { prisma } from '../lib/db';
import { getOrCreateCart, getCartSummary, clearCart } from '../lib/cart';
import { shippingStepSchema, paymentMethodSchema } from '../lib/validation';
import {
  setCheckoutDraft,
  getCheckoutDraft,
  clearCheckoutDraft,
  computeTotals,
  generateOrderNumber,
} from '../lib/checkout';

export const checkout = {
  setShipping: defineAction({
    accept: 'form',
    input: shippingStepSchema,
    handler: async (input, context) => {
      const c = await getOrCreateCart(context.cookies, context.locals.user);
      const summary = await getCartSummary(c.id);
      if (summary.lines.length === 0) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Your cart is empty' });
      }
      setCheckoutDraft(context.cookies, input);
      return { ok: true };
    },
  }),

  placeOrder: defineAction({
    accept: 'form',
    input: z.object({ paymentMethod: paymentMethodSchema }),
    handler: async (input, context) => {
      const draft = getCheckoutDraft(context.cookies);
      if (!draft) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Missing shipping information' });
      }

      const c = await getOrCreateCart(context.cookies, context.locals.user);
      const summary = await getCartSummary(c.id);
      if (summary.lines.length === 0) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Your cart is empty' });
      }

      for (const line of summary.lines) {
        if (!line.product.isActive || line.quantity > line.product.stockQuantity) {
          throw new ActionError({
            code: 'CONFLICT',
            message: `${line.product.name} no longer has enough stock. Please update your cart.`,
          });
        }
      }

      const { shippingCents, taxCents, totalCents } = computeTotals(summary.subtotalCents);
      // Cash on Delivery hasn't actually been paid yet -- only a (simulated) card charge has.
      const status = input.paymentMethod === 'cash_on_delivery' ? 'PENDING_PAYMENT' : 'PAID';

      const order = await prisma.$transaction(async (tx) => {
        const orderNumber = await generateOrderNumber(tx);
        const created = await tx.order.create({
          data: {
            orderNumber,
            userId: context.locals.user?.id ?? null,
            status,
            email: draft.email,
            shippingName: draft.fullName,
            shippingLine1: draft.line1,
            shippingLine2: draft.line2 || null,
            shippingCity: draft.city,
            shippingState: draft.state,
            shippingPostalCode: draft.postalCode,
            shippingCountry: draft.country,
            subtotalCents: summary.subtotalCents,
            shippingCents,
            taxCents,
            totalCents,
            paymentMethod: input.paymentMethod,
            items: {
              create: summary.lines.map((line) => ({
                productId: line.product.id,
                nameSnapshot: line.product.name,
                skuSnapshot: line.product.sku,
                unitPriceCents: line.product.priceCents,
                quantity: line.quantity,
                lineTotalCents: line.lineTotalCents,
              })),
            },
          },
        });

        for (const line of summary.lines) {
          await tx.product.update({
            where: { id: line.product.id },
            data: { stockQuantity: { decrement: line.quantity } },
          });
        }

        return created;
      });

      await clearCart(c.id);
      clearCheckoutDraft(context.cookies);

      return { orderId: order.id, orderNumber: order.orderNumber };
    },
  }),
};
