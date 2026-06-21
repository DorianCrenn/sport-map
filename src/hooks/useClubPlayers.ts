import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

type DBRow = Record<string, unknown>;

export interface ClubPlayer {
  id:         string;
  club_id:    string;
  team_id?:   string | null;
  name:       string;
  number?:    number | null;
  position?:  string | null;
  photo_url?: string | null;
  email?:     string | null;
  user_id?:   string | null;
  is_active:  boolean;
  [key: string]: unknown;
}

export interface ClaimRequest extends DBRow {
  id:           string;
  player_id:    string;
  user_id:      string;
  type:         string;
  relation?:    string | null;
  birth_year?:  number | null;
  status:       string;
  created_at:   string;
  club_players?: { name?: string; team_id?: string } | null;
}

interface AddPlayerFields { name: string; number?: number | null; position?: string | null; photo_url?: string | null; email?: string | null; team_id?: string | null; }
interface SubmitClaimFields { playerId: string; type: string; relation?: string | null; birthYear?: number | null; userId: string; }

export function useClubPlayers(clubId: string | null | undefined, teamId: string | null = null) {
  const [players, setPlayers] = useState<ClubPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [claims,  setClaims]  = useState<ClaimRequest[]>([]);
  const clubIdStr = String(clubId ?? '');

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

    query.then(({ data, error }: { data: ClubPlayer[] | null; error: { message: string } | null }) => {
      if (cancelled) return;
      if (error) console.error('[Players] fetch failed:', error.message);
      setPlayers(data ?? []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [clubIdStr, teamId]);

  const loadClaims = useCallback(async () => {
    if (!clubIdStr) return;
    const idsRes = await supabase.from('club_players').select('id').eq('club_id', clubIdStr) as { data: { id: string }[] | null };
    const ids = idsRes.data?.map(p => p.id) ?? [];
    if (ids.length === 0) return;
    const { data, error } = await supabase
      .from('player_claim_requests')
      .select('id, player_id, user_id, type, relation, birth_year, status, created_at, club_players(name, team_id)')
      .in('player_id', ids)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }) as { data: ClaimRequest[] | null; error: { message: string } | null };
    if (!error) setClaims(data ?? []);
  }, [clubIdStr]);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  const addPlayer = useCallback(async (fields: AddPlayerFields): Promise<ClubPlayer | null> => {
    const { name, number, position, photo_url, email, team_id: tid } = fields;
    if (!name?.trim()) return null;
    const { data, error } = await supabase
      .from('club_players')
      .insert({ club_id: clubIdStr, team_id: tid ?? teamId, name: name.trim(), number: number ?? null, position: position ?? null, photo_url: photo_url ?? null, email: email?.trim().toLowerCase() ?? null })
      .select()
      .single() as { data: ClubPlayer | null; error: { message: string } | null };
    if (error) { console.error('[Players] add failed:', error.message); return null; }
    setPlayers(prev => [...prev, data!].sort((a, b) => (a.number ?? 999) - (b.number ?? 999)));
    return data;
  }, [clubIdStr, teamId]);

  const updatePlayer = useCallback(async (id: string, patch: Partial<ClubPlayer>): Promise<void> => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    const { error } = await supabase.from('club_players').update(patch).eq('id', id) as { error: { message: string } | null };
    if (error) {
      console.error('[Players] update failed:', error.message);
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...(Object.fromEntries(Object.keys(patch).map(k => [k, p[k]]))) } : p));
    }
  }, []);

  const removePlayer = useCallback(async (id: string): Promise<void> => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    const { error } = await supabase.from('club_players').update({ is_active: false }).eq('id', id) as { error: { message: string } | null };
    if (error) console.error('[Players] remove failed:', error.message);
  }, []);

  const approveClaim = useCallback(async (claimId: string): Promise<boolean> => {
    const { error } = await supabase.from('player_claim_requests').update({ status: 'approved' }).eq('id', claimId) as { error: { message: string } | null };
    if (error) { console.error('[Players] approve claim failed:', error.message); return false; }
    setClaims(prev => prev.filter(c => c.id !== claimId));
    return true;
  }, []);

  const rejectClaim = useCallback(async (claimId: string): Promise<boolean> => {
    const { error } = await supabase.from('player_claim_requests').update({ status: 'rejected' }).eq('id', claimId) as { error: { message: string } | null };
    if (error) { console.error('[Players] reject claim failed:', error.message); return false; }
    setClaims(prev => prev.filter(c => c.id !== claimId));
    return true;
  }, []);

  const submitClaim = useCallback(async ({ playerId, type, relation, birthYear, userId }: SubmitClaimFields): Promise<boolean> => {
    const { error } = await supabase.from('player_claim_requests').insert({ player_id: playerId, user_id: userId, type, relation: relation ?? null, birth_year: birthYear ?? null }) as { error: { message: string } | null };
    if (error) { console.error('[Players] submit claim failed:', error.message); return false; }
    return true;
  }, []);

  return { players, loading, claims, addPlayer, updatePlayer, removePlayer, approveClaim, rejectClaim, submitClaim };
}
