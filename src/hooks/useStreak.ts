import { useState, useEffect } from 'react';

const STREAK_KEY = 'sl-streak';
const LAST_KEY   = 'sl-streak-last';

export interface StreakState {
  count: number;
  isNewToday: boolean;
}

export function useStreak(): StreakState {
  const [state, setState] = useState<StreakState>(() => {
    const count = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10) || 0;
    const last  = localStorage.getItem(LAST_KEY) ?? '';
    const today = new Date().toDateString();
    return { count, isNewToday: last !== today };
  });

  useEffect(() => {
    const today = new Date().toDateString();
    const last  = localStorage.getItem(LAST_KEY) ?? '';
    if (last === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = last === yesterday.toDateString();
    const prev = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10) || 0;
    const next = wasYesterday ? prev + 1 : 1;

    localStorage.setItem(STREAK_KEY, String(next));
    localStorage.setItem(LAST_KEY, today);
    setState({ count: next, isNewToday: true });
  }, []);

  return state;
}
