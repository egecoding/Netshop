import type { APIRoute } from 'astro';
import { buildPlaceholderSvg } from '../../../lib/placeholder';
import { categoryNameFromSku } from '../../../lib/categories';

export const GET: APIRoute = ({ params, url }) => {
  const sku = params.sku ?? 'NS-GEN-000';
  const variantSeed = Number(url.searchParams.get('v') ?? '1') || 1;
  const categoryName = categoryNameFromSku(sku);

  const svg = buildPlaceholderSvg({ sku, variantSeed, categoryName });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
