import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormDraft } from '../../hooks/useFormDraft.js';

const KEY = 'sl-test-draft';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('useFormDraft', () => {
  it('hasDraft est false si localStorage est vide', () => {
    const { result } = renderHook(() => useFormDraft(KEY));
    expect(result.current.hasDraft).toBe(false);
  });

  it('hasDraft est true si un draft valide existe déjà', () => {
    localStorage.setItem(KEY, JSON.stringify({ data: { foo: 'bar' }, ts: Date.now() }));
    const { result } = renderHook(() => useFormDraft(KEY));
    expect(result.current.hasDraft).toBe(true);
  });

  it('saveDraft enregistre après le debounce', async () => {
    const { result } = renderHook(() => useFormDraft(KEY, { debounceMs: 500 }));
    act(() => { result.current.saveDraft({ text: 'hello' }); });
    expect(localStorage.getItem(KEY)).toBeNull();

    act(() => { vi.advanceTimersByTime(500); });
    const saved = JSON.parse(localStorage.getItem(KEY));
    expect(saved.data).toEqual({ text: 'hello' });
    expect(saved.ts).toBeGreaterThan(0);
  });

  it('loadDraft retourne les données si non expirées', () => {
    localStorage.setItem(KEY, JSON.stringify({ data: { x: 42 }, ts: Date.now() }));
    const { result } = renderHook(() => useFormDraft(KEY));
    expect(result.current.loadDraft()).toEqual({ x: 42 });
  });

  it('loadDraft retourne null si le draft est expiré (TTL)', () => {
    const expired = Date.now() - 25 * 60 * 60 * 1000; // 25h
    localStorage.setItem(KEY, JSON.stringify({ data: { x: 1 }, ts: expired }));
    const { result } = renderHook(() => useFormDraft(KEY));
    expect(result.current.loadDraft()).toBeNull();
  });

  it('loadDraft retourne null si localStorage est vide', () => {
    const { result } = renderHook(() => useFormDraft(KEY));
    expect(result.current.loadDraft()).toBeNull();
  });

  it('clearDraft supprime le localStorage et passe hasDraft à false', async () => {
    localStorage.setItem(KEY, JSON.stringify({ data: { foo: 'bar' }, ts: Date.now() }));
    const { result } = renderHook(() => useFormDraft(KEY));

    act(() => { result.current.clearDraft(); });

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(result.current.hasDraft).toBe(false);
  });
});
