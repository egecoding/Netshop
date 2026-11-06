import { useState } from 'react';
import { actions } from 'astro:actions';
import { setCartSummary } from '../../stores/cart';
import { pushToast } from '../../stores/toast';

export default function AddToCartButton({
  productId,
  productName,
  inStock,
  quantity = 1,
  compact = false,
}: {
  productId: string;
  productName?: string;
  inStock: boolean;
  quantity?: number;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  async function handleAdd() {
    setStatus('loading');
    const { data, error } = await actions.cart.add({ productId, quantity });
    if (error) {
      setStatus('error');
      pushToast(error.message || 'Could not add item to cart', 'error');
      return;
    }
    setCartSummary(data.itemCount, data.subtotalCents);
    pushToast(productName ? `Added "${productName}" to cart` : 'Added to cart');
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
    <button
      type="button"
      onClick={handleAdd}
      disabled={status === 'loading'}
      className={`btn btn-primary ${compact ? 'w-full text-sm' : 'w-full'}`}
    >
      {status === 'loading' ? 'Adding...' : status === 'error' ? 'Try again' : '+ Add to Cart'}
    </button>
  );
}
