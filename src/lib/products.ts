import type { Product } from '@prisma/client';

export type ParsedProduct = Omit<Product, 'specs' | 'images'> & {
  specs: Record<string, string>;
  images: string[];
};

export function parseProduct(product: Product): ParsedProduct {
  return {
    ...product,
    specs: safeParse<Record<string, string>>(product.specs, {}),
    images: safeParse<string[]>(product.images, []),
  };
}

export function serializeSpecs(specs: Record<string, string>): string {
  return JSON.stringify(specs);
}

export function serializeImages(images: string[]): string {
  return JSON.stringify(images);
}

export function deserializeImages(value: string): string[] {
  return safeParse<string[]>(value, []);
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function placeholderImageUrl(sku: string, variant = 1): string {
  return `/api/placeholder/${encodeURIComponent(sku)}.svg?v=${variant}`;
}
