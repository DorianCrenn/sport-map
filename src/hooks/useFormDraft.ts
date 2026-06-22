import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_TTL      = 24 * 60 * 60 * 1000;
const DEFAULT_DEBOUNCE = 1500;

interface DraftEntry<T> { data: T; ts: number; }

function readRaw<T>(key: string, ttlMs: number): DraftEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEntry<T>;
    if (!parsed?.data || !parsed?.ts) { localStorage.removeItem(key); return null; }
    if (Date.now() - parsed.ts > ttlMs) { localStorage.removeItem(key); return null; }
    return parsed;
  } catch {
    return null;
  }
}

interface UseFormDraftOptions {
  ttlMs?: number;
  debounceMs?: number;
}

interface UseFormDraftResult<T> {
  hasDraft: boolean;
  saveDraft: (value: T) => void;
  saveImmediate: (value: T) => void;
  loadDraft: () => T | null;
  clearDraft: () => void;
}

export function useFormDraft<T>(
  storageKey: string,
  { ttlMs = DEFAULT_TTL, debounceMs = DEFAULT_DEBOUNCE }: UseFormDraftOptions = {},
): UseFormDraftResult<T> {
  const [hasDraft, setHasDraft] = useState(() => !!readRaw<T>(storageKey, ttlMs));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHasDraft(!!readRaw<T>(storageKey, ttlMs));
  }, [storageKey, ttlMs]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const saveDraft = useCallback((value: T) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ data: value, ts: Date.now() }));
        setHasDraft(true);
      } catch { /* quota plein */ }
    }, debounceMs);
  }, [storageKey, debounceMs]);

  const saveImmediate = useCallback((value: T) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ data: value, ts: Date.now() }));
      setHasDraft(true);
    } catch { /* quota plein */ }
  }, [storageKey]);

  const loadDraft = useCallback((): T | null => {
    return readRaw<T>(storageKey, ttlMs)?.data ?? null;
  }, [storageKey, ttlMs]);

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setHasDraft(false);
  }, [storageKey]);

  return { hasDraft, saveDraft, saveImmediate, loadDraft, clearDraft };
}
