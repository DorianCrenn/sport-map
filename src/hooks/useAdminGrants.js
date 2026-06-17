import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export const GRANT_PRESETS = [
  { label: '1 mois gratuit',    months: 1,    plan: 'pro',   type: 'manual' },
  { label: '3 mois gratuits',   months: 3,    plan: 'pro',   type: 'manual' },
  { label: '6 mois gratuits',   months: 6,    plan: 'pro',   type: 'manual' },
  { label: '12 mois gratuits',  months: 12,   plan: 'pro',   type: 'manual' },
  { label: 'Elite 1 mois',      months: 1,    plan: 'elite', type: 'manual' },
  { label: 'Elite 3 mois',      months: 3,    plan: 'elite', type: 'manual' },
  { label: 'Pro à vie',         months: null, plan: 'pro',   type: 'lifetime' },
  { label: 'Elite à vie',       months: null, plan: 'elite', type: 'lifetime' },
  { label: 'Partenaire Pro',    months: 12,   plan: 'pro',   type: 'partner' },
  { label: 'Partenaire Elite',  months: 12,   plan: 'elite', type: 'partner' },
];

const PLAN_BADGE = {
  starter: { label: 'Starter', color: '#3b82f6' },
  pro:     { label: 'Club Pro', color: '#8b5cf6' },
  elite:   { label: 'Elite',   color: '#f59e0b' },
};

export function useAdminGrants(clubId = null) {
  const { currentUser, isAdmin } = useAuth();
  const [grants,  setGrants]  = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGrants = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    let query = supabase
      .from('admin_grants')
      .select(`
        id, club_id, plan, reason, grant_type,
        granted_at, starts_at, ends_at,
        revoked_at, revoke_reason,
        granted_by, revoked_by,
        clubs:club_id ( name, logo_url, sport )
      `)
      .order('granted_at', { ascending: false });

    if (clubId) query = query.eq('club_id', String(clubId));

    const { data, error } = await query.limit(500);
    if (error) console.error('[AdminGrants] fetch:', error.message);
    setGrants(data ?? []);
    setLoading(false);
  }, [isAdmin, clubId]);

  useEffect(() => { fetchGrants(); }, [fetchGrants]);

  // ── Créer un grant ────────────────────────────────────────────────────────

  const createGrant = useCallback(async ({
    club_id, plan, reason, grant_type = 'manual', months = null, starts_at = null,
  }) => {
    if (!isAdmin) throw new Error('admin_required');

    const startsAt = starts_at ?? new Date().toISOString();
    let endsAt = null;
    if (months !== null) {
      const d = new Date(startsAt);
      d.setMonth(d.getMonth() + months);
      endsAt = d.toISOString();
    }

    const { data, error } = await supabase
      .from('admin_grants')
      .insert({
        club_id: String(club_id),
        plan,
        reason,
        grant_type,
        granted_by: currentUser.id,
        starts_at:  startsAt,
        ends_at:    endsAt,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await fetchGrants();
    return data;
  }, [isAdmin, currentUser?.id, fetchGrants]);

  // ── Révoquer un grant ─────────────────────────────────────────────────────

  const revokeGrant = useCallback(async (grantId, revoke_reason = '') => {
    if (!isAdmin) throw new Error('admin_required');
    const { error } = await supabase
      .from('admin_grants')
      .update({
        revoked_at:    new Date().toISOString(),
        revoked_by:    currentUser.id,
        revoke_reason: revoke_reason || null,
      })
      .eq('id', grantId);
    if (error) throw new Error(error.message);
    setGrants(prev => prev.map(g =>
      g.id === grantId ? { ...g, revoked_at: new Date().toISOString(), revoke_reason } : g
    ));
  }, [isAdmin, currentUser?.id]);

  // ── Grants actifs pour un club ─────────────────────────────────────────────

  const activeGrants = grants.filter(g => {
    if (g.revoked_at) return false;
    const now = new Date();
    if (g.starts_at && new Date(g.starts_at) > now) return false;
    if (g.ends_at && new Date(g.ends_at) <= now) return false;
    return true;
  });

  return {
    grants,
    activeGrants,
    loading,
    createGrant,
    revokeGrant,
    refetch: fetchGrants,
    PLAN_BADGE,
  };
}
