import { useState, useEffect, useCallback } from 'react';
import { subscribeToPush, unsubscribeFromPush, getPushSubscription } from '../lib/pushNotifications.js';
import { supabase } from '../lib/supabase.js';

export function usePushNotifications() {
  const [subscribed, setSubscribed]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [permission, setPermission]   = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unavailable'
  );

  useEffect(() => {
    getPushSubscription()
      .then(sub => setSubscribed(!!sub))
      .catch(() => setSubscribed(false))
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      if (subscribed) {
        await unsubscribeFromPush(user.id);
        setSubscribed(false);
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setPermission(Notification.permission);
        }
      } else {
        await subscribeToPush(user.id);
        setSubscribed(true);
        setPermission('granted');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [subscribed]);

  return { subscribed, loading, error, permission, toggle };
}
