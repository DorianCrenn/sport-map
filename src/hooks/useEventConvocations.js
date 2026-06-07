import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Gestion des convocations pour un événement (vue coach).
 * Permet de lire les réponses et d'envoyer des convocations en batch.
 */
export function useEventConvocations(eventId) {
  const [convocations, setConvocations] = useState([]);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    if (!eventId) { setConvocations([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('event_convocations')
      .select(`
        id, status, note, created_at, responded_by,
        player:club_players ( id, name, team_id, number, photo_url, user_id )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    setConvocations(data ?? []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`event_convocations_${eventId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'event_convocations',
        filter: `event_id=eq.${eventId}`,
      }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, load]);

  /** Envoie des convocations à une liste de playerIds (batch insert, ignore les doublons). */
  const sendConvocations = useCallback(async (playerIds) => {
    if (!playerIds.length || !eventId) return { error: null };
    const rows = playerIds.map(player_id => ({
      event_id: eventId,
      player_id,
      status:   'pending',
    }));
    const { error } = await supabase
      .from('event_convocations')
      .upsert(rows, { onConflict: 'event_id,player_id', ignoreDuplicates: true });
    if (!error) load();
    return { error };
  }, [eventId, load]);

  /** Retire une convocation. */
  const removeConvocation = useCallback(async (convocationId) => {
    await supabase.from('event_convocations').delete().eq('id', convocationId);
    setConvocations(prev => prev.filter(c => c.id !== convocationId));
  }, []);

  const stats = {
    total:       convocations.length,
    pending:     convocations.filter(c => c.status === 'pending').length,
    accepted:    convocations.filter(c => c.status === 'accepted').length,
    declined:    convocations.filter(c => c.status === 'declined').length,
    unavailable: convocations.filter(c => c.status === 'unavailable').length,
    responded:   convocations.filter(c => c.status !== 'pending').length,
  };

  return { convocations, loading, stats, sendConvocations, removeConvocation, refetch: load };
}
