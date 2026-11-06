import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartCount } from '../../stores/cart';

export default function CartBadge({ initialCount }: { initialCount: number }) {
  const count = useStore(cartCount);
  const [bump, setBump] = useState(0);
  const prevCount = useRef(initialCount);

  useEffect(() => {
    cartCount.set(initialCount);
    prevCount.current = initialCount;
  }, [initialCount]);

  useEffect(() => {
    if (count !== prevCount.current) {
      setBump((n) => n + 1);
      prevCount.current = count;
    }
  }, [count]);

  if (count <= 0) return null;

  return (
    <span
      key={bump}
      className="absolute -top-2 -right-2 flex h-5 min-w-5 animate-pulse-badge items-center justify-center rounded-full bg-sale px-1 text-[11px] font-bold text-white shadow"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
