import { useStore } from '@nanostores/react';
import { toasts } from '../../stores/toast';

export default function ToastHost() {
  const items = useStore(toasts);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
            toast.tone === 'error' ? 'bg-slate-900 text-white' : 'bg-slate-900 text-white'
          }`}
          style={{ animation: 'toast-in 200ms ease-out' }}
        >
          {toast.tone === 'success' ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs">✓</span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sale text-xs">!</span>
          )}
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
