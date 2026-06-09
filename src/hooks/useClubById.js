import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

function mapClub(row) {
  if (!row) return null;
  return {
    id:            row.id,
    name:          row.name,
    sport:         row.sport,
    city:          row.city          ?? '',
    description:   row.description   ?? '',
    logoUrl:       row.logo_url      ?? null,
    logo:          row.logo_url      ?? null,
    website:       row.website       ?? '',
    phone:         row.phone         ?? '',
    email:         row.email         ?? '',
    categories:    row.categories    ?? [],
    userId:        row.user_id,
    isUserCreated: true,
  };
}

/**
 * Charge un club par son ID depuis Supabase.
 * Remplace l'appel direct supabase.from('clubs') dans App.jsx (deep-linking).
 */
export function useClubById(clubId) {
  const [club, setClub]       = useState(null);
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
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setClub(mapClub(data));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [clubId]);

  return { club, loading };
}
