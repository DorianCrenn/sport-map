/**
 * Tests usePosterAssets — fonds IA, overlays, player layers
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../components/poster/posterConstants.js', () => ({
  loadSavedBgs: vi.fn(() => []),
  persistSavedBgs: vi.fn(),
  loadSavedEls: vi.fn(() => []),
  persistSavedEls: vi.fn(),
  COLOR_PRESETS: [],
  SPORT_PALETTE: {},
  TINT_PALETTE: [],
  LAYER_BLOCKS: [],
  PANEL_TABS: [],
}));

vi.mock('../../components/poster/posterElements.jsx', () => ({
  ELEMENT_LIBRARY: [
    { id: 'star', defaultColor: '#f59e0b' },
    { id: 'circle', defaultColor: '#3b82f6' },
  ],
}));

import { usePosterAssets } from '../../hooks/usePosterAssets.js';
import { persistSavedBgs, persistSavedEls } from '../../components/poster/posterConstants.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAssets(overrides = {}) {
  const dispatch = vi.fn();
  const defaults = {
    clubId: 'club-1',
    accentColor: '#8b5cf6',
    dispatch,
    overlayElements: [],
    aiOverlayElements: [],
    playerLayers: [],
    ...overrides,
  };
  const { result } = renderHook(() => usePosterAssets(defaults));
  return { result, dispatch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── savedAiBgs ────────────────────────────────────────────────────────────────

describe('usePosterAssets — savedAiBgs', () => {
  it('initialise savedAiBgs à un tableau vide', () => {
    const { result } = renderAssets();
    expect(result.current.savedAiBgs).toEqual([]);
  });

  it('addSavedBg ajoute un fond et appelle persistSavedBgs', () => {
    const { result } = renderAssets();
    act(() => {
      result.current.addSavedBg({ imageUrl: 'https://example.com/bg.jpg', style: 'bold' });
    });
    expect(result.current.savedAiBgs).toHaveLength(1);
    expect(result.current.savedAiBgs[0].imageUrl).toBe('https://example.com/bg.jpg');
    expect(result.current.savedAiBgs[0]).toHaveProperty('id');
    expect(result.current.savedAiBgs[0]).toHaveProperty('savedAt');
    expect(persistSavedBgs).toHaveBeenCalledTimes(1);
  });

  it('addSavedBg insère en tête (plus récent en premier)', () => {
    const { result } = renderAssets();
    act(() => {
      result.current.addSavedBg({ imageUrl: 'url-1' });
    });
    act(() => {
      result.current.addSavedBg({ imageUrl: 'url-2' });
    });
    expect(result.current.savedAiBgs[0].imageUrl).toBe('url-2');
    expect(result.current.savedAiBgs[1].imageUrl).toBe('url-1');
  });

  it('addSavedBg est limité à 12 entrées', () => {
    const { result } = renderAssets();
    // Act séparé pour chaque appel — chaque setSavedAiBgs voit l'état précédent
    for (let i = 0; i < 15; i++) {
      act(() => result.current.addSavedBg({ imageUrl: `url-${i}` }));
    }
    expect(result.current.savedAiBgs).toHaveLength(12);
  });

  it('removeSavedBg supprime le fond correspondant', () => {
    const { result } = renderAssets();
    act(() => result.current.addSavedBg({ imageUrl: 'url-1' }));
    const bgId = result.current.savedAiBgs[0].id;
    act(() => result.current.removeSavedBg(bgId));
    expect(result.current.savedAiBgs).toHaveLength(0);
    expect(persistSavedBgs).toHaveBeenCalledTimes(2);
  });

  it('removeSavedBg ne supprime pas les autres fonds', () => {
    const { result } = renderAssets();
    act(() => result.current.addSavedBg({ imageUrl: 'url-1' }));
    act(() => result.current.addSavedBg({ imageUrl: 'url-2' }));
    const bgId = result.current.savedAiBgs[1].id;
    act(() => result.current.removeSavedBg(bgId));
    expect(result.current.savedAiBgs).toHaveLength(1);
    expect(result.current.savedAiBgs[0].imageUrl).toBe('url-2');
  });
});

// ── savedAiEls ────────────────────────────────────────────────────────────────

describe('usePosterAssets — savedAiEls', () => {
  it('addSavedEl ajoute un élément et appelle persistSavedEls', () => {
    const { result } = renderAssets();
    act(() => {
      result.current.addSavedEl({ imageUrl: 'https://example.com/el.jpg', prompt: 'test' });
    });
    expect(result.current.savedAiEls).toHaveLength(1);
    expect(persistSavedEls).toHaveBeenCalledTimes(1);
  });

  it('removeSavedEl supprime l\'élément par id', () => {
    const { result } = renderAssets();
    act(() => result.current.addSavedEl({ imageUrl: 'url-el-1' }));
    const elId = result.current.savedAiEls[0].id;
    act(() => result.current.removeSavedEl(elId));
    expect(result.current.savedAiEls).toHaveLength(0);
  });
});

// ── AI overlay elements ───────────────────────────────────────────────────────

describe('usePosterAssets — overlays IA', () => {
  it('addAiOverlay dispatche PATCH avec le nouvel élément', () => {
    const { result, dispatch } = renderAssets({ aiOverlayElements: [] });
    act(() => {
      result.current.addAiOverlay({ imageUrl: 'https://example.com/overlay.png' });
    });
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'PATCH',
      payload: expect.objectContaining({
        aiOverlayElements: expect.arrayContaining([
          expect.objectContaining({
            imageUrl: 'https://example.com/overlay.png',
            above: false,
            opacity: 0.85,
            blendMode: 'screen',
          }),
        ]),
      }),
    }));
  });

  it('addAiOverlay génère un uid unique', () => {
    const { result, dispatch } = renderAssets({ aiOverlayElements: [] });
    act(() => result.current.addAiOverlay({ imageUrl: 'url' }));
    const payload = dispatch.mock.calls[0][0].payload.aiOverlayElements[0];
    expect(payload.uid).toMatch(/^ai-\d+/);
  });

  it('removeAiOverlay dispatche PATCH en filtrant le uid', () => {
    const existing = [{ uid: 'ai-123', imageUrl: 'url' }];
    const { result, dispatch } = renderAssets({ aiOverlayElements: existing });
    act(() => result.current.removeAiOverlay('ai-123'));
    const payload = dispatch.mock.calls[0][0].payload.aiOverlayElements;
    expect(payload).toHaveLength(0);
  });

  it('updateAiOverlay dispatche PATCH en modifiant uniquement le bon uid', () => {
    const existing = [
      { uid: 'ai-1', opacity: 0.5 },
      { uid: 'ai-2', opacity: 0.8 },
    ];
    const { result, dispatch } = renderAssets({ aiOverlayElements: existing });
    act(() => result.current.updateAiOverlay('ai-1', { opacity: 0.3 }));
    const updated = dispatch.mock.calls[0][0].payload.aiOverlayElements;
    expect(updated.find(e => e.uid === 'ai-1').opacity).toBe(0.3);
    expect(updated.find(e => e.uid === 'ai-2').opacity).toBe(0.8);
  });
});

// ── Overlay SVG décoratifs ────────────────────────────────────────────────────

describe('usePosterAssets — overlayElements SVG', () => {
  it('addOverlayElement dispatche overlayElements avec le nouvel élément', () => {
    const { result, dispatch } = renderAssets({ overlayElements: [] });
    act(() => result.current.addOverlayElement('star'));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'overlayElements',
      value: expect.arrayContaining([
        expect.objectContaining({ type: 'star', opacity: 0.70, above: false }),
      ]),
    }));
  });

  it('addOverlayElement utilise la couleur de la meta ELEMENT_LIBRARY si disponible', () => {
    const { result, dispatch } = renderAssets({ overlayElements: [], accentColor: '#111' });
    act(() => result.current.addOverlayElement('star'));
    const added = dispatch.mock.calls[0][0].value[0];
    expect(added.color).toBe('#f59e0b'); // defaultColor de 'star' dans le mock
  });

  it('addOverlayElement utilise accentColor si le type n\'est pas dans ELEMENT_LIBRARY', () => {
    const { result, dispatch } = renderAssets({ overlayElements: [], accentColor: '#abcdef' });
    act(() => result.current.addOverlayElement('unknown-type'));
    const added = dispatch.mock.calls[0][0].value[0];
    expect(added.color).toBe('#abcdef');
  });

  it('removeOverlayElement filtre par uid', () => {
    const existing = [{ uid: 'el-1', type: 'star' }];
    const { result, dispatch } = renderAssets({ overlayElements: existing });
    act(() => result.current.removeOverlayElement('el-1'));
    const value = dispatch.mock.calls[0][0].value;
    expect(value).toHaveLength(0);
  });

  it('updateOverlayElement modifie uniquement le bon uid', () => {
    const existing = [
      { uid: 'el-1', opacity: 0.5 },
      { uid: 'el-2', opacity: 0.9 },
    ];
    const { result, dispatch } = renderAssets({ overlayElements: existing });
    act(() => result.current.updateOverlayElement('el-1', { opacity: 0.2 }));
    const value = dispatch.mock.calls[0][0].value;
    expect(value.find(e => e.uid === 'el-1').opacity).toBe(0.2);
    expect(value.find(e => e.uid === 'el-2').opacity).toBe(0.9);
  });
});

// ── Player layers ─────────────────────────────────────────────────────────────

describe('usePosterAssets — playerLayers', () => {
  const mockAsset = {
    id: 'asset-1',
    processedDataUrl: 'data:image/png;base64,abc',
    thumbDataUrl: 'data:image/png;base64,thumb',
    name: 'Kevin Dupont',
  };

  it('addPlayerLayer dispatche playerLayers avec le nouveau joueur', () => {
    const { result, dispatch } = renderAssets({ playerLayers: [] });
    act(() => result.current.addPlayerLayer(mockAsset));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'playerLayers',
      value: expect.arrayContaining([
        expect.objectContaining({
          assetId: 'asset-1',
          name: 'Kevin Dupont',
          x: 50, yBottom: 0, scale: 1.0, opacity: 1.0,
          shadow: true, glow: false, flip: false, zAbove: true,
        }),
      ]),
    }));
  });

  it('addPlayerLayer génère un uid unique', () => {
    const { result, dispatch } = renderAssets({ playerLayers: [] });
    act(() => result.current.addPlayerLayer(mockAsset));
    const layer = dispatch.mock.calls[0][0].value[0];
    expect(layer.uid).toMatch(/^pl-\d+/);
  });

  it('removePlayerLayer filtre par uid', () => {
    const existing = [{ uid: 'pl-1', name: 'Test' }];
    const { result, dispatch } = renderAssets({ playerLayers: existing });
    act(() => result.current.removePlayerLayer('pl-1'));
    expect(dispatch.mock.calls[0][0].value).toHaveLength(0);
  });

  it('updatePlayerLayer modifie uniquement le bon joueur', () => {
    const existing = [
      { uid: 'pl-1', x: 50, scale: 1.0 },
      { uid: 'pl-2', x: 70, scale: 0.8 },
    ];
    const { result, dispatch } = renderAssets({ playerLayers: existing });
    act(() => result.current.updatePlayerLayer('pl-1', { x: 30 }));
    const value = dispatch.mock.calls[0][0].value;
    expect(value.find(p => p.uid === 'pl-1').x).toBe(30);
    expect(value.find(p => p.uid === 'pl-2').x).toBe(70);
  });

  it('addPlayerLayer préserve les layers existants', () => {
    const existing = [{ uid: 'pl-1', name: 'Existing' }];
    const { result, dispatch } = renderAssets({ playerLayers: existing });
    act(() => result.current.addPlayerLayer(mockAsset));
    expect(dispatch.mock.calls[0][0].value).toHaveLength(2);
  });
});
