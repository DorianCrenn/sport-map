import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

export const ROLES: { id: string; label: string; color: string; icon: string }[] = [
  { id: 'visitor',      label: 'Visiteur',     color: '#64748b', icon: '👤' },
  { id: 'supporter',    label: 'Supporter',    color: '#3b82f6', icon: '⭐' },
  { id: 'parent',       label: 'Parent',       color: '#06b6d4', icon: '👨‍👧' },
  { id: 'player',       label: 'Joueur',       color: '#22c55e', icon: '⚽' },
  { id: 'coach',        label: 'Coach',        color: '#f97316', icon: '🎽' },
  { id: 'club_manager', label: 'Responsable',  color: '#8b5cf6', icon: '🏟️' },
  { id: 'club_admin',   label: 'Admin Club',   color: '#f59e0b', icon: '👑' },
  { id: 'admin',        label: 'Super Admin',  color: '#ef4444', icon: '🔑' },
];

export const RESOURCES: { id: string; label: string; icon: string }[] = [
  { id: 'clubs',         label: 'Clubs',         icon: '🏟️' },
  { id: 'teams',         label: 'Équipes',       icon: '👥' },
  { id: 'matches',       label: 'Matchs',        icon: '⚽' },
  { id: 'trainings',     label: 'Entraînements', icon: '🏋️' },
  { id: 'convocations',  label: 'Convocations',  icon: '📋' },
  { id: 'carpooling',    label: 'Covoiturage',   icon: '🚗' },
  { id: 'messaging',     label: 'Messagerie',    icon: '💬' },
  { id: 'announcements', label: 'Annonces',      icon: '📢' },
  { id: 'payments',      label: 'Paiements',     icon: '💳' },
  { id: 'settings',      label: 'Paramètres',    icon: '⚙️' },
];

export const ACTIONS: { id: string; label: string; color: string }[] = [
  { id: 'view',   label: 'Voir',        color: '#3b82f6' },
  { id: 'create', label: 'Créer',       color: '#22c55e' },
  { id: 'edit',   label: 'Modifier',    color: '#f59e0b' },
  { id: 'delete', label: 'Supprimer',   color: '#ef4444' },
  { id: 'export', label: 'Exporter',    color: '#8b5cf6' },
  { id: 'invite', label: 'Inviter',     color: '#06b6d4' },
  { id: 'admin',  label: 'Administrer', color: '#f97316' },
];

interface PermRow { role: string; resource: string; action: string; allowed: boolean; conditions?: unknown; }

export function usePermissionMatrix() {
  const { isAdmin } = useAuth();
  const [matrix,  setMatrix]  = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.from('permission_matrix').select('role, resource, action, allowed, conditions')
      .then(({ data, error }: { data: PermRow[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) console.error('[PermMatrix] fetch:', error.message);
        setMatrix(data ?? []); setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const lookup = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const row of matrix) map[`${row.role}:${row.resource}:${row.action}`] = row.allowed;
    return map;
  }, [matrix]);

  const isAllowed = useCallback((role: string, resource: string, action: string): boolean => lookup[`${role}:${resource}:${action}`] ?? false, [lookup]);

  const togglePermission = useCallback(async (role: string, resource: string, action: string, newValue: boolean) => {
    if (!isAdmin) return;
    setSaving(true);
    setMatrix(prev => prev.map(r => r.role === role && r.resource === resource && r.action === action ? { ...r, allowed: newValue } : r));
    const { error } = await supabase.from('permission_matrix').upsert({ role, resource, action, allowed: newValue }, { onConflict: 'role,resource,action' }) as { error: { message: string } | null };
    if (error) { console.error('[PermMatrix] update:', error.message); setMatrix(prev => prev.map(r => r.role === role && r.resource === resource && r.action === action ? { ...r, allowed: !newValue } : r)); }
    setSaving(false);
  }, [isAdmin]);

  const copyRole = useCallback(async (fromRole: string, toRole: string) => {
    if (!isAdmin) return;
    const fromRows = matrix.filter(r => r.role === fromRole);
    const upserts = fromRows.map(r => ({ ...r, role: toRole }));
    const { error } = await supabase.from('permission_matrix').upsert(upserts, { onConflict: 'role,resource,action' }) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    setMatrix(prev => [...prev.filter(r => r.role !== toRole), ...upserts]);
  }, [isAdmin, matrix]);

  const allowAll = useCallback(async (role: string, resource: string) => {
    if (!isAdmin) return;
    const upserts = ACTIONS.map(a => ({ role, resource, action: a.id, allowed: true }));
    await supabase.from('permission_matrix').upsert(upserts, { onConflict: 'role,resource,action' });
    setMatrix(prev => [...prev.filter(r => !(r.role === role && r.resource === resource)), ...upserts]);
  }, [isAdmin]);

  const denyAll = useCallback(async (role: string, resource: string) => {
    if (!isAdmin) return;
    const upserts = ACTIONS.map(a => ({ role, resource, action: a.id, allowed: false }));
    await supabase.from('permission_matrix').upsert(upserts, { onConflict: 'role,resource,action' });
    setMatrix(prev => [...prev.filter(r => !(r.role === role && r.resource === resource)), ...upserts]);
  }, [isAdmin]);

  return { matrix, loading, saving, isAllowed, togglePermission, copyRole, allowAll, denyAll };
}
