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

      // Background sync to Supabase (fire-and-forget)
      if (userId) {
        if (adding) {
          supabase.from('favorites').insert({ user_id: userId, event_id: strId }).then(() => {});
        } else {
          supabase.from('favorites').delete().eq('user_id', userId).eq('event_id', strId).then(() => {});
        }
      }

      return next;
    });
  }, [userId]);

  const isFavorite = useCallback((id) => favorites.has(String(id)), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
