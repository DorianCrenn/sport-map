import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export interface ClubRef { id: string; name?: string; logo_url?: string | null; sport?: string; }

export interface ClubChallenge {
  id:             string;
  challenger_id:  string;
  challenged_id:  string;
  type?:          string;
  message?:       string | null;
  status?:        string;
  created_at?:    string;
  responded_at?:  string | null;
  challenger?:    ClubRef | null;
  challenged?:    ClubRef | null;
  [key: string]:  unknown;
}

export function useClubChallenges(clubId: string | null | undefined) {
  const [challenges, setChallenges] = useState<ClubChallenge[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    const { data } = await supabase
      .from('club_challenges')
      .select('*, challenger:challenger_id(id, name, logo_url, sport), challenged:challenged_id(id, name, logo_url, sport)')
      .or(`challenger_id.eq.${clubId},challenged_id.eq.${clubId}`)
      .order('created_at', { ascending: false })
      .limit(50) as { data: ClubChallenge[] | null };
    setChallenges(data ?? []);
    setLoading(false);
  }, [clubId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function sendChallenge(challengedClubId: string, type = 'match', message = ''): Promise<ClubChallenge> {
    if (!clubId) throw new Error('Club non identifié');
    const { data, error } = await supabase
      .from('club_challenges')
      .insert({ challenger_id: clubId, challenged_id: challengedClubId, type, message: message.trim() || null })
      .select('*, challenger:challenger_id(id, name, logo_url, sport), challenged:challenged_id(id, name, logo_url, sport)')
      .single() as { data: ClubChallenge | null; error: { message: string } | null };
    if (error) throw error;
    setChallenges(prev => [data!, ...prev]);
    return data!;
  }

  async function respond(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('club_challenges')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', id) as { error: { message: string } | null };
    if (error) throw error;
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, status, responded_at: new Date().toISOString() } : c));
  }

  async function cancel(id: string): Promise<void> { await respond(id, 'cancelled'); }

  const received        = challenges.filter(c => c.challenged_id === clubId);
  const sent            = challenges.filter(c => c.challenger_id === clubId);
  const pendingReceived = received.filter(c => c.status === 'pending');

  return { challenges, received, sent, pendingReceived, loading, sendChallenge, respond, cancel, reload: fetchData };
}
