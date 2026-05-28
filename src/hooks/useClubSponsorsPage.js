import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const TIER_ORDER = { gold: 0, silver: 1, bronze: 2, partner: 3 };

/**
 * Retourne les sponsors d'un club visibles sur la page club (page_visible = true),
 * mappés au format attendu par SponsorsBlockView / SponsorLogo.
 */
export function useClubSponsorsPage(clubId) {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    supabase
      .from('club_sponsors')
      .select('id, sponsor_name, tier, logo_url, website_url')
      .eq('club_id', String(clubId))
      .eq('page_visible', true)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const sorted = [...data].sort(
          (a, b) => (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3)
        );
        setSponsors(sorted.map(row => ({
          id:   row.id,
          name: row.sponsor_name,
          logo: row.logo_url   ?? '',
          url:  row.website_url ?? '',
          tier: row.tier        ?? 'partner',
        })));
      });
    return () => { cancelled = true; };
  }, [clubId]);

  return sponsors;
}
