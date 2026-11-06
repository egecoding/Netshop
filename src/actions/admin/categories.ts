import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { prisma } from '../../lib/db';
import { categoryInputSchema } from '../../lib/validation';

function requireAdmin(user: { role: string } | null | undefined) {
  if (!user || user.role !== 'ADMIN') {
    throw new ActionError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
}

export const categories = {
  create: defineAction({
    accept: 'form',
    input: categoryInputSchema,
    handler: async (input, context) => {
      requireAdmin(context.locals.user);
      try {
        const category = await prisma.category.create({
          data: {
            name: input.name,
            slug: input.slug,
            description: input.description || null,
            sortOrder: input.sortOrder,
          },
        });
        return { id: category.id };
      } catch (error: any) {
        if (error?.code === 'P2002') {
          throw new ActionError({ code: 'CONFLICT', message: 'Slug already in use' });
        }
        throw error;
      }
    },
  }),

  update: defineAction({
    accept: 'form',
    input: categoryInputSchema.extend({ id: z.string() }),
    handler: async (input, context) => {
      requireAdmin(context.locals.user);
      try {
        await prisma.category.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug: input.slug,
            description: input.description || null,
            sortOrder: input.sortOrder,
          },
        });
        return { id: input.id };
      } catch (error: any) {
        if (error?.code === 'P2002') {
          throw new ActionError({ code: 'CONFLICT', message: 'Slug already in use' });
        }
        throw error;
      }
    },
  }),

  delete: defineAction({
    accept: 'form',
    input: z.object({ id: z.string() }),
    handler: async (input, context) => {
      requireAdmin(context.locals.user);
      const productCount = await prisma.product.count({ where: { categoryId: input.id } });
      if (productCount > 0) {
        throw new ActionError({
          code: 'CONFLICT',
          message: `Cannot delete: ${productCount} product(s) still use this category`,
        });
      }
      await prisma.category.delete({ where: { id: input.id } }).catch(() => {});
      return { success: true };
    },
  }),
};
