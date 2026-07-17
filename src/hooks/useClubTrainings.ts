import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

// Valeurs = tableaux de sessions (blobs JSON localStorage, non typés finement).
type TrainingMap = Record<string, any>;
type Updater<T> = T | ((prev: T) => T);

export function useClubTrainings(clubId: string | null | undefined): [TrainingMap, (updater: Updater<TrainingMap>) => void] {
  const [trainings, setTrainingsState] = useState<TrainingMap>({});
  const loaded    = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<TrainingMap>({});
  const clubIdStr = String(clubId);

  useEffect(() => {
    loaded.current = false;
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    let cancelled = false;

    supabase
      .from('club_trainings')
      .select('team_id, sessions')
      .eq('club_id', clubIdStr)
      .then(({ data, error }: { data: { team_id: string; sessions: unknown }[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) {
          console.error('[Trainings] fetch failed, using localStorage:', error.message);
          try {
            const raw = localStorage.getItem(`club-trainings-${clubIdStr}`);
            if (raw) { const parsed = JSON.parse(raw) as TrainingMap; setTrainingsState(parsed); latestRef.current = parsed; }
          } catch { /* ignore */ }
        } else if (data && data.length > 0) {
          const map = Object.fromEntries(data.map(r => [r.team_id, r.sessions]));
          setTrainingsState(map); latestRef.current = map;
        } else if (data && data.length === 0) {
          try {
            const raw = localStorage.getItem(`club-trainings-${clubIdStr}`);
            if (raw) {
              const map = JSON.parse(raw) as TrainingMap;
              if (Object.keys(map).length > 0) {
                setTrainingsState(map); latestRef.current = map;
                const upserts = Object.entries(map).map(([teamId, sessions]) => ({ club_id: clubIdStr, team_id: teamId, sessions }));
                supabase.from('club_trainings').upsert(upserts, { onConflict: 'club_id,team_id' })
                  .then(({ error: e }: { error: { message: string } | null }) => { if (e) console.error('[Trainings] migration upsert failed:', e.message); });
              }
            }
          } catch { /* ignore */ }
        }
        loaded.current = true;
      });

    return () => {
      cancelled = true;
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    };
  }, [clubIdStr]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const map = latestRef.current;
      const upserts = Object.entries(map).map(([teamId, sessions]) => ({
        club_id: clubIdStr, team_id: teamId, sessions, updated_at: new Date().toISOString(),
      }));
      if (upserts.length === 0) return;
      const { error } = await supabase.from('club_trainings').upsert(upserts, { onConflict: 'club_id,team_id' }) as { error: { message: string } | null };
      if (error) {
        console.error('[Trainings] save failed:', error.message);
        try { localStorage.setItem(`club-trainings-${clubIdStr}`, JSON.stringify(map)); } catch { /* ignore */ }
      }
    }, 1200);
  }, [clubIdStr]);

  const setTrainings = useCallback((updater: Updater<TrainingMap>) => {
    setTrainingsState(prev => {
      const next = typeof updater === 'function' ? (updater as (p: TrainingMap) => TrainingMap)(prev) : updater;
      latestRef.current = next;
      if (loaded.current) scheduleSave();
      return next;
    });
  }, [scheduleSave]);

  return [trainings, setTrainings];
}
