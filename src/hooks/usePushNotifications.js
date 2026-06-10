import { useState, useEffect, useCallback } from 'react';
import { subscribeToPush, unsubscribeFromPush, getPushSubscription } from '../lib/pushNotifications.js';
import { supabase } from '../lib/supabase.js';

const PUSH_PERM_KEY = 'sl-push-permission';

export function usePushNotifications() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [permission, setPermission] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unavailable';
    // Synchroniser avec la valeur réelle du navigateur
    const real = Notification.permission;
    if (real === 'denied') {
      try { localStorage.setItem(PUSH_PERM_KEY, 'denied'); } catch { /* ignore */ }
    }
    return real;
  });

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
        // Vérifier si la permission est déjà refusée
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
          setPermission('denied');
          try { localStorage.setItem(PUSH_PERM_KEY, 'denied'); } catch { /* ignore */ }
          throw new Error('Notifications bloquées — réactivez-les dans les paramètres de votre navigateur.');
        }
        await subscribeToPush(user.id);
        setSubscribed(true);
        setPermission('granted');
        try { localStorage.removeItem(PUSH_PERM_KEY); } catch { /* ignore */ }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [subscribed]);

  const permissionDenied = permission === 'denied';

  return { subscribed, loading, error, permission, permissionDenied, toggle };
}
