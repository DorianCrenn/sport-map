/**
 * useFeaturedEvents — Événements "À la Une" promus par les clubs.
 *
 * Fonctionnement :
 *   1. Charge les featured_events actifs (starts_at ≤ now ≤ ends_at) depuis Supabase.
 *   2. Trie par plan (elite > pro > starter) puis par priorité.
 *   3. Applique une rotation déterministe toutes les ROTATION_MS : tous les
 *      utilisateurs voient la même "tranche" au même instant, garantissant
 *      une visibilité équitable entre clubs.
 *   4. Respecte maxVisible pour ne pas saturer le feed.
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import type { FeaturedFeedItem, FeaturedPlan } from '../components/feed/feed.types';

// ── Constantes de rotation ─────────────────────────────────────────────────────

/** Nb max d'événements À la Une visibles simultanément dans le feed */
const MAX_VISIBLE = 3;

/** Durée d'une tranche de rotation — synchronisée entre tous les utilisateurs */
const ROTATION_MS = 5 * 60_000; // 5 minutes

/** Rang numérique des plans pour le tri descendant */
const PLAN_RANK: Record<FeaturedPlan, number> = { elite: 3, pro: 2, starter: 1 };

// ── Types internes ────────────────────────────────────────────────────────────

interface UseFeaturedEventsOptions {
  /**
   * Si renseigné, filtre les featured par clubs suivis.
   * Si vide, remonte TOUS les événements mis en avant (feed public/discovery).
   */
  clubIds?: string[];
  /** Surcharge du nombre max visible (défaut : MAX_VISIBLE = 3) */
  maxVisible?: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFeaturedEvents({
  clubIds = [],
  maxVisible = MAX_VISIBLE,
}: UseFeaturedEventsOptions = {}): {
  items: FeaturedFeedItem[];
  loading: boolean;
} {
  const [raw, setRaw]       = useState<FeaturedFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  /** Tranche courante — se met à jour à chaque nouveau slot de 5 min */
  const [tick, setTick] = useState(() => Math.floor(Date.now() / ROTATION_MS));

  // ── Chargement Supabase ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const now = new Date().toISOString();

      let query = supabase
        .from('featured_events')
        .select(`
          id,
          club_id,
          plan,
          priority,
          starts_at,
          events:event_id (
            id, title, date, sport, venue, city, team_name, adversaire, home_or_away
          ),
          clubs:club_id ( name )
        `)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('priority', { ascending: false })
        .limit(50);

      // Optionnel : restreindre aux clubs suivis par l'utilisateur
      if (clubIds.length > 0) {
        query = query.in('club_id', clubIds.map(String));
      }

      const { data, error } = await query;
      if (cancelled || error || !data) {
        if (!cancelled) setLoading(false);
        return;
      }

      const items: FeaturedFeedItem[] = (data as any[])
        .filter(row => row.events && row.clubs)
        .map(row => {
          const ev = row.events;
          const d  = new Date(ev.date ?? '');
          const pad = (n: number) => String(n).padStart(2, '0');
          return {
            id:          `feat-${row.id}`,
            type:        'featured' as const,
            club_id:     String(row.club_id),
            created_at:  row.starts_at,
            featured_id: row.id,
            event_id:    ev.id,
            club_name:   row.clubs?.name ?? '',
            plan:        row.plan as FeaturedPlan,
            title:       ev.title    ?? '',
            date:        (ev.date as string | undefined)?.slice(0, 10) ?? '',
            time:        `${pad(d.getHours())}:${pad(d.getMinutes())}`,
            sport:       ev.sport    ?? '',
            venue:       ev.venue    ?? undefined,
            city:        ev.city     ?? undefined,
            poster_url:  undefined,
            home_team:   ev.team_name  ?? undefined,
            away_team:   ev.adversaire ?? undefined,
          };
        });

      // Tri : plan le plus élevé d'abord, puis priority décroissant
      items.sort((a, b) => PLAN_RANK[b.plan] - PLAN_RANK[a.plan]);

      if (!cancelled) {
        setRaw(items);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubIds.join(',')]);

  // ── Minuterie de rotation ────────────────────────────────────────────────────
  // Se déclenche exactement au prochain slot de ROTATION_MS, pas toutes les 5 min
  // depuis maintenant — synchronisation garantie entre tous les clients.
  useEffect(() => {
    const msUntilNextSlot = ROTATION_MS - (Date.now() % ROTATION_MS);
    const timer = setTimeout(() => {
      setTick(Math.floor(Date.now() / ROTATION_MS));
    }, msUntilNextSlot);
    return () => clearTimeout(timer);
  }, [tick]);

  // ── Sélection avec rotation circulaire déterministe ──────────────────────────
  const items = useMemo<FeaturedFeedItem[]>(() => {
    if (raw.length === 0) return [];
    const offset = tick % raw.length;
    // Fenêtre glissante : commence à offset, boucle en tête si besoin
    return [
      ...raw.slice(offset),
      ...raw.slice(0, offset),
    ].slice(0, maxVisible);
  }, [raw, tick, maxVisible]);

  return { items, loading };
}
