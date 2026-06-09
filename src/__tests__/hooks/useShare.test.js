import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShare } from '../../hooks/useShare.js';

describe('useShare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Réinitialiser les mocks navigator entre chaque test
    delete navigator.share;
    delete navigator.clipboard;
  });

  it('appelle navigator.share si disponible et retourne method="native"', async () => {
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true, configurable: true,
    });

    const { result } = renderHook(() => useShare());
    let out;
    await act(async () => {
      out = await result.current.share({ title: 'Test', text: 'Texte', url: 'https://example.com' });
    });

    expect(navigator.share).toHaveBeenCalledOnce();
    expect(out.success).toBe(true);
    expect(out.method).toBe('native');
  });

  it('retourne success=false si navigator.share lance AbortError', async () => {
    const abortErr = new Error('abort');
    abortErr.name = 'AbortError';
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(abortErr),
      writable: true, configurable: true,
    });

    const { result } = renderHook(() => useShare());
    let out;
    await act(async () => {
      out = await result.current.share({ title: 'T', url: 'https://example.com' });
    });
    expect(out.success).toBe(false);
    expect(out.method).toBe('native');
  });

  it('écrit dans clipboard si navigator.share est absent', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true, configurable: true,
    });

    const { result } = renderHook(() => useShare());
    let out;
    await act(async () => {
      out = await result.current.share({ text: 'Texte', url: 'https://example.com' });
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
    expect(out.success).toBe(true);
    expect(out.method).toBe('clipboard');
  });

  it('retourne success=false si clipboard échoue', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      writable: true, configurable: true,
    });

    const { result } = renderHook(() => useShare());
    let out;
    await act(async () => {
      out = await result.current.share({ url: 'https://example.com' });
    });
    expect(out.success).toBe(false);
    expect(out.method).toBe('none');
  });
});
