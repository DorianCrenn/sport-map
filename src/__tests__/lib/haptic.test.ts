import { describe, it, expect, vi, beforeEach } from 'vitest';
import { haptic, hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../lib/haptic.js';

describe('haptic', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  it('appelle navigator.vibrate avec le pattern donné', () => {
    haptic(10);
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });

  it('utilise 8ms par défaut', () => {
    haptic();
    expect(navigator.vibrate).toHaveBeenCalledWith(8);
  });

  it('accepte un tableau de patterns', () => {
    haptic([50, 100, 50]);
    expect(navigator.vibrate).toHaveBeenCalledWith([50, 100, 50]);
  });

  it('ne crashe pas si navigator.vibrate est absent', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, writable: true, configurable: true });
    expect(() => haptic(10)).not.toThrow();
  });
});

describe('hapticLight / hapticMedium / hapticSuccess / hapticError', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  it('hapticLight appelle haptic(6)', () => {
    hapticLight();
    expect(navigator.vibrate).toHaveBeenCalledWith(6);
  });

  it('hapticMedium appelle haptic(18)', () => {
    hapticMedium();
    expect(navigator.vibrate).toHaveBeenCalledWith(18);
  });

  it('hapticSuccess appelle un tableau de 3 valeurs', () => {
    hapticSuccess();
    const arg = (navigator.vibrate as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect((arg as number[]).length).toBe(3);
  });

  it('hapticError appelle un tableau de 5 valeurs', () => {
    hapticError();
    const arg = (navigator.vibrate as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect((arg as number[]).length).toBe(5);
  });
});
