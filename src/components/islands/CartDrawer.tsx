import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { actions } from 'astro:actions';
import { formatCents } from '../../lib/money';
import { cartDrawerOpen, closeCartDrawer, setCartSummary } from '../../stores/cart';

interface Line {
  productId: string;
  quantity: number;
  lineTotalCents: number;
  name: string;
  slug: string;
  sku: string;
  priceCents: number;
  stockQuantity: number;
  image: string | null;
}

export default function CartDrawer() {
  const open = useStore(cartDrawerOpen);
  const [lines, setLines] = useState<Line[]>([]);
  const [subtotalCents, setSubtotalCents] = useState(0);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data } = await actions.cart.get({});
    if (data) {
      setLines(data.lines);
      setSubtotalCents(data.subtotalCents);
      setCartSummary(data.itemCount, data.subtotalCents);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  async function updateQuantity(productId: string, quantity: number) {
    const { data } = await actions.cart.updateQuantity({ productId, quantity });
    if (data) setCartSummary(data.itemCount, data.subtotalCents);
    refresh();
  }

  async function removeLine(productId: string) {
    const { data } = await actions.cart.remove({ productId });
    if (data) setCartSummary(data.itemCount, data.subtotalCents);
    refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={closeCartDrawer} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
          <button onClick={closeCartDrawer} className="text-slate-400 hover:text-slate-700" aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && lines.length === 0 ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-slate-500">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3">
                  {line.image && (
                    <img src={line.image} alt={line.name} className="h-16 w-16 rounded-md bg-slate-100 object-contain p-1" />
                  )}
                  <div className="flex-1">
                    <a href={`/products/${line.slug}`} className="text-sm font-semibold text-slate-900 hover:text-info">
                      {line.name}
                    </a>
                    <p className="font-mono text-xs text-slate-400">{line.sku}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <select
                        value={line.quantity}
                        onChange={(e) => updateQuantity(line.productId, Number(e.target.value))}
                        className="input w-16 py-1 text-sm"
                      >
                        {Array.from({ length: Math.min(line.stockQuantity, 20) || 1 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => removeLine(line.productId)} className="text-xs font-semibold text-red-600 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold text-slate-900">{formatCents(line.lineTotalCents)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-mono font-bold text-slate-900">{formatCents(subtotalCents)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Shipping and tax calculated at checkout.</p>
            <a href="/cart" className="btn btn-secondary mt-4 w-full">
              View Cart
            </a>
            <a href="/checkout" className="btn btn-primary mt-2 w-full">
              Checkout
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
