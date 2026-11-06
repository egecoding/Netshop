import { atom } from 'nanostores';

export interface ToastMessage {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

export const toasts = atom<ToastMessage[]>([]);

let counter = 0;

export function pushToast(message: string, tone: ToastMessage['tone'] = 'success') {
  const id = ++counter;
  toasts.set([...toasts.get(), { id, message, tone }]);
  setTimeout(() => {
    toasts.set(toasts.get().filter((t) => t.id !== id));
  }, 2600);
}
