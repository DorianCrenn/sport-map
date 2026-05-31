import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Fetches sponsors from clubs on the Elite plan.
 * These sponsors are shown in the global "Tous" matches tab — visible to all users.
 * Only active subscriptions (status = 'active' | 'trialing') with plan = 'elite' qualify.
 */
export function useEliteSponsors() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Find elite club IDs from active subscriptions
      const { data: subs } = await supabase
        .from('club_subscriptions')
        .select('club_id')
        .eq('plan', 'elite')
        .in('status', ['active', 'trialing']);

      if (!subs || subs.length === 0) {
        if (!cancelled) { setSponsors([]); setLoading(false); }
        return;
      }

      const clubIds = subs.map(s => String(s.club_id));

      const { data } = await supabase
        .from('club_sponsors')
        .select('id, club_id, sponsor_name, logo_url, bg_color, tagline, cta_label, cta_url, clubs(name)')
        .in('club_id', clubIds)
        .eq('active', true)
        .limit(20);

      if (!cancelled) {
        setSponsors(data ?? []);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { sponsors, loading };
}
