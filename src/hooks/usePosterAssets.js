import { useState } from 'react';
import { ELEMENT_LIBRARY } from '../components/poster/posterElements.jsx';
import { loadSavedBgs, persistSavedBgs, loadSavedEls, persistSavedEls } from '../components/poster/posterConstants.js';

/**
 * usePosterAssets — Gestion des assets visuels PosterStudio.
 *
 * Centralise : fonds IA favoris, éléments IA overlay, éléments décoratifs, player layers.
 * Extrait de PosterStudio.jsx.
 *
 * @param {object} options
 * @param {string|null} options.clubId
 * @param {string} options.accentColor — couleur courante (pour la couleur par défaut des éléments SVG)
 * @param {Function} options.dispatch  — dispatch du posterReducer
 * @param {Array} options.overlayElements    — depuis poster state
 * @param {Array} options.aiOverlayElements  — depuis poster state
 * @param {Array} options.playerLayers       — depuis poster state
 */
export function usePosterAssets({ clubId, accentColor, dispatch, overlayElements, aiOverlayElements, playerLayers }) {
  const [savedAiBgs, setSavedAiBgs] = useState(() => loadSavedBgs(clubId));
  const [savedAiEls, setSavedAiEls] = useState(() => loadSavedEls(clubId));

  // ── Fonds IA favoris ─────────────────────────────────────────────────────
  function addSavedBg(bgEntry) {
    const next = [{ ...bgEntry, id: `bg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, savedAt: new Date().toISOString() }, ...savedAiBgs].slice(0, 12);
    setSavedAiBgs(next);
    persistSavedBgs(clubId, next);
  }
  function removeSavedBg(bgId) {
    const next = savedAiBgs.filter(b => b.id !== bgId);
    setSavedAiBgs(next);
    persistSavedBgs(clubId, next);
  }
  function addSavedEl(elEntry) {
    const next = [{ ...elEntry, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, savedAt: new Date().toISOString() }, ...savedAiEls].slice(0, 12);
    setSavedAiEls(next);
    persistSavedEls(clubId, next);
  }
  function removeSavedEl(elId) {
    const next = savedAiEls.filter(e => e.id !== elId);
    setSavedAiEls(next);
    persistSavedEls(clubId, next);
  }

  // ── Éléments overlay IA (Pollinations.ai) ────────────────────────────────
  function addAiOverlay(el) {
    dispatch({ type: 'PATCH', payload: {
      aiOverlayElements: [...(aiOverlayElements || []), { uid: `ai-${Date.now()}`, above: false, opacity: 0.85, blendMode: 'screen', ...el }],
    }});
  }
  function removeAiOverlay(uid) {
    dispatch({ type: 'PATCH', payload: {
      aiOverlayElements: (aiOverlayElements || []).filter(e => e.uid !== uid),
    }});
  }
  function updateAiOverlay(uid, patch) {
    dispatch({ type: 'PATCH', payload: {
      aiOverlayElements: (aiOverlayElements || []).map(e => e.uid === uid ? { ...e, ...patch } : e),
    }});
  }

  // ── Éléments SVG décoratifs ──────────────────────────────────────────────
  function addOverlayElement(type) {
    const meta = ELEMENT_LIBRARY.find(e => e.id === type);
    const uid = `el-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    dispatch({ type: 'overlayElements', value: [
      ...(overlayElements || []),
      { uid, type, color: meta?.defaultColor ?? accentColor, opacity: 0.70, above: false },
    ]});
  }
  function removeOverlayElement(uid) {
    dispatch({ type: 'overlayElements', value: (overlayElements || []).filter(e => e.uid !== uid) });
  }
  function updateOverlayElement(uid, patch) {
    dispatch({ type: 'overlayElements', value: (overlayElements || []).map(e => e.uid === uid ? { ...e, ...patch } : e) });
  }

  // ── Player layers (photos joueurs détourées) ─────────────────────────────
  function addPlayerLayer(asset) {
    const uid = `pl-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    dispatch({ type: 'playerLayers', value: [
      ...(playerLayers || []),
      {
        uid, assetId: asset.id, assetUrl: asset.processedDataUrl, thumbUrl: asset.thumbDataUrl,
        name: asset.name, x: 50, yBottom: 0, scale: 1.0, opacity: 1.0,
        shadow: true, glow: false, flip: false, zAbove: true,
      },
    ]});
  }
  function removePlayerLayer(uid) {
    dispatch({ type: 'playerLayers', value: (playerLayers || []).filter(p => p.uid !== uid) });
  }
  function updatePlayerLayer(uid, patch) {
    dispatch({ type: 'playerLayers', value: (playerLayers || []).map(p => p.uid === uid ? { ...p, ...patch } : p) });
  }

  return {
    // State
    savedAiBgs, savedAiEls,
    // Fonds IA
    addSavedBg, removeSavedBg, addSavedEl, removeSavedEl,
    // Overlays IA
    addAiOverlay, removeAiOverlay, updateAiOverlay,
    // Éléments SVG
    addOverlayElement, removeOverlayElement, updateOverlayElement,
    // Player layers
    addPlayerLayer, removePlayerLayer, updatePlayerLayer,
  };
}
