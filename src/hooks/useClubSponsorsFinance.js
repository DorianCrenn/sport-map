import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Hook réservé aux rôles superadmin/admin.
 * Retourne les données financières des sponsors d'un club.
 * La RLS PostgreSQL bloque automatiquement les accès non-autorisés.
 */
export function useClubSponsorsFinance(clubId) {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase
      .from('club_sponsors')
      .select('id, sponsor_name, tier, contract_value, contract_notes, valid_from, valid_until, created_at')
      .eq('club_id', String(clubId))
      .order('tier')
      .order('created_at')
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setSponsors(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clubId]);

  const total = sponsors.reduce((acc, s) => acc + (s.contract_value ?? 0), 0);

  return { sponsors, loading, error, totalContractValue: total };
}
