import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

type DBRow = Record<string, unknown>;

export const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  grant_created:        { label: 'Grant créé',          color: '#22c55e', icon: '🎁' },
  grant_revoked:        { label: 'Grant révoqué',        color: '#ef4444', icon: '❌' },
  plan_feature_changed: { label: 'Feature modifiée',    color: '#f59e0b', icon: '⚙️' },
  plan_quota_changed:   { label: 'Quota modifié',       color: '#f59e0b', icon: '📊' },
  permission_changed:   { label: 'Permission modifiée', color: '#8b5cf6', icon: '🔒' },
  club_verified:        { label: 'Club vérifié',         color: '#22c55e', icon: '✅' },
  club_rejected:        { label: 'Club rejeté',          color: '#ef4444', icon: '🚫' },
  club_suspended:       { label: 'Club suspendu',        color: '#f97316', icon: '⛔' },
};

interface AuditLogOptions {
  entityType?: string | null;
  entityId?:   string | null;
  limit?:      number;
}

export function useAdminAuditLog({ entityType = null, entityId = null, limit = 100 }: AuditLogOptions = {}) {
  const { isAdmin } = useAuth();
  const [entries, setEntries] = useState<DBRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset,  setOffset]  = useState(0);

  const fetchLogs = useCallback(async (reset = true) => {
    if (!isAdmin) return;
    setLoading(true);
    const currentOffset = reset ? 0 : offset;

    let query = supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(currentOffset, currentOffset + limit - 1);

    if (entityType) query = query.eq('entity_type', entityType);
    if (entityId)   query = query.eq('entity_id', String(entityId));

    const { data, error } = await query as { data: DBRow[] | null; error: { message: string } | null };
    if (error) console.error('[AuditLog] fetch:', error.message);

    const rows = data ?? [];
    if (reset) {
      setEntries(rows);
      setOffset(rows.length);
    } else {
      setEntries(prev => [...prev, ...rows]);
      setOffset(prev => prev + rows.length);
    }
    setHasMore(rows.length === limit);
    setLoading(false);
  }, [isAdmin, entityType, entityId, limit, offset]);

  useEffect(() => { fetchLogs(true); }, [isAdmin, entityType, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => fetchLogs(false), [fetchLogs]);

  return {
    entries,
    loading,
    hasMore,
    loadMore,
    refetch: () => fetchLogs(true),
    ACTION_LABELS,
  };
}
