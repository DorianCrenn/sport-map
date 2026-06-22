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

vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

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

  it('envoie le plan starter correctement', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/pay/test-starter' }),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('starter', 'monthly', 'club-456');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('create-checkout-session'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ plan: 'starter', interval: 'monthly', clubId: 'club-456' }),
      }),
    );
    expect(assignedHref).toBe('https://checkout.stripe.com/pay/test-starter');
    expect(result.current.error).toBeNull();
  });

  it('envoie le plan pro correctement', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/pay/test-pro' }),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('pro', 'yearly', 'club-789');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('create-checkout-session'),
      expect.objectContaining({
        body: JSON.stringify({ plan: 'pro', interval: 'yearly', clubId: 'club-789' }),
      }),
    );
    expect(assignedHref).toBe('https://checkout.stripe.com/pay/test-pro');
  });

  it('envoie le plan elite correctement', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/pay/test-elite' }),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('elite', 'yearly', 'club-789');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('create-checkout-session'),
      expect.objectContaining({
        body: JSON.stringify({ plan: 'elite', interval: 'yearly', clubId: 'club-789' }),
      }),
    );
    expect(assignedHref).toBe('https://checkout.stripe.com/pay/test-elite');
  });

  it('affiche une erreur si la fonction échoue (403 non autorisé)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Vous n\'êtes pas autorisé à gérer l\'abonnement de ce club' }),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('starter', 'monthly', 'club-autre');
    });

    expect(result.current.error).toContain('autorisé');
    expect(assignedHref).toBe('');
  });

  it('affiche une erreur si Stripe not configured (503)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Stripe not configured' }),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('pro', 'monthly', 'club-456');
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

  it('interval par défaut est monthly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/pay/x' }),
    });

    const { result } = renderHook(() => useStripeCheckout());
    await act(async () => {
      await result.current.startCheckout('starter', undefined, 'club-1');
    });

    const bodyStr = mockFetch.mock.calls[0]?.[1]?.body as string;
    expect(JSON.parse(bodyStr).interval).toBe('monthly');
  });
});
