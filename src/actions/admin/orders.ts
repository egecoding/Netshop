import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { prisma } from '../../lib/db';

function requireAdmin(user: { role: string } | null | undefined) {
  if (!user || user.role !== 'ADMIN') {
    throw new ActionError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
}

export const orders = {
  updateStatus: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string(),
      status: z.enum(['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    }),
    handler: async (input, context) => {
      requireAdmin(context.locals.user);
      await prisma.order.update({ where: { id: input.id }, data: { status: input.status } });
      return { success: true };
    },
  }),
};
