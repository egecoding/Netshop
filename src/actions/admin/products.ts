import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { prisma } from '../../lib/db';
import { productInputSchema, specSlotsToRecord } from '../../lib/validation';
import { serializeSpecs, serializeImages, deserializeImages, placeholderImageUrl } from '../../lib/products';
import { saveProductImage, deleteProductImage, UploadValidationError } from '../../lib/uploads';
import { shillingsToCents } from '../../lib/money';

function requireAdmin(user: { role: string } | null | undefined) {
  if (!user || user.role !== 'ADMIN') {
    throw new ActionError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
}

async function uploadOrNull(file: File | undefined): Promise<string | null> {
  if (!file || file.size === 0) return null;
  try {
    return await saveProductImage(file);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
    }
    throw error;
  }
}

export const products = {
  create: defineAction({
    accept: 'form',
    input: productInputSchema,
    handler: async (input, context) => {
      requireAdmin(context.locals.user);

      const uploadedUrl = await uploadOrNull(input.image);
      const images = uploadedUrl
        ? [uploadedUrl, placeholderImageUrl(input.sku, 2), placeholderImageUrl(input.sku, 3)]
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

      const uploadedUrl = await uploadOrNull(input.image);
      const previousImages = deserializeImages(existing.images);
      const images = uploadedUrl ? [uploadedUrl, ...previousImages.slice(1)] : previousImages;

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

        // Only remove the old image once the DB write naming the new one has actually
        // succeeded -- otherwise a failed update would leave the product referencing an
        // image file that no longer exists.
        if (uploadedUrl && previousImages[0]?.startsWith('/product-images/')) {
          await deleteProductImage(previousImages[0]);
        }

        return { id: input.id };
      } catch (error: any) {
        // The DB write didn't take, so the newly uploaded file (if any) is an orphan -- clean
        // it up rather than leaking it on disk with nothing pointing to it.
        if (uploadedUrl) await deleteProductImage(uploadedUrl);

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

      const existing = await prisma.product.findUnique({ where: { id: input.id } });
      if (existing) {
        for (const image of deserializeImages(existing.images)) {
          if (image.startsWith('/product-images/')) await deleteProductImage(image);
        }
      }

      await prisma.product.delete({ where: { id: input.id } }).catch(() => {});
      return { success: true };
    },
  }),
};
