import { useEffect } from 'react';
import { translateSupabaseError } from './translateSupabaseError.js';

const EVENT_NAME = 'sl-hook-error';

export function dispatchError(error: string | Error | unknown): void {
  const message = typeof error === 'string' ? error : translateSupabaseError(error);
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { message } }));
}

export function useErrorBus(onError: (msg: string) => void): void {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      onError(detail?.message ?? 'Une erreur est survenue');
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [onError]);
}
