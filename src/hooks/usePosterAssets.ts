import { useState } from 'react';
import { ELEMENT_LIBRARY } from '../components/poster/posterElements.jsx';
import { loadSavedBgs, persistSavedBgs, loadSavedEls, persistSavedEls } from '../components/poster/posterConstants.js';
import type { MediaAsset } from './useClubMedia.js';

type PosterDispatch = (action: Record<string, unknown>) => void;

interface SavedBg { id: string; imageUrl?: string; savedAt: string; [key: string]: unknown; }
interface SavedEl { id: string; imageUrl?: string; savedAt: string; [key: string]: unknown; }
interface AiOverlayEl { uid: string; above: boolean; opacity: number; blendMode: string; [key: string]: unknown; }
interface OverlayEl   { uid: string; type: string; color: string; opacity: number; above: boolean; [key: string]: unknown; }
interface PlayerLayer { uid: string; assetId: string; assetUrl: string | null; thumbUrl: string | null; name: string; x: number; yBottom: number; scale: number; opacity: number; shadow: boolean; glow: boolean; flip: boolean; zAbove: boolean; [key: string]: unknown; }

interface PosterAssetsOptions {
  clubId?:          string | null;
  accentColor:      string;
  dispatch:         PosterDispatch;
  overlayElements:  OverlayEl[];
  aiOverlayElements: AiOverlayEl[];
  playerLayers:     PlayerLayer[];
}

export function usePosterAssets({ clubId, accentColor, dispatch, overlayElements, aiOverlayElements, playerLayers }: PosterAssetsOptions) {
  const [savedAiBgs, setSavedAiBgs] = useState<SavedBg[]>(() => loadSavedBgs(clubId) as SavedBg[]);
  const [savedAiEls, setSavedAiEls] = useState<SavedEl[]>(() => loadSavedEls(clubId) as SavedEl[]);

  function addSavedBg(bgEntry: SavedBg) {
    const next = [{ ...bgEntry, id: `bg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, savedAt: new Date().toISOString() }, ...savedAiBgs].slice(0, 12);
    setSavedAiBgs(next); persistSavedBgs(clubId, next);
  }
  function removeSavedBg(bgId: string) { const next = savedAiBgs.filter(b => b.id !== bgId); setSavedAiBgs(next); persistSavedBgs(clubId, next); }
  function addSavedEl(elEntry: SavedEl) {
    const next = [{ ...elEntry, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, savedAt: new Date().toISOString() }, ...savedAiEls].slice(0, 12);
    setSavedAiEls(next); persistSavedEls(clubId, next);
  }
  function removeSavedEl(elId: string) { const next = savedAiEls.filter(e => e.id !== elId); setSavedAiEls(next); persistSavedEls(clubId, next); }

  function addAiOverlay(el: Partial<AiOverlayEl>) {
    dispatch({ type: 'PATCH', payload: { aiOverlayElements: [...(aiOverlayElements || []), { uid: `ai-${Date.now()}`, above: false, opacity: 0.85, blendMode: 'screen', ...el }] } });
  }
  function removeAiOverlay(uid: string) { dispatch({ type: 'PATCH', payload: { aiOverlayElements: (aiOverlayElements || []).filter(e => e.uid !== uid) } }); }
  function updateAiOverlay(uid: string, patch: Partial<AiOverlayEl>) { dispatch({ type: 'PATCH', payload: { aiOverlayElements: (aiOverlayElements || []).map(e => e.uid === uid ? { ...e, ...patch } : e) } }); }

  function addOverlayElement(type: string) {
    const meta = (ELEMENT_LIBRARY as { id: string; defaultColor?: string }[]).find(e => e.id === type);
    const uid  = `el-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    dispatch({ type: 'overlayElements', value: [...(overlayElements || []), { uid, type, color: meta?.defaultColor ?? accentColor, opacity: 0.70, above: false }] });
  }
  function removeOverlayElement(uid: string) { dispatch({ type: 'overlayElements', value: (overlayElements || []).filter(e => e.uid !== uid) }); }
  function updateOverlayElement(uid: string, patch: Partial<OverlayEl>) { dispatch({ type: 'overlayElements', value: (overlayElements || []).map(e => e.uid === uid ? { ...e, ...patch } : e) }); }

  function addPlayerLayer(asset: MediaAsset) {
    const uid = `pl-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    dispatch({ type: 'playerLayers', value: [...(playerLayers || []), { uid, assetId: asset.id, assetUrl: asset.processedDataUrl, thumbUrl: asset.thumbDataUrl, name: asset.name, x: 50, yBottom: 0, scale: 1.0, opacity: 1.0, shadow: true, glow: false, flip: false, zAbove: true }] });
  }
  function removePlayerLayer(uid: string) { dispatch({ type: 'playerLayers', value: (playerLayers || []).filter(p => p.uid !== uid) }); }
  function updatePlayerLayer(uid: string, patch: Partial<PlayerLayer>) { dispatch({ type: 'playerLayers', value: (playerLayers || []).map(p => p.uid === uid ? { ...p, ...patch } : p) }); }

  return { savedAiBgs, savedAiEls, addSavedBg, removeSavedBg, addSavedEl, removeSavedEl, addAiOverlay, removeAiOverlay, updateAiOverlay, addOverlayElement, removeOverlayElement, updateOverlayElement, addPlayerLayer, removePlayerLayer, updatePlayerLayer };
}
