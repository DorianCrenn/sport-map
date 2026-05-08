import { useMemo } from 'react';
import { useClubs } from './useClubs.js';

// Approximate coords for Finistère cities
const CITY_COORDS = {
  brest:           [48.3904, -4.4861],
  quimper:         [47.9961, -4.0968],
  morlaix:         [48.5778, -3.8272],
  landerneau:      [48.4527, -4.2505],
  douarnenez:      [48.0938, -4.3346],
  concarneau:      [47.8717, -3.9189],
  châteaulin:      [48.1958, -4.0863],
  chateaulin:      [48.1958, -4.0863],
  carhaix:         [48.2762, -3.5762],
  'saint-pol-de-léon': [48.6836, -3.9855],
  'pont-l\'abbé':  [47.8654, -4.2193],
  pontlabbé:       [47.8654, -4.2193],
  plabennec:       [48.4729, -4.4275],
  lesneven:        [48.5734, -4.3252],
  landivisiau:     [48.5082, -4.0666],
  quimperlé:       [47.8719, -3.5494],
  brest:           [48.3904, -4.4861],
};

function getCoords(city) {
  if (!city) return null;
  const key = city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    const normalizedKey = k.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (key === normalizedKey || key.includes(normalizedKey) || normalizedKey.includes(key)) {
      return v;
    }
  }
  // Default to Finistère center if not found
  return [48.2, -4.1];
}

export function useClubMatches() {
  const { userClubs } = useClubs();

  const clubMatchEvents = useMemo(() => {
    const events = [];

    for (const club of userClubs) {
      const storageKey = `club-page-${club.id}`;
      let blocks = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) blocks = JSON.parse(raw);
      } catch { continue; }

      for (const block of blocks) {
        if (block.type !== 'matches') continue;
        const matches = block.data?.matches ?? [];

        for (const match of matches) {
          if (!match.date || !match.isHome || match.publishedOnMap === false) continue;
          const coords = getCoords(club.city);
          const hasScore = match.scoreHome !== null && match.scoreHome !== undefined &&
                           match.scoreAway !== null && match.scoreAway !== undefined;
          const scoreStr = hasScore ? ` (${match.scoreHome}–${match.scoreAway})` : '';
          const timeStr = match.time ? `T${match.time}:00` : 'T15:00:00';

          events.push({
            id: `club-match-${club.id}-${match.id}`,
            title: `${club.name} vs ${match.opponent || '?'}${scoreStr}`,
            sport: club.sport,
            date: `${match.date}${timeStr}`,
            city: club.city,
            venue: `${club.city} — Domicile`,
            lat: coords[0],
            lng: coords[1],
            departmentId: 'finistere',
            regionId: 'brittany',
            description: match.competition
              ? `${match.category} — ${match.competition}`
              : `Match de ${match.category} — ${club.name}`,
            level: 'Amateur',
            isClubMatch: true,
            clubId: club.id,
          });
        }
      }
    }

    return events;
  }, [userClubs]);

  return clubMatchEvents;
}
