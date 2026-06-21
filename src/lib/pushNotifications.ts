import { supabase } from './supabase.js';

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  } catch {
    throw new Error('Clé VAPID invalide — vérifiez VITE_VAPID_PUBLIC_KEY');
  }
}

export async function getSwRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!navigator.serviceWorker) return null;
  return navigator.serviceWorker.ready;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  const reg = await getSwRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY manquante — push désactivé');
    return null;
  }
  if (!window.Notification) throw new Error('Notifications not supported');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permission denied');

  const reg = await getSwRegistration();
  if (!reg) throw new Error('Service Worker not available');

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  });

  const json = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id:  userId,
      endpoint: json.endpoint,
      p256dh:   json.keys?.p256dh ?? '',
      auth:     json.keys?.auth   ?? '',
    },
    { onConflict: 'user_id,endpoint' },
  );

  if (error) throw new Error(error.message);
  return subscription;
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  const subscription = await getPushSubscription();
  if (!subscription) return;

  const { endpoint } = subscription;
  await subscription.unsubscribe();

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);
}
