import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const LOCAL_KEY = 'sport-map-favorites';

export function useFavorites() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const prevUserId = useRef(null);

  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (!userId) {
      try { setFavorites(new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'))); }
      catch { setFavorites(new Set()); }
      return;
    }

    supabase.from('favorites').select('event_id').eq('user_id', userId)
      .then(({ data }) => {
        if (data) setFavorites(new Set(data.map(r => String(r.event_id))));
      });
  }, [userId]);

  const toggleFavorite = useCallback(async (id) => {
    const strId = String(id);
    const isCurrentlyFav = favorites.has(strId);

    setFavorites(prev => {
      const next = new Set(prev);
      isCurrentlyFav ? next.delete(strId) : next.add(strId);
      if (!userId) localStorage.setItem(LOCAL_KEY, JSON.stringify([...next]));
      return next;
    });

    if (!userId) return;
    if (isCurrentlyFav) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('event_id', strId);
    } else {
      await supabase.from('favorites').insert({ user_id: userId, event_id: strId });
    }
  }, [userId, favorites]);

  const isFavorite = useCallback((id) => favorites.has(String(id)), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
