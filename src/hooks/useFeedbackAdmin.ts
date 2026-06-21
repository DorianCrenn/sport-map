import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import type { AppFeedback } from '../types/sportlink.js';

const PAGE_SIZE = 40;

interface FeedbackStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

interface FetchAllOptions {
  type?: string | null;
  status?: string | null;
  search?: string;
  sort?: 'recent' | 'votes' | 'updated';
  page?: number;
}

interface UseFeedbackAdminResult {
  items: AppFeedback[];
  loading: boolean;
  total: number;
  stats: FeedbackStats | null;
  fetchAll: (opts?: FetchAllOptions) => Promise<AppFeedback[]>;
  fetchStats: () => Promise<FeedbackStats | null>;
  updateFeedback: (id: string, patch: { status?: string; admin_note?: string }) => Promise<AppFeedback>;
  mergeDuplicate: (duplicateId: string, targetId: string) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  PAGE_SIZE: number;
}

export function useFeedbackAdmin(): UseFeedbackAdminResult {
  const { currentUser } = useAuth();
  const [items, setItems]     = useState<AppFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal]     = useState(0);
  const [stats, setStats]     = useState<FeedbackStats | null>(null);

  const fetchAll = useCallback(async ({
    type   = null,
    status = null,
    search = '',
    sort   = 'recent',
    page   = 0,
  }: FetchAllOptions = {}): Promise<AppFeedback[]> => {
    setLoading(true);
    try {
      let q = supabase
        .from('app_feedback')
        .select(
          'id, user_id, type, category, title, description, status, priority, vote_count, admin_note, merged_into, page_url, app_version, browser_info, created_at, updated_at',
          { count: 'exact' },
        )
        .is('merged_into', null);

      if (type)   q = q.eq('type', type);
      if (status) q = q.eq('status', status);
      if (search.trim()) q = q.ilike('title', `%${search.trim()}%`);

      if (sort === 'votes')        q = q.order('vote_count', { ascending: false }).order('created_at', { ascending: false });
      else if (sort === 'updated') q = q.order('updated_at', { ascending: false });
      else                         q = q.order('created_at', { ascending: false });

      q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const { data, error, count } = await q as { data: AppFeedback[] | null; error: { message: string } | null; count: number | null };
      if (error) throw new Error(error.message);
      setItems(data ?? []);
      setTotal(count ?? 0);
      return data ?? [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (): Promise<FeedbackStats | null> => {
    const { data } = await supabase
      .from('app_feedback')
      .select('type, status')
      .is('merged_into', null) as { data: { type: string; status: string }[] | null };

    if (!data) return null;

    const byType:   Record<string, number> = { bug: 0, idea: 0, question: 0 };
    const byStatus: Record<string, number> = { new: 0, analyzing: 0, planned: 0, in_dev: 0, resolved: 0, closed: 0 };
    data.forEach(({ type, status }) => {
      if (type   in byType)   byType[type]++;
      if (status in byStatus) byStatus[status]++;
    });

    const result: FeedbackStats = { total: data.length, byType, byStatus };
    setStats(result);
    return result;
  }, []);

  const updateFeedback = useCallback(async (id: string, { status, admin_note }: { status?: string; admin_note?: string }): Promise<AppFeedback> => {
    if (!currentUser) throw new Error('Non connecté');
    const patch: Record<string, unknown> = {};
    if (status !== undefined)     patch.status     = status;
    if (admin_note !== undefined) patch.admin_note = admin_note;
    patch.admin_updated_by = currentUser.id;

    const { data, error } = await supabase
      .from('app_feedback')
      .update(patch)
      .eq('id', id)
      .select()
      .single() as { data: AppFeedback | null; error: { message: string } | null };
    if (error) throw new Error(error.message);

    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data! } : i));
    return data!;
  }, [currentUser]);

  const mergeDuplicate = useCallback(async (duplicateId: string, targetId: string) => {
    const { error } = await supabase
      .from('app_feedback')
      .update({ merged_into: targetId, status: 'closed', admin_updated_by: currentUser?.id })
      .eq('id', duplicateId) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    setItems(prev => prev.filter(i => i.id !== duplicateId));
    setTotal(prev => Math.max(0, prev - 1));
  }, [currentUser]);

  const deleteFeedback = useCallback(async (id: string) => {
    const { error } = await supabase.from('app_feedback').delete().eq('id', id) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(prev => Math.max(0, prev - 1));
  }, []);

  return { items, loading, total, stats, fetchAll, fetchStats, updateFeedback, mergeDuplicate, deleteFeedback, PAGE_SIZE };
}
