import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export const REACTION_EMOJIS = ['👏', '🔥', '💪'];

/**
 * Gère les réactions (👏🔥💪) pour un événement.
 * - counts : { '👏': 3, '🔥': 1, '💪': 0 }
 * - mine   : Set of emojis the current user has reacted with
 * - toggle : ajoute ou retire la réaction de l'utilisateur
 */
export function useEventReactions(eventId) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const [counts, setCounts]   = useState({ '👏': 0, '🔥': 0, '💪': 0 });
  const [mine, setMine]       = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Charger les counts + réactions perso
  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [{ data: agg }, { data: own }] = await Promise.all([
        supabase
          .from('event_reaction_counts')
          .select('emoji, count')
          .eq('event_id', eventId),
        userId
          ? supabase
              .from('event_reactions')
              .select('emoji')
              .eq('event_id', eventId)
              .eq('user_id', userId)
          : Promise.resolve({ data: [] }),
      ]);

      if (cancelled) return;

      const newCounts = { '👏': 0, '🔥': 0, '💪': 0 };
      for (const row of agg ?? []) newCounts[row.emoji] = row.count;
      setCounts(newCounts);
      setMine(new Set((own ?? []).map(r => r.emoji)));
      setLoading(false);
    }

    load();

    // Realtime : mise à jour incrémentale sur INSERT / DELETE
    const channel = supabase
      .channel(`reactions-${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_reactions',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        const emoji = payload.new?.emoji ?? payload.old?.emoji;
        if (!emoji) return;
        setCounts(prev => {
          const delta = payload.eventType === 'INSERT' ? 1 : -1;
          return { ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 0) + delta) };
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [eventId, userId]);

  const toggle = useCallback(async (emoji) => {
    if (!userId) return;

    const hasIt = mine.has(emoji);

    // Optimiste
    setMine(prev => {
      const next = new Set(prev);
      hasIt ? next.delete(emoji) : next.add(emoji);
      return next;
    });
    setCounts(prev => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] ?? 0) + (hasIt ? -1 : 1)),
    }));

    if (hasIt) {
      await supabase
        .from('event_reactions')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('emoji', emoji);
    } else {
      await supabase
        .from('event_reactions')
        .insert({ event_id: eventId, user_id: userId, emoji });
    }
  }, [eventId, userId, mine]);

  return { counts, mine, toggle, loading, isLoggedIn: !!userId };
}
