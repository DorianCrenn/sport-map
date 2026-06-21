import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const TIER_ORDER: Record<string, number> = { gold: 0, silver: 1, bronze: 2, partner: 3 };

export interface SponsorCard {
  id:          string;
  name:        string;
  logo:        string;
  logoWhite:   string;
  url:         string;
  tier:        string;
  showInPoster: boolean;
}

export function useClubSponsorsPage(clubId: string | null | undefined): SponsorCard[] {
  const [sponsors, setSponsors] = useState<SponsorCard[]>([]);

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
      .then(({ data }: { data: { id: string; sponsor_name?: string; tier?: string; logo_url?: string | null; logo_white_url?: string | null; website_url?: string | null; display_order?: number | null; show_in_poster?: boolean | null }[] | null }) => {
        if (cancelled || !data) return;
        const sorted = [...data].sort(
          (a, b) => (TIER_ORDER[a.tier ?? 'partner'] ?? 3) - (TIER_ORDER[b.tier ?? 'partner'] ?? 3) || (a.display_order ?? 0) - (b.display_order ?? 0),
        );
        setSponsors(sorted.map(row => ({
          id: row.id, name: row.sponsor_name ?? '', logo: row.logo_url ?? '', logoWhite: row.logo_white_url ?? '',
          url: row.website_url ?? '', tier: row.tier ?? 'partner', showInPoster: row.show_in_poster ?? true,
        })));
      });
    return () => { cancelled = true; };
  }, [clubId]);

  return sponsors;
}
