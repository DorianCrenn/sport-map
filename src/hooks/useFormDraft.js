import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_TTL      = 24 * 60 * 60 * 1000; // 24h
const DEFAULT_DEBOUNCE = 1500;

function readRaw(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.ts) { localStorage.removeItem(key); return null; }
    if (Date.now() - parsed.ts > ttlMs) { localStorage.removeItem(key); return null; }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * useFormDraft — Draft générique localStorage avec debounce.
 *
 * @param {string} storageKey — clé localStorage (ex: 'sl-announcement-draft')
 * @param {{ ttlMs?: number, debounceMs?: number }} options
 * @returns {{ hasDraft, saveDraft, loadDraft, clearDraft }}
 *
 * Usage :
 *   const { hasDraft, saveDraft, loadDraft, clearDraft } = useFormDraft('sl-foo-draft');
 *
 *   // Sauvegarder à chaque changement
 *   useEffect(() => { saveDraft({ message, type }); }, [message, type]);
 *
 *   // Restaurer depuis le bandeau DraftBanner
 *   const restored = loadDraft();  // → { message, type } ou null
 *
 *   // Effacer après submit réussi
 *   clearDraft();
 */
export function useFormDraft(storageKey, { ttlMs = DEFAULT_TTL, debounceMs = DEFAULT_DEBOUNCE } = {}) {
  const [hasDraft, setHasDraft] = useState(() => !!readRaw(storageKey, ttlMs));
  const timerRef = useRef(null);

  // Synchroniser si la clé change
  useEffect(() => {
    setHasDraft(!!readRaw(storageKey, ttlMs));
  }, [storageKey, ttlMs]);

  // Nettoyage timer au démontage
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const saveDraft = useCallback((value) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ data: value, ts: Date.now() }));
        setHasDraft(true);
      } catch { /* quota plein — silencieux */ }
    }, debounceMs);
  }, [storageKey, debounceMs]);

  const loadDraft = useCallback(() => {
    return readRaw(storageKey, ttlMs)?.data ?? null;
  }, [storageKey, ttlMs]);

  const clearDraft = useCallback(() => {
    clearTimeout(timerRef.current);
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setHasDraft(false);
  }, [storageKey]);

  return { hasDraft, saveDraft, loadDraft, clearDraft };
}
