import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Convocations en attente pour l'utilisateur connecté.
 * Couvre : joueur direct + tuteur légal (player_guardians).
 * Realtime : écoute les UPDATE sur event_convocations.
 */
export function useMyConvocations(userId) {
  const [convocations, setConvocations] = useState([]);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setConvocations([]); setLoading(false); return; }
    setLoading(true);

    // Résoudre les player_ids directs + ceux de mes enfants en parallèle
    const [{ data: directPlayers }, { data: guardianLinks }] = await Promise.all([
      supabase.from('club_players').select('id').eq('user_id', userId).eq('is_active', true),
      supabase.from('player_guardians').select('player_id').eq('user_id', userId),
    ]);

    const directIds   = (directPlayers ?? []).map(p => p.id);
    const guardianIds = (guardianLinks  ?? []).map(g => g.player_id);
    const allPlayerIds = [...new Set([...directIds, ...guardianIds])];

    if (!allPlayerIds.length) { setConvocations([]); setLoading(false); return; }

    const { data } = await supabase
      .from('event_convocations')
      .select(`
        id, status, note, created_at, responded_by,
        player_id,
        event:events ( id, title, date, city, homeTeam, awayTeam, club_id ),
        player:club_players ( id, name, team_id, club_id )
      `)
      .in('player_id', allPlayerIds)
      .order('created_at', { ascending: false });

    setConvocations(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Realtime : rafraîchissement sur toute modification
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`my_convocations_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_convocations' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  const respond = useCallback(async (convocationId, status, note = null) => {
    // Optimistic update
    setConvocations(prev =>
      prev.map(c => c.id === convocationId ? { ...c, status, note } : c)
    );
    const { error } = await supabase.rpc('respond_to_convocation', {
      p_convocation_id: convocationId,
      p_status:         status,
      p_note:           note,
    });
    if (error) {
      // Rollback
      setConvocations(prev =>
        prev.map(c => c.id === convocationId ? { ...c, status: 'pending' } : c)
      );
    }
  }, []);

  const pendingCount = convocations.filter(c => c.status === 'pending').length;

  return { convocations, loading, pendingCount, respond, refetch: load };
}
