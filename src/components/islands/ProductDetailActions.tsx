import { useState } from 'react';
import { actions } from 'astro:actions';
import { setCartSummary } from '../../stores/cart';
import { pushToast } from '../../stores/toast';

export default function ProductDetailActions({
  productId,
  productName,
  stockQuantity,
}: {
  productId: string;
  productName: string;
  stockQuantity: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const inStock = stockQuantity > 0;
  const maxQuantity = Math.min(stockQuantity, 99);

  async function handleAdd() {
    setStatus('loading');
    const { data, error } = await actions.cart.add({ productId, quantity });
    if (error) {
      setStatus('error');
      pushToast(error.message || 'Could not add item to cart', 'error');
      return;
    }
    setCartSummary(data.itemCount, data.subtotalCents);
    pushToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}"${productName}" to cart`);
    setStatus('idle');
  }

  if (!inStock) {
    return (
      <button type="button" disabled className="btn btn-secondary w-full cursor-not-allowed opacity-60">
        Out of Stock
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-full border border-slate-300">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-2 text-slate-600 hover:bg-slate-50"
          aria-label="Decrease quantity"
        >
          &minus;
        </button>
        <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          className="px-3 py-2 text-slate-600 hover:bg-slate-50"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button type="button" onClick={handleAdd} disabled={status === 'loading'} className="btn btn-primary flex-1">
        {status === 'loading' ? 'Adding...' : status === 'error' ? 'Try again' : '+ Add to Cart'}
      </button>
    </div>
  );
}
