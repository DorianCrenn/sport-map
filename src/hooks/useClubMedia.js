// PS-HK-001/002 — Club media asset library hook
// localStorage-first, Supabase sync when available.
// Phase 1: data-URIs in localStorage (mock mode, no Storage bucket)
// Phase 4: replace with Supabase Storage URLs via Edge Function

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { processPlayerImage } from '../lib/imageUtils.js';

const LS_PREFIX = 'sl-club-media-';
const MAX_LOCAL_ASSETS = 12;

function lsKey(clubId) {
  return `${LS_PREFIX}${clubId || 'anonymous'}`;
}

function lsRead(clubId) {
  try {
    return JSON.parse(localStorage.getItem(lsKey(clubId)) || '[]');
  } catch {
    return [];
  }
}

function lsWrite(clubId, assets) {
  try {
    localStorage.setItem(lsKey(clubId), JSON.stringify(assets));
  } catch (e) {
    console.warn('[useClubMedia] localStorage quota exceeded:', e);
  }
}

export function useClubMedia(clubId) {
  const [assets, setAssets] = useState(() => lsRead(clubId));
  const [uploadPhase, setUploadPhase] = useState(null); // null | 'compressing' | 'processing' | 'thumbnail' | 'done' | 'error'
  const [uploadError, setUploadError] = useState(null);
  const [lastUpload, setLastUpload] = useState(null); // { processedDataUrl, thumbDataUrl, name }
  const userIdRef = useRef(null);

  // Sync userId
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data?.user?.id ?? null;
    });
  }, []);

  // Reload when clubId changes
  useEffect(() => {
    setAssets(lsRead(clubId));
  }, [clubId]);

  const persist = useCallback((updated) => {
    setAssets(updated);
    lsWrite(clubId, updated.map(a => ({
      ...a,
      // Don't persist full-size data-uri if we're over limit — keep thumb only
      processedDataUrl: a.processedDataUrl?.length > 300_000 ? null : a.processedDataUrl,
    })));
  }, [clubId]);

  // ── Upload & process ────────────────────────────────────────────────────────

  async function uploadPlayer(file, name = '') {
    setUploadError(null);
    setLastUpload(null);

    try {
      const result = await processPlayerImage(file, {
        onPhase: phase => setUploadPhase(phase),
      });

      setUploadPhase('done');

      const assetName = name.trim() || file.name.replace(/\.[^.]+$/, '') || 'Joueur';
      const asset = {
        id: `asset-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        clubId: clubId || null,
        name: assetName,
        tags: [],
        isFavorite: false,
        processedDataUrl: result.processedDataUrl,
        thumbDataUrl: result.thumbDataUrl,
        metadata: result.metadata,
        createdAt: new Date().toISOString(),
        mockMode: true, // flag for Phase 4 API migration
      };

      const next = [asset, ...assets].slice(0, MAX_LOCAL_ASSETS);
      persist(next);
      setLastUpload(asset);

      // Async Supabase sync (best-effort, doesn't block UX)
      syncToSupabase(asset).catch(() => {});

      return asset;
    } catch (err) {
      setUploadPhase('error');
      setUploadError(err.message || 'Erreur lors du traitement');
      throw err;
    }
  }

  async function syncToSupabase(asset) {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      await supabase.from('club_media_assets').insert({
        club_id: clubId || null,
        user_id: userId,
        type: 'player',
        name: asset.name,
        tags: asset.tags,
        is_favorite: asset.isFavorite,
        // In mock mode we store null URLs — real URLs come from Storage in Phase 4
        original_url: null,
        processed_url: null,
        thumbnail_url: null,
        metadata: { ...asset.metadata, localId: asset.id },
      });
    } catch {} // fail silently in mock mode
  }

  function resetUpload() {
    setUploadPhase(null);
    setUploadError(null);
    setLastUpload(null);
  }

  // ── Replace / versioning (POSTER-ARCH-001d/e) ────────────────────────────

  async function replaceAsset(id, file) {
    const existing = assets.find(a => a.id === id);
    if (!existing) return;
    setUploadPhase('compressing');
    try {
      const result = await processPlayerImage(file, { onPhase: phase => setUploadPhase(phase) });
      setUploadPhase('done');
      const prevVersion = {
        id: `v-${Date.now()}`,
        processedDataUrl: existing.processedDataUrl,
        thumbDataUrl: existing.thumbDataUrl,
        createdAt: existing.createdAt,
      };
      const updated = assets.map(a => a.id !== id ? a : {
        ...a,
        processedDataUrl: result.processedDataUrl,
        thumbDataUrl: result.thumbDataUrl,
        versions: [prevVersion, ...(a.versions ?? [])].slice(0, 5),
        createdAt: new Date().toISOString(),
      });
      persist(updated);
    } catch (err) {
      setUploadPhase('error');
      setUploadError(err.message || 'Erreur lors du remplacement');
    }
  }

  function revertToVersion(id, versionId) {
    const existing = assets.find(a => a.id === id);
    if (!existing) return;
    const version = (existing.versions ?? []).find(v => v.id === versionId);
    if (!version) return;
    const currentVersion = {
      id: `v-${Date.now()}`,
      processedDataUrl: existing.processedDataUrl,
      thumbDataUrl: existing.thumbDataUrl,
      createdAt: existing.createdAt,
    };
    const updated = assets.map(a => a.id !== id ? a : {
      ...a,
      processedDataUrl: version.processedDataUrl,
      thumbDataUrl: version.thumbDataUrl,
      versions: [currentVersion, ...(a.versions ?? []).filter(v => v.id !== versionId)].slice(0, 5),
    });
    persist(updated);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  function deleteAsset(id) {
    persist(assets.filter(a => a.id !== id));
  }

  function toggleFavorite(id) {
    persist(assets.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a));
  }

  function renameAsset(id, newName) {
    persist(assets.map(a => a.id === id ? { ...a, name: newName.trim() || a.name } : a));
  }

  function updateTags(id, tags) {
    persist(assets.map(a => a.id === id ? { ...a, tags } : a));
  }

  function setFolder(id, folder) {
    persist(assets.map(a => a.id === id ? { ...a, folder: folder || null } : a));
  }

  // ── Search / filter ─────────────────────────────────────────────────────────

  function searchAssets(query) {
    if (!query) return assets;
    const q = query.toLowerCase();
    return assets.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.tags ?? []).some(t => t.toLowerCase().includes(q))
    );
  }

  function filterByFavorites() {
    return assets.filter(a => a.isFavorite);
  }

  function filterByFolder(folder) {
    if (!folder) return assets;
    return assets.filter(a => a.folder === folder);
  }

  function getAvailableFolders() {
    const set = new Set(assets.map(a => a.folder).filter(Boolean));
    return [...set].sort();
  }

  return {
    assets,
    uploadPhase,
    uploadError,
    lastUpload,

    uploadPlayer,
    replaceAsset,
    revertToVersion,
    resetUpload,
    deleteAsset,
    toggleFavorite,
    renameAsset,
    updateTags,
    setFolder,
    searchAssets,
    filterByFavorites,
    filterByFolder,
    getAvailableFolders,
  };
}
