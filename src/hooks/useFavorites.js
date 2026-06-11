import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function lsKey(userId) {
  return userId ? `sl-favs-${userId}` : 'sl-favs-anon';
}

function save(userId, set) {
  try { localStorage.setItem(lsKey(userId), JSON.stringify([...set])); } catch { /* storage plein */ }
}

export function useFavorites() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const prevUserId = useRef(undefined);

  const [favorites, setFavorites] = useState(() => new Set());

  // ── Load from Supabase on user change (source of truth) ──────────────────

  useEffect(() => {
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (!userId) {
      setFavorites(new Set());
      return;
    }

    supabase
      .from('favorites')
      .select('event_id')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) {
          console.error('[Favorites] fetch failed, using cache:', error.message);
          try {
            const cached = JSON.parse(localStorage.getItem(lsKey(userId)) ?? '[]');
            setFavorites(new Set(cached.map(String)));
          } catch { setFavorites(new Set()); }
          return;
        }
        const serverSet = new Set((data ?? []).map(r => String(r.event_id)));
        setFavorites(serverSet);
        save(userId, serverSet);
      });
  }, [userId]);

  // ── Toggle (optimistic + Supabase) ───────────────────────────────────────

  const toggleFavorite = useCallback((id) => {
    const strId = String(id);
    setFavorites(prev => {
      const next   = new Set(prev);
      const adding = !next.has(strId);
      adding ? next.add(strId) : next.delete(strId);
      save(userId, next);

      if (userId) {
        const op = adding
          ? supabase.from('favorites').insert({ user_id: userId, event_id: strId })
          : supabase.from('favorites').delete().eq('user_id', userId).eq('event_id', strId);

        op.then(({ error }) => {
          if (error) {
            console.error('[Favorites] sync failed, rolling back:', error.message);
            setFavorites(curr => {
              const rolled = new Set(curr);
              adding ? rolled.delete(strId) : rolled.add(strId);
              save(userId, rolled);
              return rolled;
            });
          } else if (adding && isDemoMode()) {
            window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'event-favorited' } }));
          }
        });
      }

      return next;
    });
  }, [userId]);

  const isFavorite = useCallback((id) => favorites.has(String(id)), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
