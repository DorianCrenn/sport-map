// ─────────────────────────────────────────────────────────────────────────────
// useWeekendPosters.ts
// Lit les matchs du club depuis localStorage et retourne ceux du week-end
// prochain, enrichis avec les données d'affiche prêtes à rendre.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useManagedClubs } from './useManagedClubs.js';
import { supabase } from '../lib/supabase.js';
import type { WeekendMatch, PosterData } from '../types/sportlink.js';

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

/** Template pour les affiches week-end — glass s'adapte parfaitement à n'importe quel fond photo */
const SPORT_DEFAULT_TEMPLATE: Record<string, string> = {
  default: 'glass',
};

// ── Utilitaires ───────────────────────────────────────────────────────────────

function getAccent(sport: string): string {
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_ACCENT)) {
    if (key.includes(k)) return v;
  }
  return '#3b82f6';
}

function getTemplate(_sport: string): string {
  return 'glass';
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
 * gérés par l'utilisateur, avec les données d'affiche calculées.
 *
 * Source : table Supabase `events` (filtrée par club_id + date + home_or_away)
 */
export function useWeekendPosters(): WeekendMatch[] {
  const { managedClubs } = useManagedClubs() as { managedClubs: { id: string; name: string; sport?: string; city?: string; logo_url?: string; logoUrl?: string }[] };
  const [matches, setMatches] = useState<WeekendMatch[]>([]);

  useEffect(() => {
    if (!managedClubs?.length) { setMatches([]); return; }
    let cancelled = false;

    const clubIds = managedClubs.map(c => String(c.id));
    const { start, end } = getWeekendRange();
    const startIso = start.toISOString().slice(0, 10);
    const endIso   = end.toISOString().slice(0, 10);

    supabase
      .from('events')
      .select('id, title, date, sport, venue, city, team_name, adversaire, home_or_away, club_id')
      .in('club_id', clubIds)
      .gte('date', startIso)
      .lte('date', endIso)
      .eq('home_or_away', 'home')
      .order('date')
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;

        const result: WeekendMatch[] = data.map(ev => {
          const club = managedClubs.find(c => String(c.id) === String(ev.club_id));
          const sport = ev.sport || club?.sport || 'football';
          const clubName = club?.name ?? ev.city ?? '?';
          const logoUrl  = club?.logo_url ?? club?.logoUrl ?? '';
          const accentColor = getAccent(sport);
          const bgPresetId  = getBgPreset(sport);

          const matchDate = new Date(
            `${ev.date}T${ev.date.length === 10 ? '15:00:00' : ''}`
          );
          const time = ev.date.length > 10 ? ev.date.slice(11, 16) : '15:00';

          const posterData: PosterData = {
            event: {
              date: matchDate.toISOString(),
              sport,
              venue: ev.venue ?? ev.city,
              city: ev.city ?? club?.city,
              homeOrAway: 'home',
            },
            homeTeam: { name: clubName, logo: logoUrl },
            awayTeam: { name: ev.adversaire || 'Adversaire', logo: '' },
            championship: '',
            tagline: 'Venez nombreux ! 💪',
            accentColor,
          };

          return {
            id: String(ev.id),
            clubId: String(ev.club_id),
            category: ev.team_name || 'Équipe',
            homeTeam: { name: clubName, logo: logoUrl },
            awayTeam: { name: ev.adversaire || 'Adversaire', logo: '' },
            date: matchDate,
            time,
            venue: ev.venue ?? ev.city ?? '',
            competition: '',
            sport,
            templateId: getTemplate(sport),
            bgPresetId,
            posterData,
          };
        });

        setMatches(result);
      },
        () => { /* silently fail */ }
      );

    return () => { cancelled = true; };
  }, [managedClubs]);

  return matches;
}

// ── Données mockées (DEV seulement) ──────────────────────────────────────────

/**
 * @deprecated — DEV uniquement. Ne pas appeler en production.
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
      'football', 'glass', '#16a34a',
      'Venez nombreux nous soutenir ! 💪',
      'ignite'
    ),
    makeMatch(
      'brest-basket-u15', 'U15 Féminines',
      { name: 'Brest BB' }, { name: 'Quimper Basket' },
      sat, 14, 0,
      'Gymnase Kerichen, Brest',
      'Ligue Bretagne · U15 F Régional',
      'basket', 'neon', '#EA580C',
      'En route pour la victoire ! 🏀',
      'concrete-jungle'
    ),
    makeMatch(
      'brest-handball-senior', 'Senior Masculin',
      { name: 'Brest HB' }, { name: 'Lorient HB' },
      sat, 18, 0,
      'Salle Pen Ar Creac\'h, Brest',
      'Nationale 3 · Poule Bretagne',
      'handball', 'editorial', '#2563EB',
      'Tous ensemble pour la victoire ! 🤾',
      'abstract-force'
    ),
    makeMatch(
      'stade-brestois-rugby', 'Seniors',
      { name: 'SB Rugby' }, { name: 'RC Vannes B' },
      sun, 15, 0,
      'Stade Francis-Le Blé, Brest',
      'Fédérale 3 · Poule Ouest',
      'rugby', 'aurora', '#DC2626',
      'On lâche rien jusqu\'au bout ! 🏉',
      'raw-power'
    ),
  ];
}
