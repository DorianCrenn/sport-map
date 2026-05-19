// Persistence localStorage pour PosterStudio :
//   - auto-save brouillon par événement
//   - bibliothèque de 20 affiches nommées
//   - templates favoris
//   - template par défaut par club

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

  function loadDraft() {
    const d = ls_get(DRAFT_KEY, null);
    if (!d || d.eventKey !== eventKey) return null;
    return d;
  }

  function saveDraft(state) {
    ls_set(DRAFT_KEY, { eventKey, savedAt: new Date().toISOString(), state });
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

// ── Bibliothèque d'affiches nommées ──────────────────────────────────────────

export function usePosterLibrary() {
  function getAll() {
    return ls_get(LIBRARY_KEY, []);
  }

  function save(state, name) {
    const entry = {
      id: crypto.randomUUID(),
      name: name?.trim() || `Affiche ${new Date().toLocaleDateString('fr-FR')}`,
      savedAt: new Date().toISOString(),
      state,
    };
    ls_set(LIBRARY_KEY, [entry, ...getAll()].slice(0, 20));
    return entry;
  }

  function duplicate(id) {
    const original = getAll().find(e => e.id === id);
    if (!original) return null;
    return save({ ...original.state }, `${original.name} (copie)`);
  }

  function remove(id) {
    ls_set(LIBRARY_KEY, getAll().filter(e => e.id !== id));
  }

  return { getAll, save, duplicate, remove };
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
