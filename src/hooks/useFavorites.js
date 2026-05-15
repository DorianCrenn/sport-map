import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function lsKey(userId) {
  return userId ? `sl-favs-${userId}` : 'sl-favs-anon';
}

function load(userId) {
  try { return new Set(JSON.parse(localStorage.getItem(lsKey(userId)) ?? '[]')); }
  catch { return new Set(); }
}

function save(userId, set) {
  localStorage.setItem(lsKey(userId), JSON.stringify([...set]));
}

export function useFavorites() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const prevUserId = useRef(undefined);

  const [favorites, setFavorites] = useState(() => load(null));

  useEffect(() => {
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;
    setFavorites(load(userId));
  }, [userId]);

  const toggleFavorite = useCallback((id) => {
    const strId = String(id);
    setFavorites(prev => {
      const next = new Set(prev);
      const adding = !next.has(strId);
      adding ? next.add(strId) : next.delete(strId);
      save(userId, next);

      if (userId) {
        const op = adding
          ? supabase.from('favorites').insert({ user_id: userId, event_id: strId })
          : supabase.from('favorites').delete().eq('user_id', userId).eq('event_id', strId);

        op.then(({ error }) => {
          if (error) {
            // Rollback local state on DB failure
            console.error('[Favorites] sync failed, rolling back:', error.message);
            setFavorites(curr => {
              const rolled = new Set(curr);
              adding ? rolled.delete(strId) : rolled.add(strId);
              save(userId, rolled);
              return rolled;
            });
          }
        });
      }

      return next;
    });
  }, [userId]);

  const isFavorite = useCallback((id) => favorites.has(String(id)), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
