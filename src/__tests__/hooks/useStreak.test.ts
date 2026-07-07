import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStreak } from '../../hooks/useStreak.js';

const STREAK_KEY = 'sl-streak';
const LAST_KEY   = 'sl-streak-last';

function dayString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toDateString();
}

beforeEach(() => {
  localStorage.clear();
});

describe('useStreak', () => {
  it('première visite → série = 1, isNewToday = true', () => {
    const { result } = renderHook(() => useStreak());
    expect(result.current.count).toBe(1);
    expect(result.current.isNewToday).toBe(true);
    expect(localStorage.getItem(STREAK_KEY)).toBe('1');
    expect(localStorage.getItem(LAST_KEY)).toBe(dayString(0));
  });

  it('visite un jour consécutif → incrémente la série', () => {
    localStorage.setItem(STREAK_KEY, '3');
    localStorage.setItem(LAST_KEY, dayString(-1)); // hier
    const { result } = renderHook(() => useStreak());
    expect(result.current.count).toBe(4);
    expect(result.current.isNewToday).toBe(true);
  });

  it('trou de plusieurs jours → réinitialise à 1', () => {
    localStorage.setItem(STREAK_KEY, '5');
    localStorage.setItem(LAST_KEY, dayString(-3)); // il y a 3 jours
    const { result } = renderHook(() => useStreak());
    expect(result.current.count).toBe(1);
  });

  it('déjà venu aujourd\'hui → série inchangée, isNewToday = false', () => {
    localStorage.setItem(STREAK_KEY, '7');
    localStorage.setItem(LAST_KEY, dayString(0)); // aujourd'hui
    const { result } = renderHook(() => useStreak());
    expect(result.current.count).toBe(7);
    expect(result.current.isNewToday).toBe(false);
  });
});
