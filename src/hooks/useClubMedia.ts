/* eslint-disable react-hooks/purity */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { processPlayerImage } from '../lib/imageUtils.js';

const LS_PREFIX       = 'sl-club-media-';
const MAX_LOCAL_ASSETS = 12;

function lsKey(clubId: string | null | undefined): string { return `${LS_PREFIX}${clubId ?? 'anonymous'}`; }
function lsRead(clubId: string | null | undefined): MediaAsset[] {
  try { return JSON.parse(localStorage.getItem(lsKey(clubId)) ?? '[]') as MediaAsset[]; } catch { return []; }
}
function lsWrite(clubId: string | null | undefined, assets: MediaAsset[]): void {
  try { localStorage.setItem(lsKey(clubId), JSON.stringify(assets)); }
  catch (e) { console.warn('[useClubMedia] localStorage quota exceeded:', e); }
}

export type UploadPhase = null | 'compressing' | 'processing' | 'thumbnail' | 'done' | 'error';

interface AssetVersion { id: string; processedDataUrl: string | null; thumbDataUrl: string | null; createdAt: string; }

export interface MediaAsset {
  id:               string;
  clubId:           string | null;
  name:             string;
  tags:             string[];
  isFavorite:       boolean;
  processedDataUrl: string | null;
  thumbDataUrl:     string | null;
  metadata?:        Record<string, unknown>;
  createdAt:        string;
  mockMode?:        boolean;
  versions?:        AssetVersion[];
  folder?:          string | null;
}

export function useClubMedia(clubId: string | null | undefined) {
  const [assets,      setAssets]      = useState<MediaAsset[]>(() => lsRead(clubId));
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUpload,  setLastUpload]  = useState<MediaAsset | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user?: { id?: string } | null } }) => {
      userIdRef.current = data?.user?.id ?? null;
    });
  }, []);

  useEffect(() => { setAssets(lsRead(clubId)); }, [clubId]);

  const persist = useCallback((updated: MediaAsset[]) => {
    setAssets(updated);
    lsWrite(clubId, updated.map(a => ({
      ...a,
      processedDataUrl: (a.processedDataUrl?.length ?? 0) > 300_000 ? null : a.processedDataUrl,
    })));
  }, [clubId]);

  async function uploadPlayer(file: File, name = ''): Promise<MediaAsset> {
    setUploadError(null);
    setLastUpload(null);
    try {
      const result = await processPlayerImage(file, { onPhase: (phase: UploadPhase) => setUploadPhase(phase) });
      setUploadPhase('done');
      const assetName = name.trim() || file.name.replace(/\.[^.]+$/, '') || 'Joueur';
      const asset: MediaAsset = {
        id: `asset-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        clubId: clubId ?? null,
        name: assetName, tags: [], isFavorite: false,
        processedDataUrl: result.processedDataUrl as string,
        thumbDataUrl:     result.thumbDataUrl as string,
        metadata:         result.metadata as Record<string, unknown>,
        createdAt: new Date().toISOString(), mockMode: true,
      };
      const next = [asset, ...assets].slice(0, MAX_LOCAL_ASSETS);
      persist(next);
      setLastUpload(asset);
      syncToSupabase(asset).catch((e: unknown) => console.warn('[useClubMedia] sync failed:', e));
      return asset;
    } catch (err) {
      setUploadPhase('error');
      setUploadError((err as Error).message || 'Erreur lors du traitement');
      throw err;
    }
  }

  async function syncToSupabase(asset: MediaAsset): Promise<void> {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      await supabase.from('club_media_assets').insert({
        club_id: clubId ?? null, user_id: userId, type: 'player', name: asset.name, tags: asset.tags,
        is_favorite: asset.isFavorite, original_url: null, processed_url: null, thumbnail_url: null,
        metadata: { ...asset.metadata, localId: asset.id },
      });
    } catch { /* ignore */ }
  }

  function resetUpload(): void { setUploadPhase(null); setUploadError(null); setLastUpload(null); }

  async function replaceAsset(id: string, file: File): Promise<void> {
    const existing = assets.find(a => a.id === id);
    if (!existing) return;
    setUploadPhase('compressing');
    try {
      const result = await processPlayerImage(file, { onPhase: (phase: UploadPhase) => setUploadPhase(phase) });
      setUploadPhase('done');
      const prevVersion: AssetVersion = { id: `v-${Date.now()}`, processedDataUrl: existing.processedDataUrl, thumbDataUrl: existing.thumbDataUrl, createdAt: existing.createdAt };
      const updated = assets.map(a => a.id !== id ? a : {
        ...a,
        processedDataUrl: result.processedDataUrl as string,
        thumbDataUrl:     result.thumbDataUrl as string,
        versions: [prevVersion, ...(a.versions ?? [])].slice(0, 5),
        createdAt: new Date().toISOString(),
      });
      persist(updated);
    } catch (err) { setUploadPhase('error'); setUploadError((err as Error).message || 'Erreur lors du remplacement'); }
  }

  function revertToVersion(id: string, versionId: string): void {
    const existing = assets.find(a => a.id === id);
    if (!existing) return;
    const version = (existing.versions ?? []).find(v => v.id === versionId);
    if (!version) return;
    const currentVersion: AssetVersion = { id: `v-${Date.now()}`, processedDataUrl: existing.processedDataUrl, thumbDataUrl: existing.thumbDataUrl, createdAt: existing.createdAt };
    persist(assets.map(a => a.id !== id ? a : {
      ...a,
      processedDataUrl: version.processedDataUrl,
      thumbDataUrl:     version.thumbDataUrl,
      versions: [currentVersion, ...(a.versions ?? []).filter(v => v.id !== versionId)].slice(0, 5),
    }));
  }

  function deleteAsset(id: string): void { persist(assets.filter(a => a.id !== id)); }
  function toggleFavorite(id: string): void { persist(assets.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a)); }
  function renameAsset(id: string, newName: string): void { persist(assets.map(a => a.id === id ? { ...a, name: newName.trim() || a.name } : a)); }
  function updateTags(id: string, tags: string[]): void { persist(assets.map(a => a.id === id ? { ...a, tags } : a)); }
  function setFolder(id: string, folder: string | null): void { persist(assets.map(a => a.id === id ? { ...a, folder: folder || null } : a)); }

  function searchAssets(query: string): MediaAsset[] {
    if (!query) return assets;
    const q = query.toLowerCase();
    return assets.filter(a => a.name.toLowerCase().includes(q) || (a.tags ?? []).some(t => t.toLowerCase().includes(q)));
  }
  function filterByFavorites(): MediaAsset[] { return assets.filter(a => a.isFavorite); }
  function filterByFolder(folder: string): MediaAsset[] { if (!folder) return assets; return assets.filter(a => a.folder === folder); }
  function getAvailableFolders(): string[] { return [...new Set(assets.map(a => a.folder).filter((f): f is string => !!f))].sort(); }

  return { assets, uploadPhase, uploadError, lastUpload, uploadPlayer, replaceAsset, revertToVersion, resetUpload, deleteAsset, toggleFavorite, renameAsset, updateTags, setFolder, searchAssets, filterByFavorites, filterByFolder, getAvailableFolders };
}
