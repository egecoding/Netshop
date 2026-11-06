import { atom } from 'nanostores';

export const cartCount = atom<number>(0);
export const cartSubtotalCents = atom<number>(0);
export const cartDrawerOpen = atom<boolean>(false);

export function setCartSummary(count: number, subtotalCents: number) {
  cartCount.set(count);
  cartSubtotalCents.set(subtotalCents);
}

export function openCartDrawer() {
  cartDrawerOpen.set(true);
}

export function closeCartDrawer() {
  cartDrawerOpen.set(false);
}
