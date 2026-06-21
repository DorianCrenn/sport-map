import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

const DRAFT_KEY   = 'sl-poster-draft';
const LIBRARY_KEY = 'sl-poster-library';
const FAV_TPL_KEY = 'sl-fav-templates';
const DEF_TPL_KEY = 'sl-default-template';

type AnyJSON = Record<string, unknown>;

function ls_get<T>(key: string, fallback: T): T {
  try { return (JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback) as T; }
  catch { return fallback; }
}
function ls_set(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

export function usePosterDraft(eventId: string | null | undefined) {
  const { currentUser } = useAuth();
  const userId    = currentUser?.id ?? null;
  const eventKey  = String(eventId ?? '__no_event__');
  const isRealEvent = eventId && typeof eventId === 'string' && eventId.includes('-');

  useEffect(() => {
    if (!isRealEvent || !userId) return;
    let cancelled = false;
    supabase.from('posters').select('layers, updated_at').eq('event_id', eventId).eq('user_id', userId).eq('status', 'draft').maybeSingle()
      .then(({ data }: { data: { layers?: AnyJSON; updated_at?: string } | null }) => {
        if (cancelled || !data?.layers) return;
        const lsData = ls_get<{ savedAt?: string; state?: AnyJSON } | null>(DRAFT_KEY, null);
        const lsTs   = lsData?.savedAt ? new Date(lsData.savedAt).getTime() : 0;
        const dbTs   = data.updated_at ? new Date(data.updated_at).getTime() : 0;
        if (dbTs > lsTs) ls_set(DRAFT_KEY, { eventKey, savedAt: data.updated_at, state: data.layers });
      });
    return () => { cancelled = true; };
  }, [eventId, eventKey, isRealEvent, userId]);

  function loadDraft(): { eventKey: string; savedAt: string; state: AnyJSON } | null {
    const d = ls_get<{ eventKey?: string; savedAt?: string; state?: AnyJSON } | null>(DRAFT_KEY, null);
    if (!d || d.eventKey !== eventKey) return null;
    return d as { eventKey: string; savedAt: string; state: AnyJSON };
  }

  function saveDraft(state: AnyJSON): void {
    ls_set(DRAFT_KEY, { eventKey, savedAt: new Date().toISOString(), state });
    if (!isRealEvent || !userId) return;
    const payload = { user_id: userId, event_id: eventId, name: 'Brouillon', status: 'draft', format: state.format ?? 'story', template_id: state.templateId ?? 'simple', layers: state, updated_at: new Date().toISOString() };
    supabase.from('posters').update({ layers: state, template_id: payload.template_id as string, format: payload.format as string, updated_at: payload.updated_at }).eq('event_id', eventId!).eq('user_id', userId).eq('status', 'draft').select('id')
      .then(
        ({ data }: { data: { id: string }[] | null }) => {
          if (!data || data.length === 0) { supabase.from('posters').insert(payload).then(() => {}, () => {}); }
        },
        () => {}
      );
  }

  function clearDraft(): void {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    if (!isRealEvent || !userId) return;
    supabase.from('posters').delete().eq('event_id', eventId!).eq('user_id', userId).eq('status', 'draft').then(() => {}, () => {});
  }

  function hasDraft(): boolean { const d = ls_get<{ eventKey?: string } | null>(DRAFT_KEY, null); return !!d && d.eventKey === eventKey; }

  return { loadDraft, saveDraft, clearDraft, hasDraft };
}

interface LibraryEntry { id: string; name: string; savedAt: string; state: AnyJSON; }

export function usePosterLibrary() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const [entries, setEntries] = useState<LibraryEntry[]>(() => ls_get(LIBRARY_KEY, []));

  useEffect(() => {
    if (!userId) return;
    supabase.from('posters').select('id, name, created_at, layers, format, template_id').eq('user_id', userId).eq('status', 'saved').order('created_at', { ascending: false }).limit(20)
      .then(({ data, error }: { data: { id: string; name: string; created_at: string; layers?: AnyJSON }[] | null; error: { message: string } | null }) => {
        if (error || !data || data.length === 0) return;
        const normalized = data.map(p => ({ id: p.id, name: p.name, savedAt: p.created_at, state: p.layers ?? {} }));
        setEntries(normalized); ls_set(LIBRARY_KEY, normalized);
      });
  }, [userId]);

  function save(state: AnyJSON, name?: string): LibraryEntry {
    const entry: LibraryEntry = { id: crypto.randomUUID(), name: name?.trim() || `Affiche ${new Date().toLocaleDateString('fr-FR')}`, savedAt: new Date().toISOString(), state };
    setEntries(prev => { const next = [entry, ...prev].slice(0, 20); ls_set(LIBRARY_KEY, next); return next; });
    if (!userId) return entry;
    supabase.from('posters').insert({ id: entry.id, user_id: userId, name: entry.name, status: 'saved', format: state.format ?? 'story', template_id: state.templateId ?? 'simple', layers: state }).then(() => {}, () => {});
    return entry;
  }

  function duplicate(id: string): LibraryEntry | null {
    const original = entries.find(e => e.id === id);
    if (!original) return null;
    return save({ ...original.state }, `${original.name} (copie)`);
  }

  function remove(id: string): void {
    setEntries(prev => { const next = prev.filter(e => e.id !== id); ls_set(LIBRARY_KEY, next); return next; });
    if (!userId) return;
    supabase.from('posters').delete().eq('id', id).eq('user_id', userId).then(() => {}, () => {});
  }

  return { entries, save, duplicate, remove };
}

export function useFavoriteTemplates() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;

  function getAll(): string[] { return ls_get(FAV_TPL_KEY, []); }

  function toggle(id: string): string[] {
    const favs = getAll();
    const next = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
    ls_set(FAV_TPL_KEY, next);
    if (!userId) return next;
    supabase.from('profiles').update({ poster_fav_templates: next }).eq('id', userId).then(() => {}, () => {});
    return next;
  }

  function isFav(id: string): boolean { return getAll().includes(id); }

  function loadFromDB(): void {
    if (!userId) return;
    supabase.from('profiles').select('poster_fav_templates').eq('id', userId).single()
      .then(({ data, error }: { data: { poster_fav_templates?: string[] } | null; error: { message: string } | null }) => {
        if (error || !data?.poster_fav_templates) return;
        ls_set(FAV_TPL_KEY, data.poster_fav_templates);
      });
  }

  // Charger depuis DB au montage si localStorage vide
  useEffect(() => {
    if (!userId) return;
    const cached = ls_get<string[]>(FAV_TPL_KEY, []);
    if (cached.length === 0) loadFromDB();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { getAll, toggle, isFav, loadFromDB };
}

export function useDefaultTemplate(clubId: string | null | undefined) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const ctxKey    = String(clubId ?? '__global__');
  const isRealClub = clubId && typeof clubId === 'string' && clubId.includes('-');

  function get(): string | null { return (ls_get<Record<string, string>>(DEF_TPL_KEY, {}))[ctxKey] ?? null; }

  function set(templateId: string): void {
    const data = ls_get<Record<string, string>>(DEF_TPL_KEY, {}); data[ctxKey] = templateId; ls_set(DEF_TPL_KEY, data);
    if (!isRealClub || !userId) return;
    supabase.from('club_brand_kits').upsert({ club_id: clubId, default_template_id: templateId }, { onConflict: 'club_id' }).then(() => {}, () => {});
  }

  function clear(): void {
    const data = ls_get<Record<string, string>>(DEF_TPL_KEY, {}); delete data[ctxKey]; ls_set(DEF_TPL_KEY, data);
    if (!isRealClub || !userId) return;
    supabase.from('club_brand_kits').update({ default_template_id: null }).eq('club_id', clubId!).then(() => {}, () => {});
  }

  return { get, set, clear };
}
