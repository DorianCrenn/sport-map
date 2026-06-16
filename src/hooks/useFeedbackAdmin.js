import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const PAGE_SIZE = 40;

export function useFeedbackAdmin() {
  const { currentUser } = useAuth();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal]     = useState(0);
  const [stats, setStats]     = useState(null);

  const fetchAll = useCallback(async ({
    type   = null,
    status = null,
    search = '',
    sort   = 'recent',
    page   = 0,
  } = {}) => {
    setLoading(true);
    try {
      let q = supabase
        .from('app_feedback')
        .select(
          'id, user_id, type, category, title, description, status, priority, vote_count, admin_note, merged_into, page_url, app_version, browser_info, created_at, updated_at',
          { count: 'exact' }
        )
        .is('merged_into', null);

      if (type)   q = q.eq('type', type);
      if (status) q = q.eq('status', status);
      if (search.trim()) q = q.ilike('title', `%${search.trim()}%`);

      if (sort === 'votes')   q = q.order('vote_count', { ascending: false }).order('created_at', { ascending: false });
      else if (sort === 'updated') q = q.order('updated_at', { ascending: false });
      else                    q = q.order('created_at', { ascending: false });

      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      setItems(data ?? []);
      setTotal(count ?? 0);
      return data ?? [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase
      .from('app_feedback')
      .select('type, status')
      .is('merged_into', null);

    if (!data) return null;

    const byType   = { bug: 0, idea: 0, question: 0 };
    const byStatus = { new: 0, analyzing: 0, planned: 0, in_dev: 0, resolved: 0, closed: 0 };
    data.forEach(({ type, status }) => {
      if (type   in byType)   byType[type]++;
      if (status in byStatus) byStatus[status]++;
    });

    const result = { total: data.length, byType, byStatus };
    setStats(result);
    return result;
  }, []);

  const updateFeedback = useCallback(async (id, { status, admin_note }) => {
    if (!currentUser) throw new Error('Non connecté');
    const patch = {};
    if (status !== undefined)     patch.status     = status;
    if (admin_note !== undefined) patch.admin_note = admin_note;
    patch.admin_updated_by = currentUser.id;

    const { data, error } = await supabase
      .from('app_feedback')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    return data;
  }, [currentUser]);

  const mergeDuplicate = useCallback(async (duplicateId, targetId) => {
    const { error } = await supabase
      .from('app_feedback')
      .update({ merged_into: targetId, status: 'closed', admin_updated_by: currentUser?.id })
      .eq('id', duplicateId);
    if (error) throw error;
    setItems(prev => prev.filter(i => i.id !== duplicateId));
    setTotal(prev => Math.max(0, prev - 1));
  }, [currentUser]);

  const deleteFeedback = useCallback(async (id) => {
    const { error } = await supabase.from('app_feedback').delete().eq('id', id);
    if (error) throw error;
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(prev => Math.max(0, prev - 1));
  }, []);

  return {
    items, loading, total, stats,
    fetchAll, fetchStats, updateFeedback, mergeDuplicate, deleteFeedback,
    PAGE_SIZE,
  };
}
