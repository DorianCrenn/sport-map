import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export interface EliteSponsor {
  id:           string;
  club_id:      string;
  sponsor_name: string;
  logo_url?:    string | null;
  bg_color?:    string | null;
  tagline?:     string | null;
  cta_label?:   string | null;
  cta_url?:     string | null;
  clubs?:       { name?: string } | null;
  [key: string]: unknown;
}

export function useEliteSponsors(): { sponsors: EliteSponsor[]; loading: boolean } {
  const [sponsors, setSponsors] = useState<EliteSponsor[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: subs } = await supabase
        .from('club_subscriptions')
        .select('club_id')
        .eq('plan', 'elite')
        .in('status', ['active', 'trialing']) as { data: { club_id: string }[] | null };

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
        .limit(20) as { data: EliteSponsor[] | null };

      if (!cancelled) { setSponsors(data ?? []); setLoading(false); }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { sponsors, loading };
}
