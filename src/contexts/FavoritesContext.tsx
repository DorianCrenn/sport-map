import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useFavorites } from '../hooks/useFavorites.js';

interface FavoritesContextValue {
  favorites: Set<string>;
  toggleFavorite: (eventId: string) => void;
  isFavorite: (eventId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite }),
    [favorites, toggleFavorite, isFavorite],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavoritesContext(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavoritesContext must be used within FavoritesProvider');
  return ctx;
}
