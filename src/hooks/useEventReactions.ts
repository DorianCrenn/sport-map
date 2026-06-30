import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

export const REACTION_EMOJIS = ['👏', '🔥', '💪'] as const;
type Emoji = typeof REACTION_EMOJIS[number];
type ReactionCounts = Record<Emoji, number>;

export function useEventReactions(eventId: string | null | undefined) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const [counts,  setCounts]  = useState<ReactionCounts>({ '👏': 0, '🔥': 0, '💪': 0 });
  const [mine,    setMine]    = useState<Set<Emoji>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [{ data: agg }, { data: own }] = await Promise.all([
        supabase.from('event_reaction_counts').select('emoji, count').eq('event_id', eventId) as unknown as Promise<{ data: { emoji: Emoji; count: number }[] | null }>,
        userId
          ? supabase.from('event_reactions').select('emoji').eq('event_id', eventId).eq('user_id', userId) as unknown as Promise<{ data: { emoji: Emoji }[] | null }>
          : Promise.resolve({ data: [] as { emoji: Emoji }[] }),
      ]);
      if (cancelled) return;
      const newCounts: ReactionCounts = { '👏': 0, '🔥': 0, '💪': 0 };
      for (const row of agg ?? []) newCounts[row.emoji] = row.count;
      setCounts(newCounts);
      setMine(new Set((own ?? []).map(r => r.emoji)));
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`reactions-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_reactions', filter: `event_id=eq.${eventId}` },
        (payload: { eventType: string; new?: { emoji?: Emoji }; old?: { emoji?: Emoji } }) => {
          const emoji = payload.new?.emoji ?? payload.old?.emoji;
          if (!emoji) return;
          setCounts(prev => { const delta = payload.eventType === 'INSERT' ? 1 : -1; return { ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 0) + delta) }; });
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [eventId, userId]);

  const toggle = useCallback(async (emoji: Emoji) => {
    if (!userId) return;
    const hasIt = mine.has(emoji);
    setMine(prev => { const next = new Set(prev); if (hasIt) next.delete(emoji); else next.add(emoji); return next; });
    setCounts(prev => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 0) + (hasIt ? -1 : 1)) }));
    if (hasIt) { await supabase.from('event_reactions').delete().eq('event_id', eventId).eq('user_id', userId).eq('emoji', emoji); }
    else { await supabase.from('event_reactions').insert({ event_id: eventId, user_id: userId, emoji }); }
  }, [eventId, userId, mine]);

  return { counts, mine, toggle, loading, isLoggedIn: !!userId };
}
