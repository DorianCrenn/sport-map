import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockInsert, mockLimit } = vi.hoisted(() => {
  const mockLimit  = vi.fn(() => Promise.resolve({ data: [], error: null }));
  const mockOrder  = vi.fn(() => ({ order: mockOrder, limit: mockLimit }));
  const mockIs     = vi.fn(() => ({ order: mockOrder }));
  const mockEq     = vi.fn(() => ({ is: mockIs }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
  const mockDelete = vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) }));
  const mockFrom   = vi.fn((table) => {
    if (table === 'app_feedback') return { select: mockSelect, insert: mockInsert };
    if (table === 'app_feedback_votes') return { insert: mockInsert, delete: mockDelete };
    return { select: mockSelect, insert: mockInsert };
  });
  return { mockFrom, mockInsert, mockLimit };
});

vi.mock('../../lib/supabase.js', () => ({ supabase: { from: mockFrom } }));
vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'user-1', clubId: 'club-1' } })),
}));

import { useFeedback } from '../../hooks/useFeedback.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockLimit.mockResolvedValue({ data: [], error: null });
});

// ── searchSimilar — fonction pure ─────────────────────────────────────────────

describe('searchSimilar', () => {
  it('retourne les idées dont le titre contient la query', () => {
    const { result } = renderHook(() => useFeedback());
    const ideas = [
      { id: '1', title: 'Partager les affiches Instagram', description: null },
      { id: '2', title: 'Améliorer la carte', description: null },
    ];
    expect(result.current.searchSimilar('affiche', ideas)).toHaveLength(1);
    expect(result.current.searchSimilar('affiche', ideas)[0].id).toBe('1');
  });

  it('cherche aussi dans description', () => {
    const { result } = renderHook(() => useFeedback());
    const ideas = [{ id: '1', title: 'Carte', description: 'Filtrer par affiche' }];
    expect(result.current.searchSimilar('affiche', ideas)).toHaveLength(1);
  });

  it('retourne [] si query vide', () => {
    const { result } = renderHook(() => useFeedback());
    expect(result.current.searchSimilar('', [{ id: '1', title: 'Test', description: null }])).toHaveLength(0);
  });

  it('retourne [] si liste vide', () => {
    const { result } = renderHook(() => useFeedback());
    expect(result.current.searchSimilar('test', [])).toHaveLength(0);
  });

  it('limite à 3 résultats', () => {
    const { result } = renderHook(() => useFeedback());
    const ideas = Array.from({ length: 5 }, (_, i) => ({ id: String(i), title: 'test truc', description: null }));
    expect(result.current.searchSimilar('test', ideas)).toHaveLength(3);
  });
});

// ── fetchIdeas ────────────────────────────────────────────────────────────────

describe('fetchIdeas', () => {
  it('charge les idées depuis Supabase', async () => {
    const ideas = [{ id: '1', title: 'Idée 1', status: 'new', vote_count: 0 }];
    mockLimit.mockResolvedValueOnce({ data: ideas, error: null });

    const { result } = renderHook(() => useFeedback());
    let loaded;
    await act(async () => { loaded = await result.current.fetchIdeas(); });

    expect(loaded).toEqual(ideas);
    expect(result.current.ideas).toEqual(ideas);
  });

  it('retourne le cache sans rappeler Supabase si déjà chargé', async () => {
    const ideas = [{ id: '1', title: 'Idée 1', status: 'new', vote_count: 0 }];
    mockLimit.mockResolvedValueOnce({ data: ideas, error: null });

    const { result } = renderHook(() => useFeedback());
    await act(async () => { await result.current.fetchIdeas(); });
    await act(async () => { await result.current.fetchIdeas(); });

    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

// ── submit ────────────────────────────────────────────────────────────────────

describe('submit', () => {
  it('insère dans app_feedback via Supabase', async () => {
    const { result } = renderHook(() => useFeedback());
    await act(async () => {
      await result.current.submit({ type: 'bug', title: 'Bug test', description: null, category: 'ui', pageUrl: '/', browserInfo: {}, appVersion: '1.0.0' });
    });
    expect(mockInsert).toHaveBeenCalled();
  });
});
