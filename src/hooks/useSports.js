import { useState, useCallback } from 'react';
import { SPORTS as DEFAULT_SPORTS } from '../data/events.js';

const KEY = 'custom-sports';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } };
const save = d => localStorage.setItem(KEY, JSON.stringify(d));

export function useSports() {
  const [custom, setCustom] = useState(load);

  const addSport = useCallback((data) => {
    const sport = {
      id: data.label.trim().replace(/\s+/g, '_'),
      label: data.label.trim(),
      color: data.color,
      emoji: data.emoji || '🏅',
      isCustom: true,
    };
    setCustom(prev => {
      const next = [...prev, sport];
      save(next);
      return next;
    });
    return sport;
  }, []);

  const deleteSport = useCallback((id) => {
    setCustom(prev => {
      const next = prev.filter(s => s.id !== id);
      save(next);
      return next;
    });
  }, []);

  const updateSport = useCallback((id, patch) => {
    setCustom(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...patch } : s);
      save(next);
      return next;
    });
  }, []);

  // Merged: default sports first, then custom
  const allSports = { ...DEFAULT_SPORTS, ...Object.fromEntries(custom.map(s => [s.id, s])) };

  return { allSports, customSports: custom, addSport, deleteSport, updateSport };
}
