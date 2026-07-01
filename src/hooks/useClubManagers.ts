import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { dispatchError } from '../lib/errorBus.js';

export interface ManagerEntry {
  email:            string;
  name:             string;
  role:             string;
  addedAt:          string;
  status:           string;
  user_id:          string | null;
  hasLinkedAccount: boolean;
  team_filter?:     string | null;
}

type ValidRole = 'manager' | 'editor' | 'communicant' | 'coach';
const VALID_ROLES: ValidRole[] = ['manager', 'editor', 'communicant', 'coach'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useClubManagers(clubId: string | null | undefined) {
  const [managers, setManagers] = useState<ManagerEntry[]>([]);

  const mapRow = (r: {
    email: string;
    name?: string;
    role?: string;
    added_at?: string;
    status?: string;
    user_id?: string | null;
    team_filter?: string | null;
  }): ManagerEntry => ({
    email:            r.email,
    name:             r.name ?? '',
    role:             r.role ?? 'manager',
    addedAt:          r.added_at ?? '',
    status:           r.status ?? 'active',
    user_id:          r.user_id ?? null,
    hasLinkedAccount: !!r.user_id,
    team_filter:      r.team_filter ?? null,
  });

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;

    supabase
      .from('club_managers')
      .select('email, name, role, added_at, status, user_id, team_filter')
      .eq('club_id', String(clubId))
      .order('added_at', { ascending: true })
      .then(({ data, error }: { data: any[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) {
          console.error('[Managers] fetch failed, using localStorage:', error.message);
          dispatchError(error);
          try {
            const raw = localStorage.getItem(`club-managers-${clubId}`);
            if (raw) setManagers(JSON.parse(raw) as ManagerEntry[]);
          } catch { /* ignore */ }
          return;
        }
        if (data && data.length > 0) {
          setManagers(data.map(mapRow));
        } else if (data && data.length === 0) {
          try {
            const raw = localStorage.getItem(`club-managers-${clubId}`);
            if (raw) {
              const local = JSON.parse(raw) as ManagerEntry[];
              if (local.length > 0) {
                setManagers(local.map(m => ({ ...mapRow(m), status: 'active', user_id: null, hasLinkedAccount: false })));
                const inserts = local.map(m => ({ club_id: String(clubId), email: m.email, name: m.name, role: m.role ?? 'manager' }));
                supabase.from('club_managers').insert(inserts)
                  .then(({ error: e }: { error: { message: string } | null }) => { if (e) console.error('[Managers] migration insert failed:', e.message); });
              }
            }
          } catch { /* ignore */ }
        }
      });
    return () => { cancelled = true; };
  }, [clubId]);

  const addManager = useCallback(async (email: string, role: string = 'manager', teamFilter?: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    const validRole: ValidRole = VALID_ROLES.includes(role as ValidRole) ? (role as ValidRole) : 'manager';
    if (!EMAIL_RE.test(normalized)) return false;
    if (managers.some(m => m.email === normalized)) return false;

    const name = normalized
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    const newEntry: ManagerEntry = {
      email:            normalized,
      name,
      role:             validRole,
      addedAt:          new Date().toISOString(),
      status:           'active',
      user_id:          null,
      hasLinkedAccount: false,
      team_filter:      teamFilter?.trim() || null,
    };
    setManagers(prev => [...prev, newEntry]);

    const { error } = await supabase
      .from('club_managers')
      .insert({ club_id: String(clubId), email: normalized, name, role: validRole, team_filter: teamFilter?.trim() || null }) as { error: { message: string } | null };
    if (error) {
      console.error('[Managers] add failed:', error.message);
      setManagers(prev => prev.filter(m => m.email !== normalized));
      return false;
    }
    return true;
  }, [managers, clubId]);

  const updateManagerRole = useCallback(async (email: string, role: string): Promise<void> => {
    const validRole: ValidRole = VALID_ROLES.includes(role as ValidRole) ? (role as ValidRole) : 'manager';
    const snapshot = managers;
    setManagers(prev => prev.map(m => m.email === email ? { ...m, role: validRole } : m));
    const { error } = await supabase
      .from('club_managers')
      .update({ role: validRole })
      .eq('club_id', String(clubId))
      .eq('email', email) as { error: { message: string } | null };
    if (error) {
      console.error('[Managers] role update failed, rolling back:', error.message);
      setManagers(snapshot);
    }
  }, [clubId, managers]);

  const removeManager = useCallback(async (email: string): Promise<void> => {
    const prev = managers.find(m => m.email === email);
    setManagers(p => p.filter(m => m.email !== email));
    const { error } = await supabase
      .from('club_managers')
      .delete()
      .eq('club_id', String(clubId))
      .eq('email', email) as { error: { message: string } | null };
    if (error) {
      console.error('[Managers] remove failed:', error.message);
      if (prev) setManagers(p => [...p, prev].sort((a, b) => a.addedAt.localeCompare(b.addedAt)));
    }
  }, [managers, clubId]);

  const isManager = useCallback((userEmail: string | null | undefined): boolean => {
    if (!userEmail) return false;
    return managers.some(m => m.email === userEmail.toLowerCase());
  }, [managers]);

  // Tente de lier manuellement un manager à son compte par email (utile si le trigger auto n'a pas fonctionné)
  const relinkByEmail = useCallback(async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    const { data: authUsers, error } = await supabase.rpc('get_user_id_by_email', { p_email: normalized }) as any;
    if (error || !authUsers) return false;

    const userId = Array.isArray(authUsers) ? authUsers[0]?.id : authUsers?.id;
    if (!userId) return false;

    const { error: updateErr } = await supabase
      .from('club_managers')
      .update({ user_id: userId })
      .eq('club_id', String(clubId))
      .eq('email', normalized) as { error: { message: string } | null };

    if (updateErr) {
      console.error('[Managers] relink failed:', updateErr.message);
      return false;
    }

    setManagers(prev => prev.map(m =>
      m.email === normalized ? { ...m, user_id: userId, hasLinkedAccount: true } : m,
    ));
    return true;
  }, [clubId]);

  return { managers, addManager, removeManager, updateManagerRole, isManager, relinkByEmail };
}
