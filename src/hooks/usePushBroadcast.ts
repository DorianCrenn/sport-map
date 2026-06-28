import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export type PushTarget = 'all' | 'team' | 'event';

interface BroadcastOptions {
  clubId: string;
  title: string;
  body: string;
  target: PushTarget;
  teamId?: string;
  eventId?: string;
  url?: string;
}

interface BroadcastResult { sent: number; failed?: number; total?: number; reason?: string; skipped?: string; }

export function usePushBroadcast() {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<BroadcastResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function broadcast(opts: BroadcastOptions): Promise<BroadcastResult | null> {
    setLoading(true); setResult(null); setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Non authentifié');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/notify-team-players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({
          club_id:  opts.clubId,
          title:    opts.title,
          body:     opts.body,
          target:   opts.target,
          team_id:  opts.teamId,
          event_id: opts.eventId,
          url:      opts.url ?? '/',
          tag:      'sportlink-broadcast',
        }),
      });

      const data: BroadcastResult = await res.json();
      if (!res.ok) throw new Error((data as any).error ?? 'Erreur serveur');
      setResult(data);
      return data;
    } catch (e: any) {
      setError(e.message ?? 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { broadcast, loading, result, error, reset: () => { setResult(null); setError(null); } };
}
