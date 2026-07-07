import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'tok-test-123' } },
      }),
    },
  },
}));

const FAKE_URL = 'https://fake.supabase.co';
vi.stubEnv('VITE_SUPABASE_URL', FAKE_URL);
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key-test');

import { useConvocationEmail } from '../../hooks/useConvocationEmail.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_OPTS = {
  eventId: 'evt-1',
  clubId: 'club-1',
  clubName: 'FC Brest',
  eventTitle: 'Match amical',
  eventDate: '2026-07-01',
  eventTime: '18:00',
  eventVenue: 'Stade Brest',
  players: [
    { convocationId: 'cv-1', name: 'Jean Dupont', email: 'jean@brest.fr' },
    { convocationId: 'cv-2', name: 'Marie Leblanc', email: 'marie@brest.fr' },
  ],
};

const MOCK_RESPONSE = {
  ok: true,
  results: [
    { email: 'jean@brest.fr', sent: true, token: 'tok-jean' },
    { email: 'marie@brest.fr', sent: true, token: 'tok-marie' },
  ],
};

// ── Tests — payload coachName ─────────────────────────────────────────────────

describe('useConvocationEmail — coachName dans le payload (P0-1)', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(''),
      json: vi.fn().mockResolvedValue(MOCK_RESPONSE),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('inclut coachName dans le corps de la requête quand fourni', async () => {
    const { result } = renderHook(() => useConvocationEmail());

    await act(async () => {
      await result.current.sendEmails({ ...BASE_OPTS, coachName: 'Paul Martin' });
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.coachName).toBe('Paul Martin');
  });

  it('envoie les autres champs corrects avec coachName', async () => {
    const { result } = renderHook(() => useConvocationEmail());

    await act(async () => {
      await result.current.sendEmails({ ...BASE_OPTS, coachName: 'Paul Martin' });
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.eventTitle).toBe('Match amical');
    expect(body.clubName).toBe('FC Brest');
    expect(body.eventVenue).toBe('Stade Brest');
    expect(body.players).toHaveLength(2);
  });

  it('envoi fonctionne sans coachName (optionnel)', async () => {
    const { result } = renderHook(() => useConvocationEmail());

    await act(async () => {
      await result.current.sendEmails({ ...BASE_OPTS });
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.coachName).toBeUndefined();
    expect(body.eventTitle).toBe('Match amical');
  });

  it('appelle la bonne URL Edge Function', async () => {
    const { result } = renderHook(() => useConvocationEmail());

    await act(async () => {
      await result.current.sendEmails(BASE_OPTS);
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe(`${FAKE_URL}/functions/v1/send-convocation-email`);
  });

  it('inclut le Bearer token dans les headers', async () => {
    const { result } = renderHook(() => useConvocationEmail());

    await act(async () => {
      await result.current.sendEmails(BASE_OPTS);
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer tok-test-123');
  });

  it('retourne sentCount correct depuis les résultats', async () => {
    const { result } = renderHook(() => useConvocationEmail());

    let out: any;
    await act(async () => {
      out = await result.current.sendEmails(BASE_OPTS);
    });

    expect(out.ok).toBe(true);
    expect(out.sentCount).toBe(2);
  });

  it('sending passe à true pendant l\'envoi puis false après', async () => {
    let resolveFetch!: (v: any) => void;
    mockFetch.mockReturnValueOnce(new Promise(r => { resolveFetch = r; }));

    const { result } = renderHook(() => useConvocationEmail());

    let sendPromise: Promise<any>;
    act(() => {
      sendPromise = result.current.sendEmails(BASE_OPTS);
    });

    expect(result.current.sending).toBe(true);

    await act(async () => {
      resolveFetch({ ok: true, json: vi.fn().mockResolvedValue(MOCK_RESPONSE) });
      await sendPromise;
    });

    expect(result.current.sending).toBe(false);
  });

  it('retourne { ok: false } si la réponse HTTP n\'est pas ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    });

    const { result } = renderHook(() => useConvocationEmail());

    let out: any;
    await act(async () => {
      out = await result.current.sendEmails(BASE_OPTS);
    });

    expect(out.ok).toBe(false);
    expect(out.sentCount).toBe(0);
  });
});
