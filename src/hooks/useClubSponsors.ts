import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import type { SponsorFeedItem } from '../components/feed/feed.types';

export function useClubSponsors(clubIds: string[]) {
  const [sponsors, setSponsors] = useState<SponsorFeedItem[]>([]);

  const clubKey = clubIds.join(',');

  useEffect(() => {
    if (!clubKey) return;
    supabase
      .from('club_sponsors')
      .select('id, club_id, sponsor_name, logo_url, bg_color, tagline, cta_label, cta_url, created_at')
      .in('club_id', clubIds)
      .eq('active', true)
      .then(({ data }) => {
        setSponsors((data ?? []).map((row: any) => ({
          id:           row.id,
          type:         'sponsor' as const,
          club_id:      row.club_id,
          created_at:   row.created_at,
          sponsor_id:   row.id,
          sponsor_name: row.sponsor_name,
          logo_url:     row.logo_url,
          bg_color:     row.bg_color ?? '#111827',
          tagline:      row.tagline ?? '',
          cta_label:    row.cta_label,
          cta_url:      row.cta_url,
        })));
      });
  }, [clubKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { sponsors };
}
