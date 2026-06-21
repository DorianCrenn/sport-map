import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { SPORTS as DEFAULT_SPORTS } from '../data/events.js';

const KEY          = 'custom-sports';
const DELETED_KEY  = 'deleted-sports';
const ARCHIVED_KEY = 'archived-sports';

interface SportDef {
  id: string;
  label: string;
  color?: string;
  iconId?: string | null;
  isCustom?: boolean;
  isOverride?: boolean;
  isArchived?: boolean;
}

interface SportPatch {
  label?: string;
  color?: string;
  iconId?: string | null;
}

interface SportsContextValue {
  allSports: Record<string, SportDef>;
  customSports: SportDef[];
  deletedDefaults: SportDef[];
  archivedIds: string[];
  addSport: (data: { label: string; color?: string; iconId?: string }) => SportDef;
  updateSport: (id: string, patch: SportPatch) => void;
  deleteSport: (id: string) => void;
  restoreSport: (id: string) => void;
  toggleArchive: (id: string) => void;
}

const load = <T,>(k: string): T[] => {
  try { return JSON.parse(localStorage.getItem(k) ?? '[]') as T[]; } catch { return []; }
};
const save = <T,>(k: string, d: T) => localStorage.setItem(k, JSON.stringify(d));

const SportsContext = createContext<SportsContextValue | null>(null);

export function SportsProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom]         = useState<SportDef[]>(() => load<SportDef>(KEY));
  const [deletedIds, setDeletedIds] = useState<string[]>(() => load<string>(DELETED_KEY));
  const [archivedIds, setArchivedIds] = useState<string[]>(() => load<string>(ARCHIVED_KEY));

  const addSport = useCallback((data: { label: string; color?: string; iconId?: string }): SportDef => {
    const id = data.label.trim();
    const sport: SportDef = { id, label: id, color: data.color, iconId: data.iconId || null, isCustom: true };
    setCustom(prev => {
      if (prev.some(s => s.id === id)) return prev;
      const next = [...prev, sport];
      save(KEY, next);
      return next;
    });
    return sport;
  }, []);

  const updateSport = useCallback((id: string, patch: SportPatch) => {
    setCustom(prev => {
      if (prev.some(s => s.id === id)) {
        const next = prev.map(s => s.id === id ? { ...s, ...patch } : s);
        save(KEY, next);
        return next;
      }
      const base = (DEFAULT_SPORTS as Record<string, SportDef>)[id];
      if (base) {
        const next = [...prev, { ...base, ...patch, id, isOverride: true }];
        save(KEY, next);
        return next;
      }
      return prev;
    });
  }, []);

  const deleteSport = useCallback((id: string) => {
    if ((DEFAULT_SPORTS as Record<string, unknown>)[id]) {
      setDeletedIds(prev => { const next = [...prev, id]; save(DELETED_KEY, next); return next; });
    }
    setCustom(prev => { const next = prev.filter(s => s.id !== id); save(KEY, next); return next; });
    setArchivedIds(prev => { const next = prev.filter(a => a !== id); save(ARCHIVED_KEY, next); return next; });
  }, []);

  const restoreSport = useCallback((id: string) => {
    setDeletedIds(prev => { const next = prev.filter(d => d !== id); save(DELETED_KEY, next); return next; });
  }, []);

  const toggleArchive = useCallback((id: string) => {
    setArchivedIds(prev => {
      const next = prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id];
      save(ARCHIVED_KEY, next);
      return next;
    });
  }, []);

  const allSports = useMemo(() => {
    const defaults = DEFAULT_SPORTS as Record<string, SportDef>;
    const base = Object.fromEntries(
      Object.entries(defaults).filter(([id]) => !deletedIds.includes(id)),
    );
    const result: Record<string, SportDef> = {
      ...base,
      ...Object.fromEntries(custom.filter(s => !deletedIds.includes(s.id)).map(s => [s.id, s])),
    };
    archivedIds.forEach(id => {
      if (result[id]) result[id] = { ...result[id], isArchived: true };
    });
    return result;
  }, [custom, deletedIds, archivedIds]);

  const deletedDefaults = useMemo(
    () => deletedIds.map(id => (DEFAULT_SPORTS as Record<string, SportDef>)[id]).filter(Boolean) as SportDef[],
    [deletedIds],
  );

  const value = useMemo<SportsContextValue>(() => ({
    allSports, customSports: custom, deletedDefaults, archivedIds,
    addSport, updateSport, deleteSport, restoreSport, toggleArchive,
  }), [allSports, custom, deletedDefaults, archivedIds, addSport, updateSport, deleteSport, restoreSport, toggleArchive]);

  return <SportsContext.Provider value={value}>{children}</SportsContext.Provider>;
}

export function useSports(): SportsContextValue {
  const ctx = useContext(SportsContext);
  if (!ctx) throw new Error('useSports must be used inside SportsProvider');
  return ctx;
}
