import { useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const STORAGE_KEY = 'sl_club_views';
const MAX_ENTRIES = 500;

function readStore(): Record<string, number[]> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, number[]>; }
  catch { return {}; }
}
function writeStore(data: Record<string, number[]>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { /* ignore */ }
}

export function useClubPageViews() {
  const recordView = useCallback((clubId: string | number) => {
    const store    = readStore();
    const key      = String(clubId);
    const existing = Array.isArray(store[key]) ? store[key] : [];
    const updated  = [...existing, Date.now()].slice(-MAX_ENTRIES);
    writeStore({ ...store, [key]: updated });

    supabase.auth.getUser().then(({ data }: { data: { user?: { id?: string } | null } }) => {
      if (!data?.user?.id) return;
      supabase.from('club_page_views').insert({ club_id: String(clubId), user_id: data.user.id }).then(() => {});
    });
  }, []);

  const getViewCount = useCallback((clubId: string | number, days = 30): number => {
    const store   = readStore();
    const entries = Array.isArray(store[String(clubId)]) ? store[String(clubId)] : [];
    const cutoff  = Date.now() - days * 24 * 60 * 60 * 1000;
    return entries.filter(ts => ts >= cutoff).length;
  }, []);

  return { recordView, getViewCount };
}
