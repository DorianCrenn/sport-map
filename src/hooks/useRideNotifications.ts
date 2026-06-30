import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

const NOTIF_META: Record<string, { label: string; icon: string }> = {
  new_request:        { label: 'Nouvelle demande de covoiturage', icon: '🚗' },
  request_accepted:   { label: 'Demande acceptée',                icon: '✅' },
  request_refused:    { label: 'Demande refusée',                 icon: '❌' },
  ride_cancelled:     { label: 'Covoiturage annulé',              icon: '🚫' },
  ride_full:          { label: 'Covoiturage complet',             icon: '🔒' },
  passenger_cancelled:{ label: 'Passager annulé',                 icon: '💨' },
};

interface RideNotifRow { id: string; user_id: string; type: string; ride_id?: string; request_id?: string; read: boolean; data?: Record<string, unknown>; created_at: string; }
interface RideNotif { id: string; userId: string; type: string; rideId?: string; requestId?: string; read: boolean; data: Record<string, unknown>; icon: string; label: string; createdAt: string; }

function mapNotif(row: RideNotifRow): RideNotif {
  const meta = NOTIF_META[row.type] ?? { label: row.type, icon: '🔔' };
  return { id: row.id, userId: row.user_id, type: row.type, rideId: row.ride_id, requestId: row.request_id, read: row.read, data: row.data ?? {}, icon: meta.icon, label: meta.label, createdAt: row.created_at };
}

export function useRideNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<RideNotif[]>([]);
  const [loading, setLoading] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const { data } = await supabase.from('ride_notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(60) as { data: RideNotifRow[] | null };
    if (data) setNotifications(data.map(mapNotif));
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) { setNotifications([]); return; }
    fetchNotifications();
    const ch = supabase.channel(`rn-${currentUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_notifications', filter: `user_id=eq.${currentUser.id}` }, ({ new: row }: { new: RideNotifRow }) => {
        setNotifications(prev => [mapNotif(row), ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentUser?.id, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (!currentUser || unreadCount === 0) return;
    await supabase.from('ride_notifications').update({ read: true }).eq('user_id', currentUser.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [currentUser?.id, unreadCount]);

  const markRead = useCallback(async (id: string) => {
    await supabase.from('ride_notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return { notifications, unreadCount, loading, markAllRead, markRead, refetch: fetchNotifications };
}
