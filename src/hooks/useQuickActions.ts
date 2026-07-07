import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

type DBRow = Record<string, unknown>;

interface ManagedClub { id: string | number; logo_url?: string | null; logoUrl?: string | null; [key: string]: unknown; }
interface TrainingSession { id: string; club_id: string; team_id?: string; time?: string; location?: string; status?: string; }
interface EventRow { id: string; title?: string; date?: string; adversaire?: string; home_or_away?: string; team_name?: string; club_id?: string; score?: unknown; event_type?: string; sport?: string; }
interface MatchScoreRow { event_id: string; score_home?: number | null; score_away?: number | null; status?: string; }
interface ConvocCount { accepted: number; declined: number; unavailable: number; pending: number; total: number; }
interface CoachMatch { event: EventRow; matchScore: MatchScoreRow | null; convocationCounts: ConvocCount | null; }
interface LiveMatch { event: EventRow; matchScore: MatchScoreRow | null; clubLogo: string | null; }

interface QuickActionsOptions {
  currentUser?:     { id: string } | null;
  managedClubs:     ManagedClub[];
  followedClubIds?: string[];
  isCoachOrManager: boolean;
  isCommunicant:    boolean;
}

function getMatchWindow() {
  const from = new Date(); from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0);
  const to   = new Date(); to.setDate(to.getDate() + 4);     to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useQuickActions({ currentUser, managedClubs, followedClubIds, isCoachOrManager, isCommunicant }: QuickActionsOptions) {
  const [todayTraining, setTodayTraining] = useState<TrainingSession | null>(null);
  const [coachMatches,  setCoachMatches]  = useState<CoachMatch[]>([]);
  const [liveMatches,   setLiveMatches]   = useState<LiveMatch[]>([]);
  const [loading,       setLoading]       = useState(true);
  const eventClubMapRef = useRef<Record<string, string>>({});

  // Stabilité par CONTENU (pas par référence) : un appelant qui passe des
  // tableaux inline (managedClubs={[]}) créerait de nouvelles refs à chaque
  // rendu → memos/callback instables → boucle d'effet (re-fetch infini).
  const managedIdsKey = managedClubs.map(c => String(c.id)).join(',');
  const followedKey   = (followedClubIds ?? []).map(String).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allManagedIds = useMemo(() => managedClubs.map(c => String(c.id)), [managedIdsKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const followedSet   = useMemo(() => new Set((followedClubIds ?? []).map(String)), [followedKey]);

  const load = useCallback(async () => {
    if (!currentUser?.id) { setTodayTraining(null); setCoachMatches([]); setLiveMatches([]); setLoading(false); return; }
    setLoading(true);
    const todayDate = new Date().toISOString().slice(0, 10);
    const { from, to } = getMatchWindow();

    const [trainingRes, eventsRes] = await Promise.all([
      (isCoachOrManager || isCommunicant) && allManagedIds.length
        ? supabase.from('training_sessions').select('id, club_id, team_id, time, location, status').in('club_id', allManagedIds).eq('date', todayDate).eq('status', 'active').limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
      allManagedIds.length
        ? supabase.from('events').select('id, title, date, adversaire, home_or_away, team_name, club_id, score, event_type').in('club_id', allManagedIds).gte('date', from).lte('date', to).in('event_type', ['match', 'friendly', 'championship', 'cup']).order('date', { ascending: true })
        : Promise.resolve({ data: [] }),
    ]) as [{ data: TrainingSession | null }, { data: EventRow[] | null }];

    const allClubIds = [...new Set([...allManagedIds, ...(followedClubIds ?? []).map(String)])];
    const { data: liveScoreRows } = allClubIds.length
      ? await supabase.from('match_scores').select('event_id, score_home, score_away, status').eq('status', 'in_progress') as { data: MatchScoreRow[] | null }
      : { data: [] as MatchScoreRow[] };

    const windowEventIds = (eventsRes.data ?? []).map(e => e.id);
    const { data: scoreRows } = windowEventIds.length
      ? await supabase.from('match_scores').select('event_id, score_home, score_away, status').in('event_id', windowEventIds) as { data: MatchScoreRow[] | null }
      : { data: [] as MatchScoreRow[] };

    const { data: convocRows } = windowEventIds.length
      ? await supabase.from('event_convocations').select('event_id, status').in('event_id', windowEventIds) as { data: { event_id: string; status: string }[] | null }
      : { data: [] as { event_id: string; status: string }[] };

    const scoreMap:  Record<string, MatchScoreRow> = {};
    const convocMap: Record<string, ConvocCount>   = {};
    for (const s of (scoreRows ?? [])) scoreMap[s.event_id] = s;
    for (const e of (eventsRes.data ?? [])) { eventClubMapRef.current[e.id] = e.club_id ?? ''; }
    for (const c of (convocRows ?? [])) {
      if (!convocMap[c.event_id]) convocMap[c.event_id] = { accepted: 0, declined: 0, unavailable: 0, pending: 0, total: 0 };
      convocMap[c.event_id][c.status as keyof ConvocCount] = ((convocMap[c.event_id][c.status as keyof ConvocCount] as number) ?? 0) + 1;
      convocMap[c.event_id].total += 1;
    }

    const builtCoachMatches = (eventsRes.data ?? []).map(ev => ({ event: ev, matchScore: scoreMap[ev.id] ?? null, convocationCounts: convocMap[ev.id] ?? null }));
    setTodayTraining(trainingRes.data ?? null);
    setCoachMatches(builtCoachMatches);

    const liveEventIds = (liveScoreRows ?? []).map(s => s.event_id);
    let liveEventRows: EventRow[] = [];
    if (liveEventIds.length) {
      const { data: lev } = await supabase.from('events').select('id, title, adversaire, team_name, club_id, sport').in('id', liveEventIds) as { data: EventRow[] | null };
      liveEventRows = lev ?? [];
      for (const e of liveEventRows) eventClubMapRef.current[e.id] = e.club_id ?? '';
    }
    const liveScoreMap: Record<string, MatchScoreRow> = {};
    for (const s of (liveScoreRows ?? [])) liveScoreMap[s.event_id] = s;
    const clubLogoMap: Record<string, string | null> = {};
    for (const c of managedClubs) clubLogoMap[String(c.id)] = (c.logo_url ?? c.logoUrl ?? null) as string | null;

    const builtLive = liveEventRows
      .filter(e => followedSet.has(String(e.club_id)) || allManagedIds.includes(String(e.club_id)))
      .map(e => ({ event: e, matchScore: liveScoreMap[e.id] ?? null, clubLogo: clubLogoMap[String(e.club_id)] ?? null }));
    setLiveMatches(builtLive);
    setLoading(false);
  // Deps par contenu (managedIdsKey/followedKey) → load stable tant que le
  // contenu ne change pas, même si les refs des tableaux changent.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, managedIdsKey, followedKey, isCoachOrManager, isCommunicant]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase.channel(`quick-actions-scores-${currentUser.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'match_scores' }, ({ new: row }: { new: DBRow }) => {
        const clubId = String(eventClubMapRef.current[row.event_id as string] ?? '');
        if (allManagedIds.includes(clubId)) setCoachMatches(prev => prev.map(m => m.event.id === row.event_id ? { ...m, matchScore: row as unknown as MatchScoreRow } : m));
        if ((row.status as string) === 'in_progress') {
          setLiveMatches(prev => {
            const exists = prev.some(m => m.event.id === row.event_id);
            if (exists) return prev.map(m => m.event.id === row.event_id ? { ...m, matchScore: row as unknown as MatchScoreRow } : m);
            load(); return prev;
          });
        } else { setLiveMatches(prev => prev.filter(m => m.event.id !== row.event_id)); }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_scores' }, ({ new: row }: { new: DBRow }) => {
        if ((row.status as string) === 'in_progress') load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, allManagedIds, load]);

  useEffect(() => {
    if (!currentUser?.id || !isCoachOrManager) return;
    const convocChannel = supabase.channel(`quick-actions-convocs-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_convocations' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(convocChannel); };
  }, [currentUser?.id, isCoachOrManager, load]);

  return { todayTraining, coachMatches, liveMatches, loading };
}
