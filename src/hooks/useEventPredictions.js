import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export const PREDICTION_OPTIONS = ['home', 'draw', 'away'];

export function useEventPredictions(eventId, eventDate) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;

  const [counts, setCounts]   = useState({ home: 0, draw: 0, away: 0 });
  const [mine, setMine]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Le match a commencé : votes verrouillés
  const isLocked = eventDate ? new Date(eventDate) <= new Date() : false;

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [{ data: agg }, { data: own }] = await Promise.all([
        supabase
          .from('event_prediction_counts')
          .select('prediction, count')
          .eq('event_id', eventId),
        userId
          ? supabase
              .from('event_predictions')
              .select('prediction')
              .eq('event_id', eventId)
              .eq('user_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (cancelled) return;

      const newCounts = { home: 0, draw: 0, away: 0 };
      for (const row of agg ?? []) newCounts[row.prediction] = row.count;
      setCounts(newCounts);
      setMine(own?.prediction ?? null);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`predictions-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_predictions',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        // Mise à jour incrémentale des compteurs
        const prev_choice = payload.old?.prediction;
        const next_choice = payload.new?.prediction;

        setCounts(prev => {
          const updated = { ...prev };
          if (payload.eventType === 'INSERT' && next_choice) {
            updated[next_choice] = (updated[next_choice] ?? 0) + 1;
          } else if (payload.eventType === 'DELETE' && prev_choice) {
            updated[prev_choice] = Math.max(0, (updated[prev_choice] ?? 0) - 1);
          } else if (payload.eventType === 'UPDATE' && prev_choice && next_choice) {
            updated[prev_choice] = Math.max(0, (updated[prev_choice] ?? 0) - 1);
            updated[next_choice] = (updated[next_choice] ?? 0) + 1;
          }
          return updated;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [eventId, userId]);

  const vote = useCallback(async (choice) => {
    if (!userId || isLocked || !eventId) return;

    const previous = mine;
    const isSameChoice = mine === choice;

    // Mise à jour optimiste
    setMine(isSameChoice ? null : choice);
    setCounts(prev => {
      const updated = { ...prev };
      if (previous) updated[previous] = Math.max(0, (updated[previous] ?? 0) - 1);
      if (!isSameChoice) updated[choice] = (updated[choice] ?? 0) + 1;
      return updated;
    });

    if (isSameChoice) {
      // Annuler le vote
      await supabase
        .from('event_predictions')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);
    } else if (previous) {
      // Changer de vote (UPDATE)
      await supabase
        .from('event_predictions')
        .update({ prediction: choice })
        .eq('event_id', eventId)
        .eq('user_id', userId);
    } else {
      // Nouveau vote (INSERT)
      await supabase
        .from('event_predictions')
        .insert({ event_id: eventId, user_id: userId, prediction: choice });
    }
  }, [eventId, userId, mine, isLocked]);

  const total = counts.home + counts.draw + counts.away;

  return { counts, mine, vote, loading, isLocked, total, isLoggedIn: !!userId };
}

// Export léger pour EventCard (ne charge que le total)
export function useEventPredictionCount(eventId) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from('event_prediction_counts')
      .select('count')
      .eq('event_id', eventId)
      .then(({ data }) => {
        if (data) setTotal(data.reduce((s, r) => s + (r.count ?? 0), 0));
      });
  }, [eventId]);

  return total;
}
