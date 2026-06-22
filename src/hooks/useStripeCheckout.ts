import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

type Plan     = 'starter' | 'pro' | 'elite';
type Interval = 'monthly' | 'yearly';

interface UseStripeCheckoutReturn {
  startCheckout: (plan: Plan, interval?: Interval, clubId?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useStripeCheckout(): UseStripeCheckoutReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const startCheckout = useCallback(async (plan: Plan, interval: Interval = 'monthly', clubId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { setError('Connectez-vous pour continuer'); setLoading(false); return; }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({ plan, interval, clubId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur inconnue' })) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const { url } = await res.json() as { url?: string };
      if (!url) throw new Error('URL de paiement manquante');
      window.location.href = url;

    } catch (err: any) {
      console.error('[useStripeCheckout]', err.message);
      setError(err.message ?? 'Erreur lors de la redirection vers le paiement');
    } finally {
      setLoading(false);
    }
  }, []);

  return { startCheckout, loading, error };
}
