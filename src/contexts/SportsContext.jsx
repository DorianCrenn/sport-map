import { createContext, useContext, useState, useCallback } from 'react';
import { SPORTS as DEFAULT_SPORTS } from '../data/events.js';

const KEY = 'custom-sports';
const DELETED_KEY = 'deleted-sports';
const ARCHIVED_KEY = 'archived-sports';

const load = (k) => { try { return JSON.parse(localStorage.getItem(k) ?? '[]'); } catch { return []; } };
const save = (k, d) => localStorage.setItem(k, JSON.stringify(d));

const SportsContext = createContext(null);

export function SportsProvider({ children }) {
  const [custom, setCustom] = useState(() => load(KEY));
  const [deletedIds, setDeletedIds] = useState(() => load(DELETED_KEY));
  const [archivedIds, setArchivedIds] = useState(() => load(ARCHIVED_KEY));

  const addSport = useCallback((data) => {
    const id = data.label.trim();
    const sport = { id, label: id, color: data.color, iconId: data.iconId || null, isCustom: true };
    setCustom(prev => {
      if (prev.some(s => s.id === id)) return prev; // no duplicates
      const next = [...prev, sport];
      save(KEY, next);
      return next;
    });
    return sport;
  }, []);

  const updateSport = useCallback((id, patch) => {
    setCustom(prev => {
      if (prev.some(s => s.id === id)) {
        const next = prev.map(s => s.id === id ? { ...s, ...patch } : s);
        save(KEY, next);
        return next;
      }
      const base = DEFAULT_SPORTS[id];
      if (base) {
        const next = [...prev, { ...base, ...patch, id, isOverride: true }];
        save(KEY, next);
        return next;
      }
      return prev;
    });
  }, []);

  const deleteSport = useCallback((id) => {
    if (DEFAULT_SPORTS[id]) {
      setDeletedIds(prev => { const next = [...prev, id]; save(DELETED_KEY, next); return next; });
    }
    setCustom(prev => { const next = prev.filter(s => s.id !== id); save(KEY, next); return next; });
    setArchivedIds(prev => { const next = prev.filter(a => a !== id); save(ARCHIVED_KEY, next); return next; });
  }, []);

  const restoreSport = useCallback((id) => {
    setDeletedIds(prev => { const next = prev.filter(d => d !== id); save(DELETED_KEY, next); return next; });
  }, []);

  const toggleArchive = useCallback((id) => {
    setArchivedIds(prev => {
      const next = prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id];
      save(ARCHIVED_KEY, next);
      return next;
    });
  }, []);

  const allSports = {
    ...Object.fromEntries(
      Object.entries(DEFAULT_SPORTS).filter(([id]) => !deletedIds.includes(id))
    ),
    ...Object.fromEntries(custom.filter(s => !deletedIds.includes(s.id)).map(s => [s.id, s])),
  };
  Object.keys(allSports).forEach(id => {
    if (archivedIds.includes(id)) allSports[id] = { ...allSports[id], isArchived: true };
  });

  const value = {
    allSports,
    customSports: custom,
    deletedDefaults: deletedIds.map(id => DEFAULT_SPORTS[id]).filter(Boolean),
    archivedIds,
    addSport,
    updateSport,
    deleteSport,
    restoreSport,
    toggleArchive,
  };

  return <SportsContext.Provider value={value}>{children}</SportsContext.Provider>;
}

export function useSports() {
  const ctx = useContext(SportsContext);
  if (!ctx) throw new Error('useSports must be used inside SportsProvider');
  return ctx;
}
