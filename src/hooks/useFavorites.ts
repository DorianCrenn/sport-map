import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

function lsKey(userId: string | null): string {
  return userId ? `sl-favs-${userId}` : 'sl-favs-anon';
}

function save(userId: string | null, set: Set<string>) {
  try { localStorage.setItem(lsKey(userId), JSON.stringify([...set])); } catch { /* storage plein */ }
}

interface UseFavoritesResult {
  favorites: Set<string>;
  toggleFavorite: (id: string | number) => void;
  isFavorite: (id: string | number) => boolean;
}

export function useFavorites(): UseFavoritesResult {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const prevUserId = useRef<string | null | undefined>(undefined);

  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

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
      .then(({ data, error }: { data: { event_id: string }[] | null; error: { message: string } | null }) => {
        if (error) {
          console.error('[Favorites] fetch failed, using cache:', error.message);
          try {
            const cached = JSON.parse(localStorage.getItem(lsKey(userId)) ?? '[]') as string[];
            setFavorites(new Set(cached.map(String)));
          } catch { setFavorites(new Set()); }
          return;
        }
        const serverSet = new Set((data ?? []).map(r => String(r.event_id)));
        setFavorites(serverSet);
        save(userId, serverSet);
      });
  }, [userId]);

  const toggleFavorite = useCallback((id: string | number) => {
    const strId = String(id);
    setFavorites(prev => {
      const next   = new Set(prev);
      const adding = !next.has(strId);
      if (adding) next.add(strId); else next.delete(strId);
      save(userId, next);

      if (userId) {
        const op = adding
          ? supabase.from('favorites').insert({ user_id: userId, event_id: strId })
          : supabase.from('favorites').delete().eq('user_id', userId).eq('event_id', strId);

        op.then(({ error }: { error: { message: string } | null }) => {
          if (error) {
            console.error('[Favorites] sync failed, rolling back:', error.message);
            setFavorites(curr => {
              const rolled = new Set(curr);
              if (adding) rolled.delete(strId); else rolled.add(strId);
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

  const isFavorite = useCallback((id: string | number) => favorites.has(String(id)), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
