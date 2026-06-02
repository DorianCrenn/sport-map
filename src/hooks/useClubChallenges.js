import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useClubChallenges(clubId) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    const { data } = await supabase
      .from('club_challenges')
      .select(`
        *,
        challenger:challenger_id(id, name, logo_url, sport),
        challenged:challenged_id(id, name, logo_url, sport)
      `)
      .or(`challenger_id.eq.${clubId},challenged_id.eq.${clubId}`)
      .order('created_at', { ascending: false })
      .limit(50);
    setChallenges(data ?? []);
    setLoading(false);
  }, [clubId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function sendChallenge(challengedClubId, type = 'match', message = '') {
    if (!clubId) throw new Error('Club non identifié');
    const { data, error } = await supabase
      .from('club_challenges')
      .insert({ challenger_id: clubId, challenged_id: challengedClubId, type, message: message.trim() || null })
      .select('*, challenger:challenger_id(id, name, logo_url, sport), challenged:challenged_id(id, name, logo_url, sport)')
      .single();
    if (error) throw error;
    setChallenges(prev => [data, ...prev]);
    return data;
  }

  async function respond(id, status) {
    const { error } = await supabase
      .from('club_challenges')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, status, responded_at: new Date().toISOString() } : c));
  }

  async function cancel(id) {
    await respond(id, 'cancelled');
  }

  const received = challenges.filter(c => c.challenged_id === clubId);
  const sent = challenges.filter(c => c.challenger_id === clubId);
  const pendingReceived = received.filter(c => c.status === 'pending');

  return { challenges, received, sent, pendingReceived, loading, sendChallenge, respond, cancel, reload: fetch };
}
