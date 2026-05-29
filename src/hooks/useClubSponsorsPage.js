import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const TIER_ORDER = { gold: 0, silver: 1, bronze: 2, partner: 3 };

export function useClubSponsorsPage(clubId) {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from('club_sponsors')
      .select('id, sponsor_name, tier, logo_url, logo_white_url, website_url, display_order, show_in_poster')
      .eq('club_id', String(clubId))
      .eq('page_visible', true)
      .or(`valid_until.is.null,valid_until.gte.${today}`)
      .or(`valid_from.is.null,valid_from.lte.${today}`)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const sorted = [...data].sort(
          (a, b) =>
            (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3) ||
            (a.display_order ?? 0) - (b.display_order ?? 0)
        );
        setSponsors(sorted.map(row => ({
          id:            row.id,
          name:          row.sponsor_name,
          logo:          row.logo_url        ?? '',
          logoWhite:     row.logo_white_url  ?? '',
          url:           row.website_url     ?? '',
          tier:          row.tier             ?? 'partner',
          showInPoster:  row.show_in_poster  ?? true,
        })));
      });
    return () => { cancelled = true; };
  }, [clubId]);

  return sponsors;
}
