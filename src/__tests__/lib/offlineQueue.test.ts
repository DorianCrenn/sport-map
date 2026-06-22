import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock IndexedDB ─────────────────────────────────────────────────────────────
// fake-indexeddb remplace l'API IDB native dans jsdom
import 'fake-indexeddb/auto';

import {
  enqueue,
  getAllOps,
  queueSize,
  clearQueue,
  processQueue,
} from '../../lib/offlineQueue.js';

// ── Env ────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://test.supabase.co';
const ANON_KEY     = 'anon-key';
const TOKEN        = 'access-token';

// ── fetch mock ─────────────────────────────────────────────────────────────────
const originalFetch = (globalThis as any).fetch;

function mockFetchOk() {
  (globalThis as any).fetch = vi.fn().mockResolvedValue({
    ok:     true,
    status: 204,
    text:   () => Promise.resolve(''),
  });
}

function mockFetchFail(status = 500) {
  (globalThis as any).fetch = vi.fn().mockResolvedValue({
    ok:     false,
    status,
    text:   () => Promise.resolve('Internal Server Error'),
  });
}

afterEach(async () => {
  (globalThis as any).fetch = originalFetch;
  await clearQueue();
  vi.clearAllMocks();
});

describe('offlineQueue — enqueue & read', () => {
  it('enqueue ajoute une op et queueSize retourne 1', async () => {
    await enqueue({ table: 'events', method: 'INSERT', payload: { title: 'Test' } });
    expect(await queueSize()).toBe(1);
  });

  it('getAllOps retourne les ops dans l\'ordre d\'insertion', async () => {
    await enqueue({ table: 'events',  method: 'INSERT', payload: { id: 1 } });
    await enqueue({ table: 'clubs',   method: 'UPDATE', payload: { name: 'X' }, filter: { id: 'abc' } });
    const ops = await getAllOps();
    expect(ops).toHaveLength(2);
    expect(ops[0].table).toBe('events');
    expect(ops[1].table).toBe('clubs');
    expect(ops[1].filter).toEqual({ id: 'abc' });
  });

  it('clearQueue vide complètement la file', async () => {
    await enqueue({ table: 'events', method: 'DELETE', payload: {}, filter: { id: '1' } });
    await clearQueue();
    expect(await queueSize()).toBe(0);
  });

  it('op contient createdAt et retries=0', async () => {
    await enqueue({ table: 'profiles', method: 'UPSERT', payload: { name: 'Alice' } });
    const ops = await getAllOps();
    expect(ops[0].createdAt).toBeLessThanOrEqual(Date.now());
    expect(ops[0].retries).toBe(0);
  });
});

describe('offlineQueue — processQueue', () => {
  it('rejoue les ops et les supprime si succès', async () => {
    mockFetchOk();
    await enqueue({ table: 'events', method: 'INSERT', payload: { title: 'A' } });
    await enqueue({ table: 'events', method: 'INSERT', payload: { title: 'B' } });

    const result = await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);

    expect(result.processed).toBe(2);
    expect(result.failed).toBe(0);
    expect(await queueSize()).toBe(0);
  });

  it('appelle fetch avec la bonne méthode HTTP (INSERT → POST)', async () => {
    mockFetchOk();
    await enqueue({ table: 'events', method: 'INSERT', payload: { title: 'T' } });
    await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/events'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('appelle fetch avec PATCH pour UPDATE et inclut le filtre dans l\'URL', async () => {
    mockFetchOk();
    await enqueue({ table: 'clubs', method: 'UPDATE', payload: { name: 'FC' }, filter: { id: 'club-1' } });
    await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);

    const call = (globalThis as any).fetch.mock.calls[0];
    expect(call[0]).toContain('id=eq.club-1');
    expect(call[1].method).toBe('PATCH');
  });

  it('appelle fetch avec DELETE et pas de body', async () => {
    mockFetchOk();
    await enqueue({ table: 'events', method: 'DELETE', payload: {}, filter: { id: 'ev-1' } });
    await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);

    const call = (globalThis as any).fetch.mock.calls[0];
    expect(call[1].method).toBe('DELETE');
    expect(call[1].body).toBeUndefined();
  });

  it('incrémente retries sur échec (sans supprimer avant MAX_RETRIES)', async () => {
    mockFetchFail(500);
    await enqueue({ table: 'events', method: 'INSERT', payload: { title: 'X' } });

    const result = await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);
    expect(result.failed).toBe(1);
    // Pas encore supprimé (retries=0 → 1)
    expect(await queueSize()).toBe(1);
    const ops = await getAllOps();
    expect(ops[0].retries).toBe(1);
  });

  it('supprime l\'op après MAX_RETRIES=3 échecs', async () => {
    mockFetchFail(500);
    await enqueue({ table: 'events', method: 'INSERT', payload: { title: 'X' } });
    // 3 passages pour atteindre MAX_RETRIES
    await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);
    await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);
    await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);
    // 4e passage → retries=3 → abandon + delete
    await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);
    expect(await queueSize()).toBe(0);
  });

  it('file vide → processQueue retourne 0/0 sans fetch', async () => {
    mockFetchOk();
    const result = await processQueue(SUPABASE_URL, ANON_KEY, TOKEN);
    expect(result.processed).toBe(0);
    expect(result.failed).toBe(0);
    expect((globalThis as any).fetch).not.toHaveBeenCalled();
  });

  it('onProgress est appelé après chaque op', async () => {
    mockFetchOk();
    await enqueue({ table: 'events', method: 'INSERT', payload: { a: 1 } });
    await enqueue({ table: 'events', method: 'INSERT', payload: { b: 2 } });

    const progress: Array<{ processed: number; failed: number }> = [];
    await processQueue(SUPABASE_URL, ANON_KEY, TOKEN, p => progress.push({ ...p }));

    expect(progress).toHaveLength(2);
    expect(progress[1].processed).toBe(2);
  });
});
