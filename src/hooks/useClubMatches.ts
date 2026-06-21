import { useMemo } from 'react';
import { useClubs } from './useClubs.js';

const CITY_COORDS: Record<string, [number, number]> = {
  brest:               [48.3904, -4.4861],
  quimper:             [47.9961, -4.0968],
  morlaix:             [48.5778, -3.8272],
  landerneau:          [48.4527, -4.2505],
  douarnenez:          [48.0938, -4.3346],
  concarneau:          [47.8717, -3.9189],
  châteaulin:          [48.1958, -4.0863],
  chateaulin:          [48.1958, -4.0863],
  carhaix:             [48.2762, -3.5762],
  'saint-pol-de-léon': [48.6836, -3.9855],
  "pont-l'abbé":       [47.8654, -4.2193],
  pontlabbé:           [47.8654, -4.2193],
  plabennec:           [48.4729, -4.4275],
  lesneven:            [48.5734, -4.3252],
  landivisiau:         [48.5082, -4.0666],
  quimperlé:           [47.8719, -3.5494],
};

function getCoords(city?: string): [number, number] {
  if (!city) return [48.2, -4.1];
  const key = city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    const normalizedKey = k.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (key === normalizedKey || key.includes(normalizedKey) || normalizedKey.includes(key)) return v;
  }
  return [48.2, -4.1];
}

interface ClubMatchEvent {
  id: string;
  title: string;
  sport: string;
  date: string;
  city: string;
  venue: string;
  lat: number;
  lng: number;
  departmentId: string;
  regionId: string;
  description: string;
  level: string;
  isClubMatch: boolean;
  clubId: string;
}

export function useClubMatches(): ClubMatchEvent[] {
  const { userClubs } = useClubs();

  return useMemo(() => {
    const events: ClubMatchEvent[] = [];

    for (const club of userClubs) {
      const storageKey = `club-page-${club.id}`;
      let blocks: { type: string; data?: { matches?: Record<string, unknown>[] } }[] = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) blocks = JSON.parse(raw) as typeof blocks;
      } catch { continue; }

      for (const block of blocks) {
        if (block.type !== 'matches') continue;
        const matches = block.data?.matches ?? [];

        for (const match of matches) {
          if (!match.date || !match.isHome || match.publishedOnMap === false || match.supabaseEventId) continue;
          const coords = getCoords(club.city);
          const hasScore = match.scoreHome != null && match.scoreAway != null;
          const scoreStr = hasScore ? ` (${match.scoreHome}–${match.scoreAway})` : '';
          const timeStr = match.time ? `T${match.time}:00` : 'T15:00:00';

          events.push({
            id:           `club-match-${club.id}-${match.id}`,
            title:        `${club.name} vs ${match.opponent || '?'}${scoreStr}`,
            sport:        club.sport,
            date:         `${match.date}${timeStr}`,
            city:         club.city,
            venue:        (match.venue as string) || `${club.city} — Domicile`,
            lat:          coords[0],
            lng:          coords[1],
            departmentId: 'finistere',
            regionId:     'brittany',
            description:  match.competition
              ? `${match.teamName || match.category || 'Équipe'} — ${match.competition}`
              : `Match de ${match.teamName || match.category || 'Équipe'} — ${club.name}`,
            level:        'Amateur',
            isClubMatch:  true,
            clubId:       club.id,
          });
        }
      }
    }

    return events;
  }, [userClubs]);
}
