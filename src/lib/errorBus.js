/**
 * errorBus — Canal d'erreurs global (hooks → UI).
 *
 * Les hooks n'ont pas accès au ToastContext. Ce module permet aux hooks
 * de dispatcher des erreurs que l'app shell écoute pour afficher des toasts.
 *
 * Usage (hook) :
 *   import { dispatchError } from '../lib/errorBus.js';
 *   dispatchError('Impossible de charger les clubs');
 *
 * Usage (App) :
 *   import { useErrorBus } from '../lib/errorBus.js';
 *   useErrorBus(msg => toast({ message: msg, type: 'error' }));
 */

import { useEffect } from 'react';
import { translateSupabaseError } from './translateSupabaseError.js';

const EVENT_NAME = 'sl-hook-error';

/**
 * Dispatche une erreur traduite vers l'AppShell.
 * @param {string|Error} error — message string ou objet Error Supabase
 */
export function dispatchError(error) {
  const message = typeof error === 'string' ? error : translateSupabaseError(error);
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { message } }));
}

export function useErrorBus(onError) {
  useEffect(() => {
    const handler = (e) => onError?.(e.detail?.message ?? 'Une erreur est survenue');
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [onError]);
}
