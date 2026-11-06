import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Note: plain-text optional fields use .optional().nullable() rather than
// .optional().or(z.literal('')) -- when Astro's form-mode action parsing meets an empty text
// input, it extracts `null` (not `''` or `undefined`), which only the `.nullable()` form accepts.
export const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(2).default('KE'),
  phone: z.string().trim().max(30).optional().nullable(),
});

export const shippingStepSchema = addressSchema.extend({
  email: emailSchema,
});

export const paymentMethodSchema = z.enum(['mock_card', 'cash_on_delivery']);

// Astro's form-mode action parsing can reconstruct a single nested object (e.g. "spec1.key")
// from FormData, but not an array of objects -- so the spec editor uses a fixed number of
// key/value slots rather than a dynamic repeater. Empty slots are dropped before saving.
export const SPEC_SLOT_COUNT = 8;
const specSlotSchema = z
  .object({ key: z.string().trim().default(''), value: z.string().trim().default('') })
  .optional();

const specSlotFields = Object.fromEntries(
  Array.from({ length: SPEC_SLOT_COUNT }, (_, i) => [`spec${i + 1}`, specSlotSchema])
) as Record<`spec${number}`, typeof specSlotSchema>;

const IMAGE_URL_SLOT_COUNT = 5;
const imageUrlFields = Object.fromEntries(
  Array.from({ length: IMAGE_URL_SLOT_COUNT }, (_, i) => [
    `imageUrl${i + 1}`,
    z.string().trim().max(500).optional().nullable(),
  ])
) as Record<`imageUrl${number}`, z.ZodOptional<z.ZodNullable<z.ZodString>>>;

export const productInputSchema = z.object({
  sku: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  brand: z.string().trim().min(1).max(80),
  shortDescription: z.string().trim().min(1).max(240),
  description: z.string().trim().min(1).max(4000),
  priceShillings: z.coerce.number().min(0),
  compareAtShillings: z.coerce.number().min(0).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0),
  categoryId: z.string().min(1),
  isFeatured: z.coerce.boolean().optional().default(false),
  isActive: z.coerce.boolean().optional().default(true),
  ...imageUrlFields,
  ...specSlotFields,
});

export function imageUrlSlotsToArray(input: Record<string, unknown>): string[] {
  const urls: string[] = [];
  for (let i = 1; i <= IMAGE_URL_SLOT_COUNT; i++) {
    const val = input[`imageUrl${i}`];
    if (typeof val === 'string' && val.trim().length > 0) {
      urls.push(val.trim());
    }
  }
  return urls;
}

export function specSlotsToRecord(input: Record<string, unknown>): Record<string, string> {
  const record: Record<string, string> = {};
  for (let i = 1; i <= SPEC_SLOT_COUNT; i++) {
    const slot = input[`spec${i}`] as { key?: string; value?: string } | undefined;
    if (slot?.key && slot.key.trim() && slot.value && slot.value.trim()) {
      record[slot.key.trim()] = slot.value.trim();
    }
  }
  return record;
}

export function recordToSpecSlots(specs: Record<string, string>): { key: string; value: string }[] {
  const slots = Object.entries(specs).map(([key, value]) => ({ key, value }));
  while (slots.length < SPEC_SLOT_COUNT) slots.push({ key: '', value: '' });
  return slots.slice(0, SPEC_SLOT_COUNT);
}

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().trim().max(500).optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
});

// Same fixed-slot approach as the product spec editor (see above) -- form-mode actions can't
// parse an array of objects from FormData.
export const QUOTE_ITEM_SLOT_COUNT = 6;
const quoteItemSlotSchema = z
  .object({
    productId: z.string().trim().default(''),
    productNameFreeText: z.string().trim().max(200).default(''),
    quantity: z.coerce.number().int().min(0).default(0),
  })
  .optional();

const quoteItemSlotFields = Object.fromEntries(
  Array.from({ length: QUOTE_ITEM_SLOT_COUNT }, (_, i) => [`item${i + 1}`, quoteItemSlotSchema])
) as Record<`item${number}`, typeof quoteItemSlotSchema>;

export const quoteRequestSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  contactName: z.string().trim().min(1).max(160),
  email: emailSchema,
  phone: z.string().trim().max(30).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  ...quoteItemSlotFields,
});

export function quoteSlotsToItems(
  input: Record<string, unknown>
): { productId?: string; productNameFreeText?: string; quantity: number }[] {
  const items: { productId?: string; productNameFreeText?: string; quantity: number }[] = [];
  for (let i = 1; i <= QUOTE_ITEM_SLOT_COUNT; i++) {
    const slot = input[`item${i}`] as
      | { productId?: string; productNameFreeText?: string; quantity?: number }
      | undefined;
    if (slot && slot.quantity && slot.quantity > 0 && (slot.productId || slot.productNameFreeText)) {
      items.push({
        productId: slot.productId || undefined,
        productNameFreeText: slot.productNameFreeText || undefined,
        quantity: slot.quantity,
      });
    }
  }
  return items;
}
