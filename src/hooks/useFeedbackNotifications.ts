import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { FeedbackNotification } from '../types/sportlink.js';

interface UseFeedbackNotificationsResult {
  notifications: FeedbackNotification[];
  unreadCount: number;
  loaded: boolean;
  fetch: () => Promise<FeedbackNotification[]>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useFeedbackNotifications(): UseFeedbackNotificationsResult {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<FeedbackNotification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loaded, setLoaded]               = useState(false);

  const fetch = useCallback(async (): Promise<FeedbackNotification[]> => {
    if (!currentUser) return [];
    const { data } = await supabase
      .from('feedback_notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(30) as { data: FeedbackNotification[] | null };
    const list = data ?? [];
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.read).length);
    setLoaded(true);
    return list;
  }, [currentUser]);

  const markRead = useCallback(async (id: string) => {
    await supabase
      .from('feedback_notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', currentUser?.id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [currentUser]);

  const markAllRead = useCallback(async () => {
    if (!currentUser) return;
    await supabase
      .from('feedback_notifications')
      .update({ read: true })
      .eq('user_id', currentUser.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !loaded) fetch();
  }, [currentUser, loaded, fetch]);

  return { notifications, unreadCount, loaded, fetch, markRead, markAllRead };
}
