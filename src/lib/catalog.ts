import type { Prisma } from '@prisma/client';
import { prisma } from './db';
import { parseProduct, type ParsedProduct } from './products';
import { PAGE_SIZE } from './constants';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export interface CatalogFilters {
  categorySlug?: string;
  brands: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  inStockOnly: boolean;
  q?: string;
  sort: SortOption;
  page: number;
}

export function parseCatalogFilters(url: URL): CatalogFilters {
  const params = url.searchParams;
  const brands = params.getAll('brand').filter(Boolean);
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  const sort = params.get('sort');

  return {
    categorySlug: params.get('category') || undefined,
    brands,
    minPriceCents: minPrice ? Math.round(Number(minPrice) * 100) : undefined,
    maxPriceCents: maxPrice ? Math.round(Number(maxPrice) * 100) : undefined,
    inStockOnly: params.get('inStock') === '1',
    q: params.get('q')?.trim() || undefined,
    sort: (['featured', 'price-asc', 'price-desc', 'newest'] as const).includes(sort as SortOption)
      ? (sort as SortOption)
      : 'featured',
    page: Math.max(1, Number(params.get('page')) || 1),
  };
}

export async function queryCatalog(filters: CatalogFilters): Promise<{
  products: ParsedProduct[];
  total: number;
  totalPages: number;
  availableBrands: string[];
}> {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }
  if (filters.brands.length > 0) {
    where.brand = { in: filters.brands };
  }
  if (filters.minPriceCents !== undefined || filters.maxPriceCents !== undefined) {
    where.priceCents = {
      ...(filters.minPriceCents !== undefined ? { gte: filters.minPriceCents } : {}),
      ...(filters.maxPriceCents !== undefined ? { lte: filters.maxPriceCents } : {}),
    };
  }
  if (filters.inStockOnly) {
    where.stockQuantity = { gt: 0 };
  }
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { sku: { contains: filters.q } },
      { brand: { contains: filters.q } },
      { shortDescription: { contains: filters.q } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === 'price-asc'
      ? { priceCents: 'asc' }
      : filters.sort === 'price-desc'
        ? { priceCents: 'desc' }
        : filters.sort === 'newest'
          ? { createdAt: 'desc' }
          : { isFeatured: 'desc' };

  const [total, productsRaw, brandRows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.findMany({
      where: filters.categorySlug ? { isActive: true, category: { slug: filters.categorySlug } } : { isActive: true },
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    }),
  ]);

  return {
    products: productsRaw.map(parseProduct),
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    availableBrands: brandRows.map((b) => b.brand),
  };
}
