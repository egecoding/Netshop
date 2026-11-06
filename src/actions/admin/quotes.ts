import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { prisma } from '../../lib/db';

function requireAdmin(user: { role: string } | null | undefined) {
  if (!user || user.role !== 'ADMIN') {
    throw new ActionError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
}

export const quotes = {
  markResponded: defineAction({
    accept: 'form',
    input: z.object({ id: z.string() }),
    handler: async (input, context) => {
      requireAdmin(context.locals.user);
      await prisma.quoteRequest.update({ where: { id: input.id }, data: { status: 'RESPONDED' } });
      return { success: true };
    },
  }),
};
