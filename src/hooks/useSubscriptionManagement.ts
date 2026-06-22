import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export interface StripeInvoice {
  id:         string;
  number:     string | null;
  amount:     number;
  currency:   string;
  status:     string | null;
  date:       string;
  period_end: string | null;
  pdf_url:    string | null;
  hosted_url: string | null;
}

export interface SubscriptionDetails {
  plan:                 string;
  status:               string | null;
  current_period_start: string | null;
  current_period_end:   string | null;
  trial_end:            string | null;
  cancel_at_period_end: boolean;
  stripe_sub_id:        string | null;
  stripe_cus_id:        string | null;
}

interface UseSubscriptionManagementReturn {
  sub:          SubscriptionDetails | null;
  loading:      boolean;
  invoices:     StripeInvoice[];
  invoicesLoading: boolean;
  actionLoading: boolean;
  error:        string | null;
  cancel:       () => Promise<void>;
  reactivate:   () => Promise<void>;
  openPortal:   () => Promise<void>;
  loadInvoices: () => Promise<void>;
  refetch:      () => void;
}

async function callManageSubscription(
  action: string,
  clubId: string,
): Promise<any> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('Non connecté');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const res = await fetch(`${supabaseUrl}/functions/v1/manage-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify({ action, clubId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export function useSubscriptionManagement(clubId: string | null | undefined): UseSubscriptionManagementReturn {
  const [sub, setSub]               = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading]       = useState(false);
  const [invoices, setInvoices]     = useState<StripeInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [actionLoading, setActionLoading]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [tick, setTick]             = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('club_subscriptions')
      .select('plan, status, current_period_start, current_period_end, trial_end, cancel_at_period_end, stripe_sub_id, stripe_cus_id')
      .eq('club_id', String(clubId))
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setSub(data as SubscriptionDetails | null);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [clubId, tick]);

  const loadInvoices = useCallback(async () => {
    if (!clubId) return;
    setInvoicesLoading(true);
    try {
      const data = await callManageSubscription('invoices', clubId);
      setInvoices(data.invoices ?? []);
    } catch (err: any) {
      console.error('[useSubscriptionManagement] invoices:', err.message);
    } finally {
      setInvoicesLoading(false);
    }
  }, [clubId]);

  const cancel = useCallback(async () => {
    if (!clubId) return;
    setActionLoading(true);
    setError(null);
    try {
      await callManageSubscription('cancel', clubId);
      refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }, [clubId, refetch]);

  const reactivate = useCallback(async () => {
    if (!clubId) return;
    setActionLoading(true);
    setError(null);
    try {
      await callManageSubscription('reactivate', clubId);
      refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }, [clubId, refetch]);

  const openPortal = useCallback(async () => {
    if (!clubId) return;
    setActionLoading(true);
    setError(null);
    try {
      const data = await callManageSubscription('portal', clubId);
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }, [clubId]);

  return { sub, loading, invoices, invoicesLoading, actionLoading, error, cancel, reactivate, openPortal, loadInvoices, refetch };
}
