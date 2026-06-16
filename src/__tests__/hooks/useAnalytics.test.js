/**
 * Tests useAnalytics — tracking événements avec consentement RGPD
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockInsert } = vi.hoisted(() => ({ mockInsert: vi.fn() }));
const { mockIsDemoMode } = vi.hoisted(() => ({ mockIsDemoMode: vi.fn(() => false) }));
const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: mockInsert.mockReturnValue(Promise.resolve({ error: null })) })),
  },
  isDemoMode: mockIsDemoMode,
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: mockUseAuth,
}));

// sessionStorage mock
const sStore = {};
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem:    vi.fn(k     => sStore[k] ?? null),
    setItem:    vi.fn((k,v) => { sStore[k] = v; }),
    removeItem: vi.fn(k     => { delete sStore[k]; }),
  },
  writable: true,
});

// crypto.randomUUID mock
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: vi.fn(() => 'test-uuid-1234') },
  writable: true,
});

import { useAnalytics } from '../../hooks/useAnalytics.js';

const FAKE_USER = { id: 'user-77' };

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ currentUser: FAKE_USER });
  mockIsDemoMode.mockReturnValue(false);
  Object.keys(sStore).forEach(k => delete sStore[k]);
});

// ── Sans consentement ─────────────────────────────────────────────────────────

describe('useAnalytics — sans consentement', () => {
  it('ne track pas si consent=null', () => {
    const { result } = renderHook(() => useAnalytics(null));
    act(() => result.current.track('page_view', { tab: 'home' }));
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('ne track pas si consent=false', () => {
    const { result } = renderHook(() => useAnalytics(false));
    act(() => result.current.track('event_created'));
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ── En mode démo ──────────────────────────────────────────────────────────────

describe('useAnalytics — mode démo', () => {
  it('ne track jamais en mode démo même avec consentement', () => {
    mockIsDemoMode.mockReturnValue(true);
    const { result } = renderHook(() => useAnalytics(true));
    act(() => result.current.track('poster_opened'));
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ── Sans utilisateur ──────────────────────────────────────────────────────────

describe('useAnalytics — sans utilisateur connecté', () => {
  it('ne track pas si currentUser est null', () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    const { result } = renderHook(() => useAnalytics(true));
    act(() => result.current.track('page_view'));
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ── Avec consentement ─────────────────────────────────────────────────────────

describe('useAnalytics — avec consentement', () => {
  it('insère l\'événement dans analytics_events avec les bonnes données', () => {
    const { result } = renderHook(() => useAnalytics(true));
    act(() => result.current.track('event_created', { sport: 'Football' }));

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id:    FAKE_USER.id,
      event_type: 'event_created',
      properties: { sport: 'Football' },
    }));
  });

  it('inclut un session_id non vide', () => {
    const { result } = renderHook(() => useAnalytics(true));
    act(() => result.current.track('page_view'));
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      session_id: expect.any(String),
    }));
    const call = mockInsert.mock.calls[0][0];
    expect(call.session_id.length).toBeGreaterThan(0);
  });

  it('réutilise le même session_id pour plusieurs appels', () => {
    const { result } = renderHook(() => useAnalytics(true));
    act(() => {
      result.current.track('page_view', { tab: 'home' });
      result.current.track('event_created');
    });
    const [call1, call2] = mockInsert.mock.calls;
    expect(call1[0].session_id).toBe(call2[0].session_id);
  });

  it('track est une fonction stable (useCallback)', () => {
    const { result, rerender } = renderHook(() => useAnalytics(true));
    const first = result.current.track;
    rerender();
    expect(result.current.track).toBe(first);
  });
});
