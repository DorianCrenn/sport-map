import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import type { SportLinkClub } from '../types/sportlink.js';

type DBRow = Record<string, unknown>;

function mapClub(row: DBRow | null): SportLinkClub | null {
  if (!row) return null;
  return {
    id:            String(row.id),
    name:          (row.name as string) ?? '',
    sport:         (row.sport as string) ?? '',
    city:          (row.city as string)          ?? '',
    description:   (row.description as string)   ?? '',
    logoUrl:       (row.logo_url as string | null) ?? null,
    logo:          (row.logo_url as string | null) ?? null,
    website:       (row.website as string)       ?? '',
    phone:         (row.phone as string)         ?? '',
    email:         (row.email as string)         ?? '',
    categories:    (row.categories as SportLinkClub['categories']) ?? [],
    userId:        row.user_id as string,
    isUserCreated: row.user_id != null,
  } as SportLinkClub;
}

export function useClubById(clubId: string | null | undefined): { club: SportLinkClub | null; loading: boolean } {
  const [club, setClub]       = useState<SportLinkClub | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) { setClub(null); return; }
    let cancelled = false;
    setLoading(true);

    supabase
      .from('clubs')
      .select('id, name, sport, city, description, logo_url, website, phone, email, categories, user_id')
      .eq('id', String(clubId))
      .maybeSingle()
      .then(
        ({ data, error }: { data: DBRow | null; error: { message: string } | null }) => {
          if (cancelled) return;
          if (!error) setClub(mapClub(data));
          setLoading(false);
        },
        () => { if (!cancelled) setLoading(false); }
      );

    return () => { cancelled = true; };
  }, [clubId]);

  return { club, loading };
}
