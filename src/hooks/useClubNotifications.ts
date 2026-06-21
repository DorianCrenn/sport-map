import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

type DBRow = Record<string, unknown>;

interface ClubNotification extends DBRow {
  id: string;
  user_id: string;
  read: boolean;
  created_at: string;
}

export function useClubNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<ClubNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const channelId = useRef(`club-notifs-${currentUser?.id ?? 'anon'}`);

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('club_notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }: { data: ClubNotification[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) { console.error('[ClubNotifs] fetch failed:', error.message); }
        else { setNotifications(data ?? []); }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_notifications', filter: `user_id=eq.${currentUser.id}` },
        ({ new: row }: { new: ClubNotification }) => { setNotifications(prev => [row, ...prev]); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'club_notifications', filter: `user_id=eq.${currentUser.id}` },
        ({ new: row }: { new: ClubNotification }) => { setNotifications(prev => prev.map(n => n.id === row.id ? row : n)); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('club_notifications').update({ read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!currentUser?.id) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('club_notifications').update({ read: true }).eq('user_id', currentUser.id).eq('read', false);
  }, [currentUser?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, loading, markAsRead, markAllRead };
}
