import { useState, useEffect, useCallback } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import type { ConvocationStatus } from '../types/sportlink.js';

type DBRow = Record<string, unknown>;

export interface PlayerRef { id: string; name?: string; team_id?: string | null; number?: number | null; photo_url?: string | null; user_id?: string | null; }
export interface Convocation { id: string; status: ConvocationStatus; note?: string | null; created_at?: string; responded_by?: string | null; player?: PlayerRef | null; }

interface ConvocationStats { total: number; pending: number; accepted: number; declined: number; unavailable: number; responded: number; }

export function useEventConvocations(eventId: string | null | undefined) {
  const [convocations, setConvocations] = useState<Convocation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!eventId) { setConvocations([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('event_convocations')
      .select('id, status, note, created_at, responded_by, player:club_players ( id, name, team_id, number, photo_url, user_id )')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true }) as { data: Convocation[] | null };
    setConvocations(data ?? []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`event_convocations_${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_convocations', filter: `event_id=eq.${eventId}` },
        (_payload: DBRow) => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, load]);

  const sendConvocations = useCallback(async (playerIds: string[]): Promise<{ error: { message: string } | null }> => {
    if (!playerIds.length || !eventId) return { error: null };
    const rows = playerIds.map(player_id => ({ event_id: eventId, player_id, status: 'pending' }));
    const { error } = await supabase.from('event_convocations').upsert(rows, { onConflict: 'event_id,player_id', ignoreDuplicates: true }) as { error: { message: string } | null };
    if (!error) {
      load();
      if (isDemoMode()) window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'convocation-sent', count: playerIds.length } }));
      window.dispatchEvent(new CustomEvent('sl-analytics', { detail: { type: 'convocation_sent', data: { count: playerIds.length, event_id: eventId } } }));
    }
    return { error };
  }, [eventId, load]);

  const removeConvocation = useCallback(async (convocationId: string) => {
    await supabase.from('event_convocations').delete().eq('id', convocationId);
    setConvocations(prev => prev.filter(c => c.id !== convocationId));
  }, []);

  const stats: ConvocationStats = {
    total:       convocations.length,
    pending:     convocations.filter(c => c.status === 'pending').length,
    accepted:    convocations.filter(c => c.status === 'accepted').length,
    declined:    convocations.filter(c => c.status === 'declined').length,
    unavailable: convocations.filter(c => c.status === 'unavailable').length,
    responded:   convocations.filter(c => c.status !== 'pending').length,
  };

  return { convocations, loading, stats, sendConvocations, removeConvocation, refetch: load };
}
