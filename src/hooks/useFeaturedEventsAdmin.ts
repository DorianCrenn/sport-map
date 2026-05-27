/**
 * useFeaturedEventsAdmin — CRUD pour la gestion des événements "À la Une" côté club admin.
 *
 * Expose :
 *   active   : événements mis en avant actifs ou futurs du club
 *   promote  : créer une nouvelle mise en avant
 *   cancel   : retirer une mise en avant existante
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import type { FeaturedPlan } from '../components/feed/feed.types';
import { PLAN_CONFIG } from '../components/feed/feed.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActiveFeatured {
  id:          string;
  event_id:    string;
  plan:        FeaturedPlan;
  starts_at:   string;
  ends_at:     string;
  priority:    number;
  event_title?: string;
  event_date?:  string;
  event_sport?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFeaturedEventsAdmin(clubId: string) {
  const [active,  setActive]  = useState<ActiveFeatured[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Chargement des featured actifs + futurs du club ──────────────────────
  const load = useCallback(async () => {
    if (!clubId) return;
    const now = new Date().toISOString();
    const { data, error: err } = await supabase
      .from('featured_events')
      .select(`
        id, event_id, plan, starts_at, ends_at, priority,
        events:event_id ( title, date, sport )
      `)
      .eq('club_id', clubId)
      .gte('ends_at', now)
      .order('starts_at', { ascending: false });

    if (err) { setError(err.message); return; }

    setActive((data ?? []).map((row: any) => ({
      id:          row.id,
      event_id:    row.event_id,
      plan:        row.plan as FeaturedPlan,
      starts_at:   row.starts_at,
      ends_at:     row.ends_at,
      priority:    row.priority,
      event_title: row.events?.title,
      event_date:  row.events?.date,
      event_sport: row.events?.sport,
    })));
    setLoading(false);
  }, [clubId]);

  useEffect(() => { load(); }, [load]);

  // ── Créer une mise en avant ───────────────────────────────────────────────
  const promote = useCallback(async (
    eventId:  string,
    plan:     FeaturedPlan,
    endsAt:   string,   // ISO 8601
    priority = 0,
  ): Promise<void> => {
    setSaving(true);
    setError(null);

    // Vérifier la limite du plan
    const limit = PLAN_CONFIG[plan].maxFeatured;
    const currentCount = active.filter(f => f.plan === plan).length;
    if (currentCount >= limit) {
      setError(`Limite atteinte pour le plan ${PLAN_CONFIG[plan].label} (${limit} max).`);
      setSaving(false);
      return;
    }

    const { error: err } = await supabase.from('featured_events').insert({
      event_id:  eventId,
      club_id:   clubId,
      plan,
      ends_at:   endsAt,
      priority,
    });

    if (err) setError(err.message);
    else await load();

    setSaving(false);
  }, [clubId, active, load]);

  // ── Retirer une mise en avant ─────────────────────────────────────────────
  const cancel = useCallback(async (featuredId: string): Promise<void> => {
    setSaving(true);
    const { error: err } = await supabase
      .from('featured_events')
      .delete()
      .eq('id', featuredId);

    if (err) setError(err.message);
    else setActive(prev => prev.filter(f => f.id !== featuredId));

    setSaving(false);
  }, []);

  return { active, loading, saving, error, promote, cancel, reload: load };
}
