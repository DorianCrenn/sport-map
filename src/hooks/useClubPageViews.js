import { useCallback } from 'react';

const STORAGE_KEY = 'sl_club_views';
const MAX_ENTRIES = 500;

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function useClubPageViews() {
  const recordView = useCallback((clubId) => {
    const store = readStore();
    const key = String(clubId);
    const existing = Array.isArray(store[key]) ? store[key] : [];
    // Keep only the last MAX_ENTRIES to cap storage
    const updated = [...existing, Date.now()].slice(-MAX_ENTRIES);
    writeStore({ ...store, [key]: updated });
  }, []);

  const getViewCount = useCallback((clubId, days = 30) => {
    const store = readStore();
    const key = String(clubId);
    const entries = Array.isArray(store[key]) ? store[key] : [];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return entries.filter(ts => ts >= cutoff).length;
  }, []);

  return { recordView, getViewCount };
}
