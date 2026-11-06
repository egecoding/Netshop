// Deterministic placeholder product-image generator. There is no real photography in this
// demo catalog, so every product image is an SVG tile derived from its SKU + category, rather
// than a scraped or stock photo. Swap this out entirely once real product photography exists.

function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

const ACCENTS = ['#f59e0b', '#06b6d4', '#f59e0b', '#06b6d4']; // amber / cyan rotation

function monogram(categoryName: string): string {
  return categoryName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function buildPlaceholderSvg(options: {
  sku: string;
  variantSeed: number;
  categoryName: string;
}): string {
  const { sku, variantSeed, categoryName } = options;
  const hash = hashString(sku + ':' + variantSeed);
  const hue = hash % 360;
  const base = `hsl(${hue}, 32%, 16%)`;
  const baseLight = `hsl(${hue}, 28%, 24%)`;
  const accent = ACCENTS[hash % ACCENTS.length];
  const glyph = monogram(categoryName) || 'NS';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="${escapeXml(categoryName)} placeholder">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${base}" />
      <stop offset="100%" stop-color="${baseLight}" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)" />
  <circle cx="200" cy="170" r="76" fill="none" stroke="${accent}" stroke-width="3" opacity="0.55" />
  <text x="200" y="195" font-family="'JetBrains Mono', monospace" font-size="64" font-weight="700" fill="${accent}" text-anchor="middle">${escapeXml(glyph)}</text>
  <text x="200" y="300" font-family="Inter, sans-serif" font-size="15" letter-spacing="2" fill="rgba(255,255,255,0.65)" text-anchor="middle">${escapeXml(categoryName.toUpperCase())}</text>
  <text x="200" y="330" font-family="'JetBrains Mono', monospace" font-size="13" fill="rgba(255,255,255,0.4)" text-anchor="middle">${escapeXml(sku)}</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });
}
