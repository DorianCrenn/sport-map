import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

interface PlayerForEmail {
  convocationId: string;
  name: string;
  email: string;
}

interface SendEmailsOptions {
  eventId: string;
  clubId?: string;
  clubName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventVenue?: string;
  players: PlayerForEmail[];
}

interface EmailResult {
  email: string;
  sent: boolean;
  token?: string;
}

interface UseConvocationEmailReturn {
  sendEmails: (opts: SendEmailsOptions) => Promise<{ ok: boolean; results: EmailResult[]; sentCount: number }>;
  sending: boolean;
  lastResults: EmailResult[] | null;
}

export function useConvocationEmail(): UseConvocationEmailReturn {
  const [sending, setSending] = useState(false);
  const [lastResults, setLastResults] = useState<EmailResult[] | null>(null);

  const sendEmails = useCallback(async (opts: SendEmailsOptions) => {
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const functionUrl = `${supabaseUrl}/functions/v1/send-convocation-email`;

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify(opts),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[useConvocationEmail] Edge Function error:', err);
        return { ok: false, results: [], sentCount: 0 };
      }

      const json = await res.json() as { ok: boolean; results: EmailResult[] };
      setLastResults(json.results ?? []);
      const sentCount = (json.results ?? []).filter(r => r.sent).length;
      return { ok: true, results: json.results ?? [], sentCount };
    } catch (err: any) {
      console.error('[useConvocationEmail] fetch error:', err.message);
      return { ok: false, results: [], sentCount: 0 };
    } finally {
      setSending(false);
    }
  }, []);

  return { sendEmails, sending, lastResults };
}
