import { useState, useEffect, useCallback } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';

/**
 * Convocations en attente pour l'utilisateur connecté.
 * Couvre : joueur direct + tuteur légal (player_guardians).
 * Realtime : écoute les UPDATE sur event_convocations.
 *
 * Utilise deux requêtes séparées au lieu d'un join imbriqué pour compatibilité
 * avec demoClient (qui ne supporte pas les joins relationnels).
 */
export function useMyConvocations(userId) {
  const [convocations, setConvocations] = useState([]);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setConvocations([]); setLoading(false); return; }
    setLoading(true);

    // 1. Résoudre les player_ids directs + ceux de mes enfants en parallèle
    const [{ data: directPlayers }, { data: guardianLinks }] = await Promise.all([
      supabase.from('club_players').select('id').eq('user_id', userId).eq('is_active', true),
      supabase.from('player_guardians').select('player_id').eq('user_id', userId),
    ]);

    const directIds    = (directPlayers ?? []).map(p => p.id);
    const guardianIds  = (guardianLinks  ?? []).map(g => g.player_id);
    const allPlayerIds = [...new Set([...directIds, ...guardianIds])];

    if (!allPlayerIds.length) { setConvocations([]); setLoading(false); return; }

    // 2. Récupérer les convocations (sans join imbriqué — compatible demoClient)
    const { data: convocs } = await supabase
      .from('event_convocations')
      .select('id, status, note, created_at, responded_by, player_id, event_id')
      .in('player_id', allPlayerIds)
      .order('created_at', { ascending: false });

    if (!convocs?.length) { setConvocations([]); setLoading(false); return; }

    // 3. Récupérer les détails des événements liés
    const eventIds = [...new Set(convocs.map(c => c.event_id).filter(Boolean))];
    const { data: eventRows } = eventIds.length
      ? await supabase
          .from('events')
          .select('id, title, date, city, adversaire, home_or_away, team_name, club_id')
          .in('id', eventIds)
      : { data: [] };

    const eventMap = new Map((eventRows ?? []).map(ev => [ev.id, ev]));

    setConvocations(convocs.map(c => ({
      ...c,
      event: eventMap.get(c.event_id) ?? null,
    })));
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
    } else if (isDemoMode()) {
      window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'convocation-responded', status } }));
    }
  }, []);

  const pendingCount = convocations.filter(c => c.status === 'pending').length;

  return { convocations, loading, pendingCount, respond, refetch: load };
}
