// PosterStudio persistence — localStorage (immediate) + Supabase (background sync)
//
// usePosterDraft        — auto-save draft per event (1 draft/event/user via partial unique index)
// usePosterLibrary      — named poster library (reactive, synced to Supabase when logged in)
// useFavoriteTemplates  — heart-toggled template IDs (localStorage + profiles.poster_fav_templates)
// useDefaultTemplate    — default template per club (localStorage + club_brand_kits.default_template_id)

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
// Un seul brouillon par (event_id, user_id) grâce à l'index partiel unique
// posters_draft_event_user dans la migration SQL.

export function usePosterDraft(eventId) {
  const eventKey = String(eventId ?? '__no_event__');
  const isRealEvent = eventId && typeof eventId === 'string' && eventId.includes('-');

  // STAB-004 : synchroniser depuis Supabase au montage pour garantir la fraîcheur multi-device
  useEffect(() => {
    if (!isRealEvent) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      supabase.from('posters')
        .select('layers, updated_at')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled || !data?.layers) return;
          const lsData  = ls_get(DRAFT_KEY, null);
          const lsTs    = lsData?.savedAt ? new Date(lsData.savedAt).getTime() : 0;
          const dbTs    = new Date(data.updated_at).getTime();
          // N'écraser le cache local que si Supabase est plus récent
          if (dbTs > lsTs) {
            ls_set(DRAFT_KEY, { eventKey, savedAt: data.updated_at, state: data.layers });
          }
        });
    });
    return () => { cancelled = true; };
  }, [eventId, eventKey, isRealEvent]);

  function loadDraft() {
    const d = ls_get(DRAFT_KEY, null);
    if (!d || d.eventKey !== eventKey) return null;
    return d;
  }

  function saveDraft(state) {
    ls_set(DRAFT_KEY, { eventKey, savedAt: new Date().toISOString(), state });
    if (!isRealEvent) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // Upsert via la contrainte partielle unique (event_id, user_id) WHERE status='draft'
      supabase.from('posters').upsert(
        {
          event_id:    eventId,
          user_id:     user.id,
          name:        'Brouillon',
          status:      'draft',
          format:      state.format ?? 'story',
          template_id: state.templateId ?? 'simple',
          layers:      state,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'event_id,user_id', ignoreDuplicates: false }
      ).then(() => {}).catch(() => {});
    });
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    if (!isRealEvent) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('posters')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .then(() => {}).catch(() => {});
    });
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
    setEntries(prev => {
      const next = [entry, ...prev].slice(0, 20);
      ls_set(LIBRARY_KEY, next);
      return next;
    });
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
    // user_id filter redondant avec RLS mais plus sûr
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('posters').delete().eq('id', id).eq('user_id', user.id)
        .then(() => {}).catch(() => {});
    });
  }

  return { entries, save, duplicate, remove };
}

// ── Templates favoris — localStorage + sync profiles ─────────────────────────
// Stocké dans localStorage immédiatement.
// Synchro BDD via profiles.poster_fav_templates (jsonb) quand connecté.

export function useFavoriteTemplates() {
  function getAll() {
    return ls_get(FAV_TPL_KEY, []);
  }

  function toggle(id) {
    const favs = getAll();
    const next = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
    ls_set(FAV_TPL_KEY, next);
    // Background sync to profiles
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles')
        .update({ poster_fav_templates: next })
        .eq('id', user.id)
        .then(() => {}).catch(() => {});
    });
    return next;
  }

  function isFav(id) {
    return getAll().includes(id);
  }

  // Charge depuis profiles au montage si connecté
  function loadFromDB() {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles')
        .select('poster_fav_templates')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data?.poster_fav_templates) return;
          ls_set(FAV_TPL_KEY, data.poster_fav_templates);
        });
    });
  }

  return { getAll, toggle, isFav, loadFromDB };
}

// ── Template par défaut par club — localStorage + club_brand_kits ─────────────
// Stocké dans localStorage immédiatement.
// Synchro BDD via club_brand_kits.default_template_id quand connecté et club réel.

export function useDefaultTemplate(clubId) {
  const ctxKey = String(clubId ?? '__global__');
  const isRealClub = clubId && typeof clubId === 'string' && clubId.includes('-');

  function get() {
    return ls_get(DEF_TPL_KEY, {})[ctxKey] ?? null;
  }

  function set(templateId) {
    const data = ls_get(DEF_TPL_KEY, {});
    data[ctxKey] = templateId;
    ls_set(DEF_TPL_KEY, data);
    if (!isRealClub) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('club_brand_kits')
        .upsert({ club_id: clubId, default_template_id: templateId }, { onConflict: 'club_id' })
        .then(() => {}).catch(() => {});
    });
  }

  function clear() {
    const data = ls_get(DEF_TPL_KEY, {});
    delete data[ctxKey];
    ls_set(DEF_TPL_KEY, data);
    if (!isRealClub) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('club_brand_kits')
        .update({ default_template_id: null })
        .eq('club_id', clubId)
        .then(() => {}).catch(() => {});
    });
  }

  return { get, set, clear };
}
