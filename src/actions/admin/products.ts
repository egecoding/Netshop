import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { prisma } from '../../lib/db';
import { productInputSchema, specSlotsToRecord, imageUrlSlotsToArray } from '../../lib/validation';
import { serializeSpecs, serializeImages, deserializeImages, placeholderImageUrl } from '../../lib/products';
import { shillingsToCents } from '../../lib/money';

function requireAdmin(user: { role: string } | null | undefined) {
  if (!user || user.role !== 'ADMIN') {
    throw new ActionError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
}

export const products = {
  create: defineAction({
    accept: 'form',
    input: productInputSchema,
    handler: async (input, context) => {
      requireAdmin(context.locals.user);

      const imageUrls = imageUrlSlotsToArray(input);
      const images = imageUrls.length > 0
        ? imageUrls
        : [1, 2, 3].map((v) => placeholderImageUrl(input.sku, v));

      try {
        const product = await prisma.product.create({
          data: {
            sku: input.sku,
            name: input.name,
            slug: input.slug,
            brand: input.brand,
            shortDescription: input.shortDescription,
            description: input.description,
            specs: serializeSpecs(specSlotsToRecord(input)),
            images: serializeImages(images),
            priceCents: shillingsToCents(input.priceShillings),
            compareAtCents: input.compareAtShillings ? shillingsToCents(input.compareAtShillings) : null,
            stockQuantity: input.stockQuantity,
            categoryId: input.categoryId,
            isFeatured: input.isFeatured,
            isActive: input.isActive,
          },
        });
        return { id: product.id };
      } catch (error: any) {
        if (error?.code === 'P2002') {
          throw new ActionError({ code: 'CONFLICT', message: 'SKU or slug already in use' });
        }
        throw error;
      }
    },
  }),

  update: defineAction({
    accept: 'form',
    input: productInputSchema.extend({ id: z.string() }),
    handler: async (input, context) => {
      requireAdmin(context.locals.user);

      const existing = await prisma.product.findUnique({ where: { id: input.id } });
      if (!existing) {
        throw new ActionError({ code: 'NOT_FOUND', message: 'Product not found' });
      }

      const imageUrls = imageUrlSlotsToArray(input);
      const previousImages = deserializeImages(existing.images);
      const images = imageUrls.length > 0 ? imageUrls : previousImages;

      try {
        await prisma.product.update({
          where: { id: input.id },
          data: {
            sku: input.sku,
            name: input.name,
            slug: input.slug,
            brand: input.brand,
            shortDescription: input.shortDescription,
            description: input.description,
            specs: serializeSpecs(specSlotsToRecord(input)),
            images: serializeImages(images),
            priceCents: shillingsToCents(input.priceShillings),
            compareAtCents: input.compareAtShillings ? shillingsToCents(input.compareAtShillings) : null,
            stockQuantity: input.stockQuantity,
            categoryId: input.categoryId,
            isFeatured: input.isFeatured,
            isActive: input.isActive,
          },
        });

        return { id: input.id };
      } catch (error: any) {
        if (error?.code === 'P2002') {
          throw new ActionError({ code: 'CONFLICT', message: 'SKU or slug already in use' });
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
      await prisma.product.delete({ where: { id: input.id } }).catch(() => {});
      return { success: true };
    },
  }),
};
