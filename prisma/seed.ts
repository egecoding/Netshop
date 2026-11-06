import { prisma } from '../src/lib/db';
import { CATEGORIES } from '../src/lib/categories';
import { PRODUCTS } from './seed-data';
import { serializeSpecs, serializeImages, placeholderImageUrl } from '../src/lib/products';
import { hashPassword } from '../src/lib/auth';
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS, VAT_RATE } from '../src/lib/constants';

// seed-data.ts prices are authored as USD-cent reference values (easier to eyeball/compare
// against real networking gear prices); this is where they actually become the store's real
// KES prices. ~130 KES/USD is an approximate, deliberately round rate for demo pricing, not a
// live FX feed.
const USD_TO_KES_RATE = 130;

function toKesCents(usdCents: number): number {
  // Round to the nearest 50 KES so prices look like real retail pricing (e.g. "11,550"),
  // not an arbitrary FX-converted figure (e.g. "11,537").
  const rawKes = (usdCents / 100) * USD_TO_KES_RATE;
  return Math.round(rawKes / 50) * 50 * 100;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Deterministic PRNG so re-running the seed produces the same stock/featured distribution.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  console.log('Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.quoteRequestItem.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.session.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding categories...');
  const categoryIdBySlug = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({
      data: { name: cat.name, slug: cat.slug, description: cat.description, sortOrder: cat.sortOrder },
    });
    categoryIdBySlug.set(cat.slug, created.id);
  }

  console.log(`Seeding ${PRODUCTS.length} products...`);
  const rand = mulberry32(42);
  const seqByCode = new Map<string, number>();

  for (const p of PRODUCTS) {
    const catDef = CATEGORIES.find((c) => c.slug === p.categorySlug);
    if (!catDef) throw new Error(`Unknown category slug "${p.categorySlug}" in seed-data.ts`);

    const seq = (seqByCode.get(catDef.code) ?? 0) + 1;
    seqByCode.set(catDef.code, seq);
    const sku = `NS-${catDef.code}-${String(seq).padStart(3, '0')}`;
    const slug = slugify(p.name);

    const stockRoll = rand();
    let stockQuantity: number;
    if (stockRoll < 0.08) {
      stockQuantity = 0; // a few out-of-stock items to exercise that state
    } else if (stockRoll < 0.2) {
      stockQuantity = Math.floor(rand() * 5) + 1; // low stock
    } else {
      stockQuantity = Math.floor(rand() * 180) + 20;
    }

    const isFeatured = rand() < 0.18;
    const images = [1, 2, 3].map((v) => placeholderImageUrl(sku, v));

    // Synthesize a "was" price for ~30% of products that don't already have one authored in
    // seed-data.ts, so the Flash Sale section and discount badges have enough real content.
    // Computed in the seed-data.ts reference currency; converted to real KES cents below.
    let compareAtUsdCents = p.compareAtCents ?? null;
    if (!compareAtUsdCents && rand() < 0.3) {
      const markup = 1.15 + rand() * 0.35; // 15-50% "off"
      compareAtUsdCents = Math.round(p.priceCents * markup);
    }

    // Demo-only star ratings for visual authenticity (marketplace-style cards show rating +
    // review count) -- weighted toward 3.8-5.0 since that's the realistic range for live
    // products that haven't been pulled from a catalog for poor reviews.
    const ratingAvg = Math.round((3.8 + rand() * 1.2) * 10) / 10;
    const ratingCount = Math.floor(rand() * 480) + 5;

    await prisma.product.create({
      data: {
        sku,
        name: p.name,
        slug,
        brand: p.brand,
        shortDescription: p.shortDescription,
        description: p.description,
        specs: serializeSpecs(p.specs),
        images: serializeImages(images),
        priceCents: toKesCents(p.priceCents),
        compareAtCents: compareAtUsdCents ? toKesCents(compareAtUsdCents) : null,
        stockQuantity,
        ratingAvg,
        ratingCount,
        categoryId: categoryIdBySlug.get(p.categorySlug)!,
        isFeatured,
      },
    });
  }

  console.log('Seeding users...');
  const adminPasswordHash = await hashPassword('AdminDemo123!');
  await prisma.user.create({
    data: { email: 'admin@netshop.test', name: 'Store Admin', role: 'ADMIN', passwordHash: adminPasswordHash },
  });

  const customerPasswordHash = await hashPassword('CustomerDemo123!');
  const customer1 = await prisma.user.create({
    data: { email: 'jordan@example.com', name: 'Jordan Reyes', role: 'CUSTOMER', passwordHash: customerPasswordHash },
  });
  const customer2 = await prisma.user.create({
    data: { email: 'morgan@example.com', name: 'Morgan Lee', role: 'CUSTOMER', passwordHash: customerPasswordHash },
  });

  await prisma.address.create({
    data: {
      userId: customer1.id,
      fullName: 'Jordan Reyes',
      line1: '48 Ridgeways Road, Kileleshwa',
      city: 'Nairobi',
      state: 'Nairobi County',
      postalCode: '00100',
      country: 'KE',
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      userId: customer2.id,
      fullName: 'Morgan Lee',
      line1: '910 Nyali Road',
      city: 'Mombasa',
      state: 'Mombasa County',
      postalCode: '80100',
      country: 'KE',
      isDefault: true,
    },
  });

  console.log('Seeding sample orders...');
  const sampleProducts = await prisma.product.findMany({
    where: { stockQuantity: { gt: 0 } },
    take: 4,
    orderBy: { createdAt: 'asc' },
  });

  async function createSampleOrder(
    userId: string,
    email: string,
    name: string,
    address: { line1: string; city: string; state: string; postalCode: string },
    items: typeof sampleProducts,
    paymentMethod: 'mock_card' | 'cash_on_delivery'
  ) {
    const orderNumber = `NS-${100000 + (await prisma.order.count())}`;
    const orderItems = items.map((prod) => ({
      productId: prod.id,
      nameSnapshot: prod.name,
      skuSnapshot: prod.sku,
      unitPriceCents: prod.priceCents,
      quantity: 1,
      lineTotalCents: prod.priceCents,
    }));
    const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
    const taxCents = Math.round(subtotalCents * VAT_RATE);
    // Cash collected on delivery hasn't actually been paid yet; a card charge has.
    const status = paymentMethod === 'cash_on_delivery' ? 'PENDING_PAYMENT' : 'PAID';

    await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status,
        email,
        shippingName: name,
        shippingLine1: address.line1,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: 'KE',
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents: subtotalCents + shippingCents + taxCents,
        paymentMethod,
        items: { create: orderItems },
      },
    });
  }

  await createSampleOrder(
    customer1.id,
    customer1.email,
    customer1.name,
    { line1: '48 Ridgeways Road, Kileleshwa', city: 'Nairobi', state: 'Nairobi County', postalCode: '00100' },
    sampleProducts.slice(0, 2),
    'mock_card'
  );
  await createSampleOrder(
    customer2.id,
    customer2.email,
    customer2.name,
    { line1: '910 Nyali Road', city: 'Mombasa', state: 'Mombasa County', postalCode: '80100' },
    sampleProducts.slice(2, 4),
    'cash_on_delivery'
  );

  console.log(`Done. Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products.`);
  console.log('Admin login:    admin@netshop.test / AdminDemo123!');
  console.log('Customer login: jordan@example.com or morgan@example.com / CustomerDemo123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
