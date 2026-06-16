import { useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isDemoMode } from '../lib/supabase.js';

const SESSION_KEY = 'sl-analytics-sid';

function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function useAnalytics(consent) {
  const { currentUser } = useAuth();

  const track = useCallback((eventType, properties = {}) => {
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
