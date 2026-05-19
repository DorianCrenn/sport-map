// PosterStudio persistence — localStorage (immediate) + Supabase (background sync)
//
// usePosterDraft   — auto-save draft per event
// usePosterLibrary — named poster library (reactive, synced to Supabase when logged in)
// useFavoriteTemplates — heart-toggled template IDs
// useDefaultTemplate   — default template per club

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const DRAFT_KEY   = 'sl-poster-draft';
const LIBRARY_KEY = 'sl-poster-library';
const FAV_TPL_KEY = 'sl-fav-templates';
const DEF_TPL_KEY = 'sl-default-template';

function ls_get(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
function ls_set(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Brouillon auto-sauvegardé ─────────────────────────────────────────────────

export function usePosterDraft(eventId) {
  const eventKey = String(eventId ?? '__no_event__');
  const isRealEvent = eventId && typeof eventId === 'string' && eventId.includes('-');

  function loadDraft() {
    const d = ls_get(DRAFT_KEY, null);
    if (!d || d.eventKey !== eventKey) return null;
    return d;
  }

  function saveDraft(state) {
    ls_set(DRAFT_KEY, { eventKey, savedAt: new Date().toISOString(), state });
    if (!isRealEvent) return;
    // Background Supabase upsert (fire and forget)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('posters').upsert(
        {
          event_id:    eventId,
          user_id:     user.id,
          status:      'draft',
          format:      state.format ?? 'story',
          template_id: state.templateId ?? 'simple',
          layers:      state,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'event_id,user_id' }
      ).then(() => {}).catch(() => {});
    });
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  function hasDraft() {
    const d = ls_get(DRAFT_KEY, null);
    return !!d && d.eventKey === eventKey;
  }

  return { loadDraft, saveDraft, clearDraft, hasDraft };
}

// ── Bibliothèque d'affiches nommées — reactive + Supabase backed ──────────────

export function usePosterLibrary() {
  const [entries, setEntries] = useState(() => ls_get(LIBRARY_KEY, []));

  // On mount: fetch from Supabase if authenticated, merge with localStorage
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('posters')
        .select('id, name, created_at, layers, format, template_id')
        .eq('user_id', user.id)
        .eq('status', 'saved')
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data, error }) => {
          if (error || !data || data.length === 0) return;
          const normalized = data.map(p => ({
            id:      p.id,
            name:    p.name,
            savedAt: p.created_at,
            state:   p.layers ?? {},
          }));
          setEntries(normalized);
          ls_set(LIBRARY_KEY, normalized);
        });
    });
  }, []);

  function save(state, name) {
    const entry = {
      id:      crypto.randomUUID(),
      name:    name?.trim() || `Affiche ${new Date().toLocaleDateString('fr-FR')}`,
      savedAt: new Date().toISOString(),
      state,
    };
    // Functional update avoids stale closure when called multiple times rapidly
    setEntries(prev => {
      const next = [entry, ...prev].slice(0, 20);
      ls_set(LIBRARY_KEY, next);
      return next;
    });
    // Background Supabase insert
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('posters').insert({
        id:          entry.id,
        user_id:     user.id,
        name:        entry.name,
        status:      'saved',
        format:      state.format ?? 'story',
        template_id: state.templateId ?? 'simple',
        layers:      state,
      }).then(() => {}).catch(() => {});
    });
    return entry;
  }

  function duplicate(id) {
    const original = entries.find(e => e.id === id);
    if (!original) return null;
    return save({ ...original.state }, `${original.name} (copie)`);
  }

  function remove(id) {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      ls_set(LIBRARY_KEY, next);
      return next;
    });
    supabase.from('posters').delete().eq('id', id).then(() => {}).catch(() => {});
  }

  return { entries, save, duplicate, remove };
}

// ── Templates favoris ─────────────────────────────────────────────────────────

export function useFavoriteTemplates() {
  function getAll() {
    return ls_get(FAV_TPL_KEY, []);
  }

  function toggle(id) {
    const favs = getAll();
    const next = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
    ls_set(FAV_TPL_KEY, next);
    return next;
  }

  function isFav(id) {
    return getAll().includes(id);
  }

  return { getAll, toggle, isFav };
}

// ── Template par défaut par club ──────────────────────────────────────────────

export function useDefaultTemplate(clubId) {
  const ctxKey = String(clubId ?? '__global__');

  function get() {
    return ls_get(DEF_TPL_KEY, {})[ctxKey] ?? null;
  }

  function set(templateId) {
    const data = ls_get(DEF_TPL_KEY, {});
    data[ctxKey] = templateId;
    ls_set(DEF_TPL_KEY, data);
  }

  function clear() {
    const data = ls_get(DEF_TPL_KEY, {});
    delete data[ctxKey];
    ls_set(DEF_TPL_KEY, data);
  }

  return { get, set, clear };
}
