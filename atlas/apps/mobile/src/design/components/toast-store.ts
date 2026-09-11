import { useSyncExternalStore } from 'react';
type ToastItem = { id: number; message: string };
let sequence = 0;
let queue: readonly ToastItem[] = [];
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
export function showToast(message: string): number {
  const id = ++sequence;
  queue = [...queue, { id, message }];
  emit();
  return id;
}
export function dismissToast(id: number) {
  queue = queue.filter((item) => item.id !== id);
  emit();
}
export function getToasts() {
  return queue;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useToasts() {
  return useSyncExternalStore(subscribe, getToasts, getToasts);
}
