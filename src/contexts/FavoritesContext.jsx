import { createContext, useContext, useMemo } from 'react';
import { useFavorites } from '../hooks/useFavorites.js';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite }),
    [favorites, toggleFavorite, isFavorite]
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavoritesContext must be used within FavoritesProvider');
  return ctx;
}
