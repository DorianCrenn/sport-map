import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Isoler window.dispatchEvent
let capturedEvents = [];
const originalDispatch = window.dispatchEvent.bind(window);

beforeEach(() => {
  capturedEvents = [];
  vi.spyOn(window, 'dispatchEvent').mockImplementation((e) => {
    capturedEvents.push(e);
    return originalDispatch(e);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

import { dispatchError, useErrorBus } from '../../lib/errorBus.js';

describe('dispatchError', () => {
  it('dispatche un CustomEvent sl-hook-error avec un message string', () => {
    dispatchError('Erreur test');
    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0].type).toBe('sl-hook-error');
    expect(capturedEvents[0].detail.message).toBe('Erreur test');
  });

  it('traduit un objet Error Supabase via translateSupabaseError', () => {
    dispatchError({ message: 'Invalid login credentials' });
    expect(capturedEvents[0].detail.message).toBe('Email ou mot de passe incorrect');
  });

  it('dispatche le message original si pas de traduction connue', () => {
    dispatchError({ message: 'Erreur inconnue XYZ' });
    expect(capturedEvents[0].detail.message).toBe('Erreur inconnue XYZ');
  });
});

describe('useErrorBus', () => {
  it('appelle onError quand un événement sl-hook-error est dispatché', async () => {
    const onError = vi.fn();
    renderHook(() => useErrorBus(onError));

    window.dispatchEvent(new CustomEvent('sl-hook-error', { detail: { message: 'test msg' } }));

    expect(onError).toHaveBeenCalledWith('test msg');
  });

  it('utilise le fallback si detail.message est absent', () => {
    const onError = vi.fn();
    renderHook(() => useErrorBus(onError));

    window.dispatchEvent(new CustomEvent('sl-hook-error', { detail: {} }));

    expect(onError).toHaveBeenCalledWith('Une erreur est survenue');
  });

  it('nettoie le listener au démontage', () => {
    const onError = vi.fn();
    const { unmount } = renderHook(() => useErrorBus(onError));
    unmount();

    window.dispatchEvent(new CustomEvent('sl-hook-error', { detail: { message: 'après unmount' } }));

    expect(onError).not.toHaveBeenCalled();
  });
});
