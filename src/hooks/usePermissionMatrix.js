import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export const ROLES = [
  { id: 'visitor',      label: 'Visiteur',          color: '#64748b', icon: '👤' },
  { id: 'supporter',    label: 'Supporter',          color: '#3b82f6', icon: '⭐' },
  { id: 'parent',       label: 'Parent',             color: '#06b6d4', icon: '👨‍👧' },
  { id: 'player',       label: 'Joueur',             color: '#22c55e', icon: '⚽' },
  { id: 'coach',        label: 'Coach',              color: '#f97316', icon: '🎽' },
  { id: 'club_manager', label: 'Responsable',        color: '#8b5cf6', icon: '🏟️' },
  { id: 'club_admin',   label: 'Admin Club',         color: '#f59e0b', icon: '👑' },
  { id: 'admin',        label: 'Super Admin',        color: '#ef4444', icon: '🔑' },
];

export const RESOURCES = [
  { id: 'clubs',         label: 'Clubs',          icon: '🏟️' },
  { id: 'teams',         label: 'Équipes',        icon: '👥' },
  { id: 'matches',       label: 'Matchs',         icon: '⚽' },
  { id: 'trainings',     label: 'Entraînements',  icon: '🏋️' },
  { id: 'convocations',  label: 'Convocations',   icon: '📋' },
  { id: 'carpooling',    label: 'Covoiturage',    icon: '🚗' },
  { id: 'messaging',     label: 'Messagerie',     icon: '💬' },
  { id: 'announcements', label: 'Annonces',       icon: '📢' },
  { id: 'payments',      label: 'Paiements',      icon: '💳' },
  { id: 'settings',      label: 'Paramètres',     icon: '⚙️' },
];

export const ACTIONS = [
  { id: 'view',   label: 'Voir',         color: '#3b82f6' },
  { id: 'create', label: 'Créer',        color: '#22c55e' },
  { id: 'edit',   label: 'Modifier',     color: '#f59e0b' },
  { id: 'delete', label: 'Supprimer',    color: '#ef4444' },
  { id: 'export', label: 'Exporter',     color: '#8b5cf6' },
  { id: 'invite', label: 'Inviter',      color: '#06b6d4' },
  { id: 'admin',  label: 'Administrer',  color: '#f97316' },
];

export function usePermissionMatrix() {
  const { isAdmin } = useAuth();
  const [matrix,  setMatrix]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('permission_matrix')
      .select('role, resource, action, allowed, conditions')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('[PermMatrix] fetch:', error.message);
        setMatrix(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Lookup rapide : isAllowed(role, resource, action) → bool
  const lookup = useMemo(() => {
    const map = {};
    for (const row of matrix) {
      map[`${row.role}:${row.resource}:${row.action}`] = row.allowed;
    }
    return map;
  }, [matrix]);

  const isAllowed = useCallback((role, resource, action) => {
    return lookup[`${role}:${resource}:${action}`] ?? false;
  }, [lookup]);

  // Toggle une permission (optimistic)
  const togglePermission = useCallback(async (role, resource, action, newValue) => {
    if (!isAdmin) return;
    setSaving(true);

    setMatrix(prev => prev.map(r =>
      r.role === role && r.resource === resource && r.action === action
        ? { ...r, allowed: newValue }
        : r
    ));

    const { error } = await supabase
      .from('permission_matrix')
      .upsert({ role, resource, action, allowed: newValue }, { onConflict: 'role,resource,action' });

    if (error) {
      console.error('[PermMatrix] update:', error.message);
      // Rollback
      setMatrix(prev => prev.map(r =>
        r.role === role && r.resource === resource && r.action === action
          ? { ...r, allowed: !newValue }
          : r
      ));
    }
    setSaving(false);
  }, [isAdmin]);

  // Copier un rôle vers un autre
  const copyRole = useCallback(async (fromRole, toRole) => {
    if (!isAdmin) return;
    const fromRows = matrix.filter(r => r.role === fromRole);
    const upserts = fromRows.map(r => ({ ...r, role: toRole }));
    const { error } = await supabase.from('permission_matrix').upsert(upserts, { onConflict: 'role,resource,action' });
    if (error) throw new Error(error.message);
    setMatrix(prev => {
      const withoutTarget = prev.filter(r => r.role !== toRole);
      return [...withoutTarget, ...upserts];
    });
  }, [isAdmin, matrix]);

  // Tout autoriser pour un rôle × ressource
  const allowAll = useCallback(async (role, resource) => {
    if (!isAdmin) return;
    const upserts = ACTIONS.map(a => ({ role, resource, action: a.id, allowed: true }));
    await supabase.from('permission_matrix').upsert(upserts, { onConflict: 'role,resource,action' });
    setMatrix(prev => {
      const others = prev.filter(r => !(r.role === role && r.resource === resource));
      return [...others, ...upserts];
    });
  }, [isAdmin]);

  // Tout refuser pour un rôle × ressource
  const denyAll = useCallback(async (role, resource) => {
    if (!isAdmin) return;
    const upserts = ACTIONS.map(a => ({ role, resource, action: a.id, allowed: false }));
    await supabase.from('permission_matrix').upsert(upserts, { onConflict: 'role,resource,action' });
    setMatrix(prev => {
      const others = prev.filter(r => !(r.role === role && r.resource === resource));
      return [...others, ...upserts];
    });
  }, [isAdmin]);

  return {
    matrix,
    loading,
    saving,
    isAllowed,
    togglePermission,
    copyRole,
    allowAll,
    denyAll,
  };
}
