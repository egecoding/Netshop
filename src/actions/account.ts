import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { prisma } from '../lib/db';
import { addressSchema } from '../lib/validation';

function requireUser(user: { id: string } | null | undefined) {
  if (!user) {
    throw new ActionError({ code: 'UNAUTHORIZED', message: 'You must be signed in' });
  }
  return user;
}

export const account = {
  addAddress: defineAction({
    accept: 'form',
    input: addressSchema.extend({ isDefault: z.coerce.boolean().optional().default(false) }),
    handler: async (input, context) => {
      const user = requireUser(context.locals.user);

      if (input.isDefault) {
        await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      }

      const address = await prisma.address.create({
        data: {
          userId: user.id,
          fullName: input.fullName,
          line1: input.line1,
          line2: input.line2 || null,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          phone: input.phone || null,
          isDefault: input.isDefault,
        },
      });
      return { id: address.id };
    },
  }),

  deleteAddress: defineAction({
    accept: 'form',
    input: z.object({ id: z.string() }),
    handler: async (input, context) => {
      const user = requireUser(context.locals.user);
      await prisma.address.deleteMany({ where: { id: input.id, userId: user.id } });
      return { success: true };
    },
  }),
};
