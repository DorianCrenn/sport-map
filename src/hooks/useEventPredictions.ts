import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

export type PredictionChoice = 'home' | 'draw' | 'away';
export const PREDICTION_OPTIONS: PredictionChoice[] = ['home', 'draw', 'away'];

type PredictionCounts = Record<PredictionChoice, number>;

export function useEventPredictions(eventId: string | null | undefined, eventDate: string | null | undefined) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const [counts,  setCounts]  = useState<PredictionCounts>({ home: 0, draw: 0, away: 0 });
  const [mine,    setMine]    = useState<PredictionChoice | null>(null);
  const [loading, setLoading] = useState(true);
  const isLocked = eventDate ? new Date(eventDate) <= new Date() : false;

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [{ data: agg }, { data: own }] = await Promise.all([
        supabase.from('event_prediction_counts').select('prediction, count').eq('event_id', eventId) as unknown as Promise<{ data: { prediction: PredictionChoice; count: number }[] | null }>,
        userId
          ? supabase.from('event_predictions').select('prediction').eq('event_id', eventId).eq('user_id', userId).maybeSingle() as unknown as Promise<{ data: { prediction: PredictionChoice } | null }>
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      const newCounts: PredictionCounts = { home: 0, draw: 0, away: 0 };
      for (const row of agg ?? []) newCounts[row.prediction] = row.count;
      setCounts(newCounts);
      setMine((own as { prediction?: PredictionChoice } | null)?.prediction ?? null);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`predictions-${eventId}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_predictions', filter: `event_id=eq.${eventId}` },
        (payload: { eventType: string; old?: { prediction?: PredictionChoice }; new?: { prediction?: PredictionChoice } }) => {
          const prev_choice = payload.old?.prediction;
          const next_choice = payload.new?.prediction;
          setCounts(prev => {
            const updated = { ...prev };
            if (payload.eventType === 'INSERT' && next_choice) updated[next_choice] = (updated[next_choice] ?? 0) + 1;
            else if (payload.eventType === 'DELETE' && prev_choice) updated[prev_choice] = Math.max(0, (updated[prev_choice] ?? 0) - 1);
            else if (payload.eventType === 'UPDATE' && prev_choice && next_choice) { updated[prev_choice] = Math.max(0, (updated[prev_choice] ?? 0) - 1); updated[next_choice] = (updated[next_choice] ?? 0) + 1; }
            return updated;
          });
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [eventId, userId]);

  const vote = useCallback(async (choice: PredictionChoice) => {
    if (!userId || isLocked || !eventId) return;
    const previous       = mine;
    const isSameChoice   = mine === choice;
    setMine(isSameChoice ? null : choice);
    setCounts(prev => {
      const updated = { ...prev };
      if (previous) updated[previous] = Math.max(0, (updated[previous] ?? 0) - 1);
      if (!isSameChoice) updated[choice] = (updated[choice] ?? 0) + 1;
      return updated;
    });
    if (isSameChoice) {
      await supabase.from('event_predictions').delete().eq('event_id', eventId).eq('user_id', userId);
    } else if (previous) {
      await supabase.from('event_predictions').update({ prediction: choice }).eq('event_id', eventId).eq('user_id', userId);
    } else {
      await supabase.from('event_predictions').insert({ event_id: eventId, user_id: userId, prediction: choice });
    }
  }, [eventId, userId, mine, isLocked]);

  const total = counts.home + counts.draw + counts.away;
  return { counts, mine, vote, loading, isLocked, total, isLoggedIn: !!userId };
}

export function useEventPredictionCount(eventId: string | null | undefined): number {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    supabase
      .from('event_prediction_counts')
      .select('count')
      .eq('event_id', eventId)
      .then(({ data }: { data: { count: number }[] | null }) => {
        if (!cancelled && data) setTotal(data.reduce((s, r) => s + (r.count ?? 0), 0));
      });
    return () => { cancelled = true; };
  }, [eventId]);
  return total;
}
