// All monetary amounts are stored as integer "cents" (1/100 of a shilling) for exact
// arithmetic, but KES retail pricing is conventionally shown as whole shillings -- so display
// formatting rounds away the subunit rather than showing it.
const formatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return formatter.format(cents / 100);
}

export function percentOff(priceCents: number, compareAtCents: number): number {
  if (compareAtCents <= priceCents) return 0;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

// Admin forms accept human-friendly shilling amounts (e.g. "24900.50") rather than raw
// subunits, since asking an admin to type priceCents directly is error-prone.
export function shillingsToCents(shillings: number): number {
  return Math.round(shillings * 100);
}

export function centsToShillings(cents: number): number {
  return cents / 100;
}
