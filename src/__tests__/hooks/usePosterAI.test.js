/**
 * Tests usePosterAI — génération IA background et éléments décoratifs
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../lib/supabase.js', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock('../../lib/posterVariants.js', () => ({
  generateAIBackground:   vi.fn(async () => ({ imageUrl: 'https://ai.example.com/bg.jpg',     prompt: 'test prompt', apiMode: true })),
  generateCustomBackground: vi.fn(async () => ({ imageUrl: 'https://ai.example.com/custom.jpg', prompt: 'custom prompt', apiMode: true })),
  generateCustomElement:  vi.fn(async () => ({ imageUrl: 'https://ai.example.com/el.jpg',     prompt: 'element prompt' })),
}));

import { usePosterAI } from '../../hooks/usePosterAI.js';
import { generateAIBackground, generateCustomBackground, generateCustomElement } from '../../lib/posterVariants.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAI(opts = {}) {
  const defaults = { aiGenerateBlocked: false, onTrack: vi.fn(), clubId: 'club-1' };
  const { result } = renderHook(() => usePosterAI({ ...defaults, ...opts }));
  return result;
}

beforeEach(() => vi.clearAllMocks());

// ── États initiaux ─────────────────────────────────────────────────────────────

describe('usePosterAI — états initiaux', () => {
  it('aiBgLoading est false', () => {
    const r = renderAI();
    expect(r.current.aiBgLoading).toBe(false);
  });

  it('aiBgResult est null', () => {
    const r = renderAI();
    expect(r.current.aiBgResult).toBeNull();
  });

  it('aiElLoading est false', () => {
    const r = renderAI();
    expect(r.current.aiElLoading).toBe(false);
  });

  it('customPrompt est une chaîne vide', () => {
    const r = renderAI();
    expect(r.current.customPrompt).toBe('');
  });

  it('elementPrompt est une chaîne vide', () => {
    const r = renderAI();
    expect(r.current.elementPrompt).toBe('');
  });
});

// ── generateBg ────────────────────────────────────────────────────────────────

describe('usePosterAI — generateBg (fond IA)', () => {
  it('appelle generateAIBackground avec dnaForBg, eventSport, clubId', async () => {
    const r = renderAI();
    const onSuccess = vi.fn();
    const dnaForBg = { style: 'bold', mood: ['intense'] };

    await act(async () => {
      await r.current.generateBg({ dnaForBg, eventSport: 'Football', onSuccess });
    });

    expect(generateAIBackground).toHaveBeenCalledWith(dnaForBg, 'Football', expect.anything(), 'club-1');
  });

  it("appelle onSuccess avec l'URL générée", async () => {
    const r = renderAI();
    const onSuccess = vi.fn();
    await act(async () => {
      await r.current.generateBg({ dnaForBg: {}, eventSport: 'Football', onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledWith('https://ai.example.com/bg.jpg');
  });

  it('appelle onTrack après une génération réussie', async () => {
    const onTrack = vi.fn();
    const r = renderAI({ onTrack });
    await act(async () => {
      await r.current.generateBg({ dnaForBg: {}, eventSport: 'Football', onSuccess: vi.fn() });
    });
    expect(onTrack).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onTrack si imageUrl est null", async () => {
    generateAIBackground.mockResolvedValueOnce({ imageUrl: null, prompt: '' });
    const onTrack = vi.fn();
    const r = renderAI({ onTrack });
    await act(async () => {
      await r.current.generateBg({ dnaForBg: {}, eventSport: 'Football', onSuccess: vi.fn() });
    });
    expect(onTrack).not.toHaveBeenCalled();
  });

  it('utilise generateCustomBackground si customPrompt est défini', async () => {
    const r = renderAI();
    await act(async () => { r.current.setCustomPrompt('stade breton au coucher du soleil'); });
    const onSuccess = vi.fn();
    await act(async () => {
      await r.current.generateBg({ dnaForBg: {}, eventSport: 'Football', onSuccess });
    });
    expect(generateCustomBackground).toHaveBeenCalledWith('stade breton au coucher du soleil');
    expect(generateAIBackground).not.toHaveBeenCalled();
  });

  it('ne génère pas si aiGenerateBlocked=true', async () => {
    const r = renderAI({ aiGenerateBlocked: true });
    await act(async () => {
      await r.current.generateBg({ dnaForBg: {}, eventSport: 'Football', onSuccess: vi.fn() });
    });
    expect(generateAIBackground).not.toHaveBeenCalled();
    expect(generateCustomBackground).not.toHaveBeenCalled();
  });

  it('ne génère pas si déjà en cours (aiBgLoading)', async () => {
    // Mock lent : le premier appel bloque jusqu'à la résolution manuelle
    let resolveFirst;
    generateAIBackground.mockImplementationOnce(
      () => new Promise(res => { resolveFirst = () => res({ imageUrl: 'https://ai.example.com/bg.jpg', prompt: '', apiMode: true }); })
    );

    const r = renderAI();

    // Lance le premier appel en arrière-plan (sans await)
    let firstCallDone = false;
    const bgPromise = r.current.generateBg({ dnaForBg: {}, eventSport: 'Football', onSuccess: vi.fn() })
      .then(() => { firstCallDone = true; });

    // Flush les mises à jour synchrones (setAiBgLoading(true))
    await act(async () => { await Promise.resolve(); });

    // Deuxième appel : doit être bloqué par aiBgLoading=true
    await act(async () => {
      await r.current.generateBg({ dnaForBg: {}, eventSport: 'Football', onSuccess: vi.fn() });
    });

    // Résoudre le premier appel
    resolveFirst();
    await act(async () => { await bgPromise; });

    expect(generateAIBackground).toHaveBeenCalledTimes(1);
    expect(firstCallDone).toBe(true);
  });

  it('stocke le résultat dans aiBgResult', async () => {
    const r = renderAI();
    await act(async () => {
      await r.current.generateBg({ dnaForBg: {}, eventSport: 'Football', onSuccess: vi.fn() });
    });
    expect(r.current.aiBgResult).toMatchObject({ imageUrl: 'https://ai.example.com/bg.jpg' });
  });
});

// ── generateElement ───────────────────────────────────────────────────────────

describe('usePosterAI — generateElement (élément IA)', () => {
  it("n'appelle pas generateCustomElement si elementPrompt est vide", async () => {
    const r = renderAI();
    await act(async () => {
      await r.current.generateElement({ accentColor: '#ff0000', onSuccess: vi.fn() });
    });
    expect(generateCustomElement).not.toHaveBeenCalled();
  });

  it('appelle generateCustomElement avec le prompt et la couleur si défini', async () => {
    const r = renderAI();
    await act(async () => { r.current.setElementPrompt('flammes violettes'); });
    const onSuccess = vi.fn();
    await act(async () => {
      await r.current.generateElement({ accentColor: '#8b5cf6', onSuccess });
    });
    // generateCustomElement(prompt, accentColor) — les 2 arguments
    expect(generateCustomElement).toHaveBeenCalledWith('flammes violettes', '#8b5cf6');
  });

  it('appelle onSuccess avec le résultat si imageUrl présent', async () => {
    const r = renderAI();
    await act(async () => { r.current.setElementPrompt('étoiles dorées'); });
    const onSuccess = vi.fn();
    await act(async () => {
      await r.current.generateElement({ accentColor: '#f59e0b', onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: 'https://ai.example.com/el.jpg' }));
  });

  it('appelle onTrack après génération réussie', async () => {
    const onTrack = vi.fn();
    const r = renderAI({ onTrack });
    await act(async () => { r.current.setElementPrompt('confettis'); });
    await act(async () => {
      await r.current.generateElement({ accentColor: '#22d96a', onSuccess: vi.fn() });
    });
    expect(onTrack).toHaveBeenCalledTimes(1);
  });

  it('ne génère pas si aiGenerateBlocked=true', async () => {
    const r = renderAI({ aiGenerateBlocked: true });
    await act(async () => { r.current.setElementPrompt('flammes'); });
    await act(async () => {
      await r.current.generateElement({ accentColor: '#fff', onSuccess: vi.fn() });
    });
    expect(generateCustomElement).not.toHaveBeenCalled();
  });
});

// ── setCustomPrompt / setElementPrompt ────────────────────────────────────────

describe('usePosterAI — prompts', () => {
  it('setCustomPrompt met à jour la valeur', async () => {
    const r = renderAI();
    await act(async () => { r.current.setCustomPrompt('test prompt'); });
    expect(r.current.customPrompt).toBe('test prompt');
  });

  it('setElementPrompt met à jour la valeur', async () => {
    const r = renderAI();
    await act(async () => { r.current.setElementPrompt('element test'); });
    expect(r.current.elementPrompt).toBe('element test');
  });
});
