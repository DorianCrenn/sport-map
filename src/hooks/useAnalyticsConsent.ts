import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

const LS_KEY = 'sl-analytics-consent';

interface UseAnalyticsConsentResult {
  consent: boolean | null;
  loaded: boolean;
  showBanner: boolean;
  accept: () => Promise<void>;
  refuse: () => Promise<void>;
}

export function useAnalyticsConsent(): UseAnalyticsConsentResult {
  const { currentUser } = useAuth();

  const [consent, setConsent] = useState<boolean | null>(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored === 'true')  return true;
    if (stored === 'false') return false;
    return null;
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!currentUser) { setLoaded(true); return; }
    supabase
      .from('profiles')
      .select('analytics_consent')
      .eq('id', currentUser.id)
      .single()
      .then(({ data }: { data: { analytics_consent?: boolean | null } | null }) => {
        const dbConsent = data?.analytics_consent ?? null;
        setConsent(dbConsent);
        if (dbConsent !== null) {
          localStorage.setItem(LS_KEY, String(dbConsent));
        }
        setLoaded(true);
      });
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const accept = useCallback(async () => {
    setConsent(true);
    localStorage.setItem(LS_KEY, 'true');
    if (currentUser) {
      await supabase.from('profiles').update({ analytics_consent: true }).eq('id', currentUser.id);
    }
  }, [currentUser]);

  const refuse = useCallback(async () => {
    setConsent(false);
    localStorage.setItem(LS_KEY, 'false');
    if (currentUser) {
      await supabase.from('profiles').update({ analytics_consent: false }).eq('id', currentUser.id);
    }
  }, [currentUser]);

  const showBanner = loaded && currentUser !== null && consent === null;

  return { consent, loaded, showBanner, accept, refuse };
}
