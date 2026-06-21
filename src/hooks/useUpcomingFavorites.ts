import { useMemo } from 'react';
import type { SportLinkEvent } from '../types/sportlink.js';

interface UpcomingFavoritesResult {
  today: SportLinkEvent[];
  tomorrow: SportLinkEvent[];
}

export function useUpcomingFavorites(
  allEvents: SportLinkEvent[],
  favorites: Set<string>,
): UpcomingFavoritesResult {
  return useMemo(() => {
    if (!favorites || favorites.size === 0) return { today: [], tomorrow: [] };

    const now = new Date();
    const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const dayAfterStart = new Date(tomorrowStart);
    dayAfterStart.setDate(dayAfterStart.getDate() + 1);

    const favEvents = allEvents.filter(e => favorites.has(e.id));

    const today = favEvents
      .filter(e => {
        const d = new Date(e.date);
        return d >= todayStart && d < tomorrowStart && d > now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const tomorrow = favEvents
      .filter(e => {
        const d = new Date(e.date);
        return d >= tomorrowStart && d < dayAfterStart;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { today, tomorrow };
  }, [allEvents, favorites]);
}
