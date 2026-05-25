// ─────────────────────────────────────────────────────────────────────────────
// useWeekendPosters.ts
// Lit les matchs du club depuis localStorage et retourne ceux du week-end
// prochain, enrichis avec les données d'affiche prêtes à rendre.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
// @ts-expect-error — JS non typé, migration progressive
import { useClubs } from './useClubs.js';
import type { WeekendMatch, RawMatch, PosterData, Club } from '../types/sportlink.js';

// ── Constantes ────────────────────────────────────────────────────────────────

/** Couleur d'accentuation par sport (reprend la palette de getSportMeta) */
const SPORT_ACCENT: Record<string, string> = {
  football: '#16a34a',
  foot:     '#16a34a',
  soccer:   '#16a34a',
  basket:   '#EA580C',
  basketball: '#EA580C',
  handball: '#2563EB',
  hand:     '#2563EB',
  volleyball: '#7C3AED',
  volley:   '#7C3AED',
  tennis:   '#C0542A',
  rugby:    '#DC2626',
  padel:    '#0EA5E9',
  squash:   '#0EA5E9',
  badminton:'#10B981',
};

/** Fond animé (BG_PRESETS, gratuit) mappé par sport — choisi pour être coloré et accrocheur */
const SPORT_BG_PRESET: Record<string, string> = {
  football:   'ignite',
  foot:       'ignite',
  soccer:     'ignite',
  basket:     'concrete-jungle',
  basketball: 'concrete-jungle',
  handball:   'abstract-force',
  hand:       'abstract-force',
  volleyball: 'golden-hour',
  volley:     'golden-hour',
  tennis:     'golden-hour',
  rugby:      'raw-power',
  padel:      'abstract-force',
  squash:     'abstract-force',
  badminton:  'ignite',
};

/** Template assigné par défaut selon le sport. Peut être overridé via club brand kit. */
const SPORT_DEFAULT_TEMPLATE: Record<string, string> = {
  football: 'simple',
  basket:   'neon',
  handball: 'color',
  volley:   'pulse',
  tennis:   'elegant',
  rugby:    'impact',
  padel:    'glass',
  default:  'simple',
};

// ── Utilitaires ───────────────────────────────────────────────────────────────

function getAccent(sport: string): string {
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_ACCENT)) {
    if (key.includes(k)) return v;
  }
  return '#3b82f6';
}

function getTemplate(sport: string): string {
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_DEFAULT_TEMPLATE)) {
    if (key.includes(k)) return v;
  }
  return SPORT_DEFAULT_TEMPLATE.default;
}

function getBgPreset(sport: string): string {
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_BG_PRESET)) {
    if (key.includes(k)) return v;
  }
  return 'golden-hour';
}

/**
 * Calcule la plage samedi-dimanche du prochain week-end.
 * Si on est déjà samedi ou dimanche, on prend le week-end en cours.
 */
function getWeekendRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=dimanche … 6=samedi

  // Jours à ajouter pour atteindre le prochain samedi
  // Si on est samedi (6) → 0, dimanche (0) → 6, lundi (1) → 5, etc.
  const daysToSat = day === 6 ? 0 : day === 0 ? 6 : 6 - day;

  const sat = new Date(now);
  sat.setDate(now.getDate() + daysToSat);
  sat.setHours(0, 0, 0, 0);

  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);

  return { start: sat, end: sun };
}

// ── Hook principal ────────────────────────────────────────────────────────────

/**
 * Retourne les matchs à domicile du week-end prochain pour tous les clubs
 * de l'utilisateur, avec les données d'affiche calculées.
 *
 * Source : localStorage `club-page-{clubId}` → blocs type "matches"
 */
export function useWeekendPosters(): WeekendMatch[] {
  // @ts-expect-error — useClubs retourne un objet JS non typé
  const { userClubs } = useClubs() as { userClubs: Club[] };

  return useMemo(() => {
    const { start, end } = getWeekendRange();
    const matches: WeekendMatch[] = [];

    for (const club of userClubs) {
      // Lecture des blocs du club depuis localStorage
      let blocks: { type: string; data?: { matches?: RawMatch[] } }[] = [];
      try {
        const raw = localStorage.getItem(`club-page-${club.id}`);
        if (raw) blocks = JSON.parse(raw);
      } catch {
        continue;
      }

      for (const block of blocks) {
        if (block.type !== 'matches') continue;
        const rawMatches: RawMatch[] = block.data?.matches ?? [];

        for (const m of rawMatches) {
          // Seuls les matchs à domicile avec une date sont pris en compte
          if (!m.date || !m.isHome) continue;

          const matchDate = new Date(
            `${m.date}T${m.time ? `${m.time}:00` : '15:00:00'}`
          );

          // Filtre : seulement le week-end à venir
          if (matchDate < start || matchDate > end) continue;

          const sport = club.sport || 'football';
          const accentColor = getAccent(sport);
          const bgPresetId = getBgPreset(sport);
          const logoUrl = club.logo_url || club.logoUrl || '';

          const posterData: PosterData = {
            event: {
              date: matchDate.toISOString(),
              sport,
              venue: m.venue ?? club.city,
              city: club.city,
              homeOrAway: 'home',
            },
            homeTeam: { name: club.name, logo: logoUrl },
            awayTeam: { name: m.opponent || 'Adversaire', logo: '' },
            championship: m.competition ?? '',
            tagline: 'Venez nombreux ! 💪',
            accentColor,
          };

          matches.push({
            id: `${club.id}-${m.id}`,
            clubId: club.id,
            category: m.category || m.teamName || 'Équipe',
            homeTeam: { name: club.name, logo: logoUrl },
            awayTeam: { name: m.opponent || 'Adversaire', logo: '' },
            date: matchDate,
            time: m.time,
            venue: m.venue ?? club.city,
            competition: m.competition ?? '',
            sport,
            templateId: getTemplate(sport),
            bgPresetId,
            posterData,
          });
        }
      }
    }

    // Tri chronologique
    return matches.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [userClubs]);
}

// ── Données mockées (tests & développement) ───────────────────────────────────

/**
 * Jeu de données réaliste avec des clubs bretons du Finistère.
 * Usage : `<WeekendPosters matches={MOCK_WEEKEND_MATCHES} />`
 *
 * Les dates sont calculées dynamiquement pour pointer sur le prochain week-end.
 */
export function getMockWeekendMatches(): WeekendMatch[] {
  const { start } = getWeekendRange();
  const sat = new Date(start);
  const sun = new Date(start);
  sun.setDate(sat.getDate() + 1);

  // Helpers pour construire une date ISO propre
  const isoAt = (base: Date, h: number, m: number) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m).toISOString();

  const makeMatch = (
    id: string,
    category: string,
    home: { name: string; logo?: string },
    away: { name: string },
    base: Date,
    h: number,
    mn: number,
    venue: string,
    competition: string,
    sport: string,
    templateId: string,
    accentColor: string,
    tagline: string,
    bgPresetId?: string
  ): WeekendMatch => {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, mn);
    const time = `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
    return {
      id,
      clubId: `mock-${id}`,
      category,
      homeTeam: home,
      awayTeam: away,
      date,
      time,
      venue,
      competition,
      sport,
      templateId,
      bgPresetId: bgPresetId ?? getBgPreset(sport),
      posterData: {
        event: { date: isoAt(base, h, mn), sport, venue, city: venue.split(',').pop()?.trim(), homeOrAway: 'home' },
        homeTeam: home,
        awayTeam: away,
        championship: competition,
        tagline,
        accentColor,
      },
    };
  };

  return [
    makeMatch(
      'plouvorn-senior-a', 'Senior A',
      { name: 'FC Plouvorn' }, { name: 'Landivisiau FC' },
      sat, 15, 0,
      'Stade Ar Vrug, Plouvorn',
      'District Brest Iroise · D3',
      'football', 'simple', '#16a34a',
      'Venez nombreux nous soutenir ! 💪',
      'ignite'
    ),
    makeMatch(
      'saint-renan-u18', 'U18',
      { name: 'ES Saint-Renan' }, { name: 'Plougastel SC' },
      sat, 11, 0,
      'Stade du Vallon, Saint-Renan',
      'Ligue Bretagne · U18 Régional 2',
      'football', 'neon', '#00F5FF',
      'Allez les jeunes ! 🔥',
      'golden-hour'
    ),
    makeMatch(
      'lannilis-senior-b', 'Senior B',
      { name: 'US Lannilis' }, { name: 'FC Plouguerneau' },
      sun, 10, 30,
      'Terrain du Bourg, Lannilis',
      'District Brest Iroise · D5',
      'football', 'cinema', '#D4AF37',
      'Cap sur la victoire ! 🏆',
      'raw-power'
    ),
    makeMatch(
      'brest-basket-u15', 'U15 Féminines',
      { name: 'Brest BB' }, { name: 'Quimper Basket' },
      sat, 14, 0,
      'Gymnase Kerichen, Brest',
      'Ligue Bretagne · U15 F Régional',
      'basket', 'color', '#EA580C',
      'En route pour la victoire ! 🏀',
      'concrete-jungle'
    ),
  ];
}
