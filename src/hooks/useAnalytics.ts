import { useCallback } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

const SESSION_KEY = 'sl-analytics-sid';

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

interface UseAnalyticsResult {
  track: (eventType: string, properties?: Record<string, unknown>) => void;
}

export function useAnalytics(consent: boolean | null): UseAnalyticsResult {
  const { currentUser } = useAuth();

  const track = useCallback((eventType: string, properties: Record<string, unknown> = {}) => {
    if (isDemoMode()) return;
    if (consent !== true) return;
    if (!currentUser?.id) return;

    supabase.from('analytics_events').insert({
      user_id:    currentUser.id,
      session_id: getSessionId(),
      event_type: eventType,
      properties,
    }).then(() => {});
  }, [consent, currentUser?.id]);

  return { track };
}
