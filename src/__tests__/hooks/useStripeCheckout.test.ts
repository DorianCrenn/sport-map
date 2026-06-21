import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStripeCheckout } from '../../hooks/useStripeCheckout.js';

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok-abc' } } }) },
  },
}));

const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

// Mock import.meta.env
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Capture window.location.href assignments
let assignedHref = '';
Object.defineProperty(globalThis, 'location', {
  value: { href: '' },
  writable: true,
  configurable: true,
});
Object.defineProperty((globalThis as any).location, 'href', {
  set(v: string) { assignedHref = v; },
  get() { return assignedHref; },
  configurable: true,
});

describe('useStripeCheckout', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    assignedHref = '';
  });

  it('initialise avec loading=false et error=null', () => {
    const { result } = renderHook(() => useStripeCheckout());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('redirige vers Stripe si la fonction retourne une URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/pay/test123' }),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('premium', 'monthly', 'club-456');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('create-checkout-session'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(assignedHref).toBe('https://checkout.stripe.com/pay/test123');
    expect(result.current.error).toBeNull();
  });

  it('affiche une erreur si la fonction échoue', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Stripe not configured' }),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('premium', 'monthly', 'club-456');
    });

    expect(result.current.error).toBe('Stripe not configured');
    expect(assignedHref).toBe('');
  });

  it('affiche erreur si URL manquante dans la réponse', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('elite', 'yearly', 'club-789');
    });

    expect(result.current.error).toContain('URL');
  });
});
