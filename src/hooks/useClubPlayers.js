import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useClubPlayers(clubId, teamId = null) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claims, setClaims]   = useState([]);

  const clubIdStr = String(clubId ?? '');

  // ── Load players ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!clubIdStr) { setPlayers([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    let query = supabase
      .from('club_players')
      .select('id, club_id, team_id, name, number, position, photo_url, email, user_id, is_active')
      .eq('club_id', clubIdStr)
      .eq('is_active', true)
      .order('number', { ascending: true, nullsFirst: false });

    if (teamId) query = query.eq('team_id', teamId);

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('[Players] fetch failed:', error.message);
      setPlayers(data ?? []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [clubIdStr, teamId]);

  // ── Load pending claims (for manager panel) ──────────────────────────────────

  const loadClaims = useCallback(async () => {
    if (!clubIdStr) return;
    const { data, error } = await supabase
      .from('player_claim_requests')
      .select('id, player_id, user_id, type, relation, birth_year, status, created_at, club_players(name, team_id)')
      .in('player_id',
        (await supabase.from('club_players').select('id').eq('club_id', clubIdStr)).data?.map(p => p.id) ?? []
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (!error) setClaims(data ?? []);
  }, [clubIdStr]);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  const addPlayer = useCallback(async (fields) => {
    const { name, number, position, photo_url, email, team_id: tid } = fields;
    if (!name?.trim()) return null;

    const { data, error } = await supabase
      .from('club_players')
      .insert({ club_id: clubIdStr, team_id: tid ?? teamId, name: name.trim(), number: number ?? null, position: position ?? null, photo_url: photo_url ?? null, email: email?.trim().toLowerCase() ?? null })
      .select()
      .single();

    if (error) { console.error('[Players] add failed:', error.message); return null; }
    setPlayers(prev => [...prev, data].sort((a, b) => (a.number ?? 999) - (b.number ?? 999)));
    return data;
  }, [clubIdStr, teamId]);

  const updatePlayer = useCallback(async (id, patch) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    const { error } = await supabase.from('club_players').update(patch).eq('id', id);
    if (error) {
      console.error('[Players] update failed:', error.message);
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...Object.fromEntries(Object.keys(patch).map(k => [k, p[k]])) } : p));
    }
  }, []);

  const removePlayer = useCallback(async (id) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('club_players').update({ is_active: false }).eq('id', id);
    if (error) console.error('[Players] remove failed:', error.message);
  }, []);

  // ── Claim management (manager approves/rejects) ───────────────────────────────

  const approveClaim = useCallback(async (claimId) => {
    const { error } = await supabase
      .from('player_claim_requests')
      .update({ status: 'approved' })
      .eq('id', claimId);
    if (error) { console.error('[Players] approve claim failed:', error.message); return false; }
    setClaims(prev => prev.filter(c => c.id !== claimId));
    return true;
  }, []);

  const rejectClaim = useCallback(async (claimId) => {
    const { error } = await supabase
      .from('player_claim_requests')
      .update({ status: 'rejected' })
      .eq('id', claimId);
    if (error) { console.error('[Players] reject claim failed:', error.message); return false; }
    setClaims(prev => prev.filter(c => c.id !== claimId));
    return true;
  }, []);

  // ── Submit claim (from player/guardian UI) ────────────────────────────────────

  const submitClaim = useCallback(async ({ playerId, type, relation, birthYear, userId }) => {
    const { error } = await supabase
      .from('player_claim_requests')
      .insert({ player_id: playerId, user_id: userId, type, relation: relation ?? null, birth_year: birthYear ?? null });
    if (error) { console.error('[Players] submit claim failed:', error.message); return false; }
    return true;
  }, []);

  return { players, loading, claims, addPlayer, updatePlayer, removePlayer, approveClaim, rejectClaim, submitClaim };
}
