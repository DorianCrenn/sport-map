import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUpcomingFavorites } from '../../hooks/useUpcomingFavorites.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Horloge fixée à 10:00 du matin pour éviter le dépassement de minuit
const NOON = new Date();
NOON.setHours(10, 0, 0, 0);

function hoursFromFixed(h) {
  return new Date(NOON.getTime() + h * 3600_000).toISOString();
}

function daysFromMidnight(d) {
  const base = new Date(NOON);
  base.setDate(base.getDate() + d);
  return base.toISOString();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useUpcomingFavorites', () => {
  beforeEach(() => {
    // Fixer l'horloge à 10h du matin — garantit que +2h et +4h restent dans la journée
    vi.setSystemTime(NOON);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it('retourne {today:[], tomorrow:[]} si favorites est un Set vide', () => {
    const { result } = renderHook(() =>
      useUpcomingFavorites([], new Set())
    );
    expect(result.current.today).toHaveLength(0);
    expect(result.current.tomorrow).toHaveLength(0);
  });

  it('retourne {today:[], tomorrow:[]} si allEvents est vide', () => {
    const { result } = renderHook(() =>
      useUpcomingFavorites([], new Set(['evt-1']))
    );
    expect(result.current.today).toHaveLength(0);
    expect(result.current.tomorrow).toHaveLength(0);
  });

  it('place dans today un event favori à venir dans 2h', () => {
    const ev = { id: 'evt-1', date: hoursFromFixed(2) };
    const { result } = renderHook(() =>
      useUpcomingFavorites([ev], new Set(['evt-1']))
    );
    expect(result.current.today).toHaveLength(1);
    expect(result.current.today[0].id).toBe('evt-1');
  });

  it('exclut de today un event favori déjà passé aujourd\'hui', () => {
    const ev = { id: 'evt-2', date: hoursFromFixed(-1) };
    const { result } = renderHook(() =>
      useUpcomingFavorites([ev], new Set(['evt-2']))
    );
    expect(result.current.today).toHaveLength(0);
  });

  it('place dans tomorrow un event favori pour demain', () => {
    const ev = { id: 'evt-3', date: daysFromMidnight(1) };
    const { result } = renderHook(() =>
      useUpcomingFavorites([ev], new Set(['evt-3']))
    );
    expect(result.current.tomorrow).toHaveLength(1);
    expect(result.current.today).toHaveLength(0);
  });

  it('ignore les events non favoris', () => {
    const ev = { id: 'evt-4', date: hoursFromFixed(3) };
    const { result } = renderHook(() =>
      useUpcomingFavorites([ev], new Set(['autre-id']))
    );
    expect(result.current.today).toHaveLength(0);
  });

  it('ignore les events après-demain (dans tomorrow ni today)', () => {
    const ev = { id: 'evt-5', date: daysFromMidnight(2) };
    const { result } = renderHook(() =>
      useUpcomingFavorites([ev], new Set(['evt-5']))
    );
    expect(result.current.today).toHaveLength(0);
    expect(result.current.tomorrow).toHaveLength(0);
  });

  it('trie les events today par date croissante', () => {
    const ev1 = { id: 'a', date: hoursFromFixed(4) };
    const ev2 = { id: 'b', date: hoursFromFixed(2) };
    const { result } = renderHook(() =>
      useUpcomingFavorites([ev1, ev2], new Set(['a', 'b']))
    );
    expect(result.current.today[0].id).toBe('b'); // 2h avant 4h
    expect(result.current.today[1].id).toBe('a');
  });
});
