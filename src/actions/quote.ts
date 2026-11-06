import { defineAction, ActionError } from 'astro:actions';
import { prisma } from '../lib/db';
import { quoteRequestSchema, quoteSlotsToItems } from '../lib/validation';

export const quote = {
  submit: defineAction({
    accept: 'form',
    input: quoteRequestSchema,
    handler: async (input) => {
      const items = quoteSlotsToItems(input);
      if (items.length === 0) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Add at least one line item' });
      }

      const request = await prisma.quoteRequest.create({
        data: {
          companyName: input.companyName,
          contactName: input.contactName,
          email: input.email,
          phone: input.phone || null,
          notes: input.notes || null,
          items: {
            create: items.map((item) => ({
              productId: item.productId || null,
              productNameFreeText: item.productNameFreeText || null,
              quantity: item.quantity,
            })),
          },
        },
      });
      return { id: request.id };
    },
  }),
};
