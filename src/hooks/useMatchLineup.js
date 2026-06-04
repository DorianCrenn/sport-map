import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useMatchLineup(eventId) {
  const [lineup,    setLineup]    = useState([]);
  const [formation, setFormation] = useState('4-3-3');
  const [locked,    setLocked]    = useState(false);
  const [rowId,     setRowId]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;

    supabase
      .from('match_lineups')
      .select('id, lineup_data, formation, locked')
      .eq('event_id', eventId)
      .eq('side', 'home')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setRowId(data.id);
          setLineup(data.lineup_data ?? []);
          setFormation(data.formation ?? '4-3-3');
          setLocked(data.locked ?? false);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [eventId]);

  const updateLineup = useCallback(async ({ lineup_data, formation: f }) => {
    if (!eventId) return;
    const payload = {
      event_id: eventId,
      side: 'home',
      lineup_data: lineup_data ?? lineup,
      formation: f ?? formation,
      locked: false,
    };

    if (rowId) {
      const { error } = await supabase.from('match_lineups').update(payload).eq('id', rowId);
      if (!error) {
        setLineup(payload.lineup_data);
        setFormation(payload.formation);
      }
    } else {
      const { data, error } = await supabase.from('match_lineups').insert(payload).select().maybeSingle();
      if (!error && data) {
        setRowId(data.id);
        setLineup(payload.lineup_data);
        setFormation(payload.formation);
      }
    }
  }, [eventId, lineup, formation, rowId]);

  const lockLineup = useCallback(async () => {
    if (!eventId || !rowId) return;
    const { error } = await supabase
      .from('match_lineups')
      .update({ locked: true, submitted_at: new Date().toISOString() })
      .eq('id', rowId);
    if (!error) setLocked(true);
  }, [eventId, rowId]);

  return { lineup, formation, locked, loading, updateLineup, lockLineup };
}
