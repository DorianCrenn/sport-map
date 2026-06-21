import { useState, useEffect, useCallback } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';

type DBRow = Record<string, unknown>;

export interface MyConvocation {
  id:             string;
  status:         'pending' | 'accepted' | 'declined' | 'unavailable';
  note?:          string | null;
  transport_mode?: string | null;
  driver_seats?:  number | null;
  created_at?:    string;
  responded_by?:  string | null;
  player_id?:     string;
  event_id?:      string;
  event?:         DBRow | null;
}

export function useMyConvocations(userId: string | null | undefined) {
  const [convocations, setConvocations] = useState<MyConvocation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setConvocations([]); setLoading(false); return; }
    setLoading(true);

    const [{ data: directPlayers }, { data: guardianLinks }] = await Promise.all([
      Promise.resolve(supabase.from('club_players').select('id').eq('user_id', userId).eq('is_active', true)) as Promise<{ data: { id: string }[] | null }>,
      Promise.resolve(supabase.from('player_guardians').select('player_id').eq('user_id', userId)) as Promise<{ data: { player_id: string }[] | null }>,
    ]);

    const directIds    = (directPlayers  ?? []).map(p => p.id);
    const guardianIds  = (guardianLinks  ?? []).map(g => g.player_id);
    const allPlayerIds = [...new Set([...directIds, ...guardianIds])];
    if (!allPlayerIds.length) { setConvocations([]); setLoading(false); return; }

    const { data: convocs } = await supabase
      .from('event_convocations')
      .select('id, status, note, transport_mode, driver_seats, created_at, responded_by, player_id, event_id')
      .in('player_id', allPlayerIds)
      .order('created_at', { ascending: false }) as { data: MyConvocation[] | null };

    if (!convocs?.length) { setConvocations([]); setLoading(false); return; }

    const eventIds = [...new Set(convocs.map(c => c.event_id).filter(Boolean))] as string[];
    const { data: eventRows } = eventIds.length
      ? await supabase.from('events').select('id, title, date, city, adversaire, home_or_away, team_name, club_id').in('id', eventIds) as { data: DBRow[] | null }
      : { data: [] as DBRow[] };

    const eventMap = new Map((eventRows ?? []).map(ev => [String(ev.id), ev]));

    setConvocations(convocs.map(c => ({ ...c, event: c.event_id ? (eventMap.get(c.event_id) ?? null) : null })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`my_convocations_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_convocations' }, (_p: DBRow) => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  const respond = useCallback(async (
    convocationId: string,
    status: MyConvocation['status'],
    note: string | null         = null,
    transportMode: string | null = null,
    driverSeats: number | null  = null,
  ) => {
    setConvocations(prev => prev.map(c => c.id === convocationId ? { ...c, status, note, transport_mode: transportMode, driver_seats: driverSeats } : c));
    const { error } = await supabase.rpc('respond_to_convocation', {
      p_convocation_id: convocationId, p_status: status, p_note: note, p_transport_mode: transportMode, p_driver_seats: driverSeats,
    }) as { error: { message: string } | null };
    if (error) {
      setConvocations(prev => prev.map(c => c.id === convocationId ? { ...c, status: 'pending' } : c));
    } else {
      if (isDemoMode()) window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'convocation-responded', status } }));
      window.dispatchEvent(new CustomEvent('sl-analytics', { detail: { type: 'convocation_responded', data: { status } } }));
    }
  }, []);

  const pendingCount = convocations.filter(c => c.status === 'pending').length;
  return { convocations, loading, pendingCount, respond, refetch: load };
}
