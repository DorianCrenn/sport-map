/**
 * Tests useAnalyticsConsent — consentement RGPD analytics
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));
vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: mockUseAuth,
}));

import { useAnalyticsConsent } from '../../hooks/useAnalyticsConsent.js';

// ── localStorage mock ─────────────────────────────────────────────────────────

const store = {};
const lsMock = {
  getItem:    vi.fn(k     => store[k] ?? null),
  setItem:    vi.fn((k,v) => { store[k] = v; }),
  removeItem: vi.fn(k     => { delete store[k]; }),
  clear:      vi.fn(()    => Object.keys(store).forEach(k => delete store[k])),
};
Object.defineProperty(window, 'localStorage', { value: lsMock, writable: true });

const FAKE_USER = { id: 'user-99' };

function makeProfileQuery(consent) {
  return {
    from:    vi.fn().mockReturnThis(),
    select:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    single:  vi.fn().mockResolvedValue({ data: { analytics_consent: consent } }),
  };
}

function makeUpdateProfileQuery() {
  return {
    update: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockResolvedValue({ error: null }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  lsMock.clear();
  mockUseAuth.mockReturnValue({ currentUser: FAKE_USER });
});

// ── Sans utilisateur ──────────────────────────────────────────────────────────

describe('useAnalyticsConsent — sans utilisateur', () => {
  it('showBanner=false si pas d\'utilisateur connecté', async () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    const { result } = renderHook(() => useAnalyticsConsent());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.showBanner).toBe(false);
  });
});

// ── Chargement depuis DB ──────────────────────────────────────────────────────

describe('useAnalyticsConsent — chargement', () => {
  it('charge le consentement true depuis Supabase', async () => {
    mockFrom.mockReturnValue(makeProfileQuery(true));
    const { result } = renderHook(() => useAnalyticsConsent());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.consent).toBe(true);
    expect(result.current.showBanner).toBe(false);
  });

  it('charge le consentement false depuis Supabase', async () => {
    mockFrom.mockReturnValue(makeProfileQuery(false));
    const { result } = renderHook(() => useAnalyticsConsent());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.consent).toBe(false);
    expect(result.current.showBanner).toBe(false);
  });

  it('showBanner=true si consent=null après chargement', async () => {
    mockFrom.mockReturnValue(makeProfileQuery(null));
    const { result } = renderHook(() => useAnalyticsConsent());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.consent).toBeNull();
    expect(result.current.showBanner).toBe(true);
  });
});

// ── localStorage cache ────────────────────────────────────────────────────────

describe('useAnalyticsConsent — cache localStorage', () => {
  it('retourne true immédiatement si localStorage contient "true"', () => {
    store['sl-analytics-consent'] = 'true';
    lsMock.getItem.mockImplementation(k => store[k] ?? null);
    mockFrom.mockReturnValue(makeProfileQuery(true));

    const { result } = renderHook(() => useAnalyticsConsent());
    expect(result.current.consent).toBe(true);
  });

  it('retourne false immédiatement si localStorage contient "false"', () => {
    store['sl-analytics-consent'] = 'false';
    lsMock.getItem.mockImplementation(k => store[k] ?? null);
    mockFrom.mockReturnValue(makeProfileQuery(false));

    const { result } = renderHook(() => useAnalyticsConsent());
    expect(result.current.consent).toBe(false);
  });
});

// ── accept ────────────────────────────────────────────────────────────────────

describe('useAnalyticsConsent — accept', () => {
  it('accept() met consent à true immédiatement (optimiste)', async () => {
    // DB retourne consent=null (pas encore décidé)
    mockFrom
      .mockReturnValueOnce(makeProfileQuery(null))   // chargement initial
      .mockReturnValueOnce(makeUpdateProfileQuery()); // update DB

    const { result } = renderHook(() => useAnalyticsConsent());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => { await result.current.accept(); });

    expect(result.current.consent).toBe(true);
    expect(lsMock.setItem).toHaveBeenCalledWith('sl-analytics-consent', 'true');
  });
});

// ── refuse ────────────────────────────────────────────────────────────────────

describe('useAnalyticsConsent — refuse', () => {
  it('refuse() met consent à false immédiatement (optimiste)', async () => {
    mockFrom
      .mockReturnValueOnce(makeProfileQuery(null))
      .mockReturnValueOnce(makeUpdateProfileQuery());

    const { result } = renderHook(() => useAnalyticsConsent());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => { await result.current.refuse(); });

    expect(result.current.consent).toBe(false);
    expect(lsMock.setItem).toHaveBeenCalledWith('sl-analytics-consent', 'false');
  });
});
