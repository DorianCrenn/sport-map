import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Supabase mock — doit être inline (hoisted par vi.mock) ─────────────────────
vi.mock('../../lib/supabase.js', () => {
  const SUB = {
    plan:                 'pro',
    status:               'active',
    current_period_start: '2026-06-01T00:00:00Z',
    current_period_end:   '2026-07-01T00:00:00Z',
    trial_end:            null,
    cancel_at_period_end: false,
    stripe_sub_id:        'sub_abc',
    stripe_cus_id:        'cus_abc',
  };
  const chain = {
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: SUB, error: null }),
  };
  return {
    isDemoMode: () => false,
    setDemoMode: () => {},
    supabase: {
      // getSession retourne { data: { session: ... }, error: null } — shape supabase-js
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok_test' } }, error: null }) },
      from: vi.fn(() => chain),
    },
  };
});

import { useSubscriptionManagement } from '../../hooks/useSubscriptionManagement.js';

// ── fetch mock helpers ─────────────────────────────────────────────────────────
const originalFetch = (globalThis as any).fetch;

function mockFetchOk(body: unknown) {
  (globalThis as any).fetch = vi.fn().mockResolvedValue({
    ok:   true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number, error: string) {
  (globalThis as any).fetch = vi.fn().mockResolvedValue({
    ok:     false,
    status,
    json:   () => Promise.resolve({ error }),
  });
}

afterEach(() => {
  (globalThis as any).fetch = originalFetch;
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('useSubscriptionManagement', () => {
  it('loads subscription data on mount', async () => {
    const { result } = renderHook(() => useSubscriptionManagement('club-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sub?.plan).toBe('pro');
    expect(result.current.sub?.status).toBe('active');
    expect(result.current.sub?.cancel_at_period_end).toBe(false);
    expect(result.current.sub?.stripe_sub_id).toBe('sub_abc');
  });

  it('returns null sub and loading=false for null clubId', () => {
    const { result } = renderHook(() => useSubscriptionManagement(null));
    expect(result.current.sub).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('cancel action calls manage-subscription EF with action=cancel', async () => {
    mockFetchOk({ ok: true, message: 'Abonnement annulé en fin de période' });
    const { result } = renderHook(() => useSubscriptionManagement('club-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.cancel(); });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/manage-subscription'),
      expect.objectContaining({
        method: 'POST',
        body:   JSON.stringify({ action: 'cancel', clubId: 'club-123' }),
      }),
    );
    expect(result.current.error).toBeNull();
  });

  it('reactivate action calls EF with action=reactivate', async () => {
    mockFetchOk({ ok: true, message: 'Abonnement réactivé' });
    const { result } = renderHook(() => useSubscriptionManagement('club-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.reactivate(); });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/manage-subscription'),
      expect.objectContaining({ body: JSON.stringify({ action: 'reactivate', clubId: 'club-123' }) }),
    );
  });

  it('openPortal calls EF with action=portal', async () => {
    mockFetchOk({ url: 'https://billing.stripe.com/portal/session123' });
    const { result } = renderHook(() => useSubscriptionManagement('club-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.openPortal(); });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/manage-subscription'),
      expect.objectContaining({ body: JSON.stringify({ action: 'portal', clubId: 'club-123' }) }),
    );
  });

  it('loadInvoices populates invoices list', async () => {
    const fakeInvoices = [
      { id: 'in_1', number: 'INV-001', amount: 29, currency: 'eur', status: 'paid', date: '2026-06-01T00:00:00Z', period_end: null, pdf_url: null, hosted_url: null },
    ];
    mockFetchOk({ invoices: fakeInvoices });
    const { result } = renderHook(() => useSubscriptionManagement('club-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.loadInvoices(); });

    await waitFor(() => expect(result.current.invoices).toHaveLength(1));
    expect(result.current.invoices[0].id).toBe('in_1');
    expect(result.current.invoices[0].amount).toBe(29);
  });

  it('sets error state on 403 from cancel', async () => {
    mockFetchError(403, 'Accès non autorisé pour ce club');
    const { result } = renderHook(() => useSubscriptionManagement('club-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.cancel(); });

    expect(result.current.error).toBe('Accès non autorisé pour ce club');
  });

  it('sets error on 503 not configured', async () => {
    mockFetchError(503, 'Stripe not configured');
    const { result } = renderHook(() => useSubscriptionManagement('club-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.openPortal(); });

    expect(result.current.error).toBe('Stripe not configured');
  });

  it('refetch causes another from() call', async () => {
    const { result } = renderHook(() => useSubscriptionManagement('club-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { supabase } = await import('../../lib/supabase.js');
    const callsBefore = (supabase.from as ReturnType<typeof vi.fn>).mock.calls.length;

    act(() => { result.current.refetch(); });

    await waitFor(() => {
      expect((supabase.from as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
