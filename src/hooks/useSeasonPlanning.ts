import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';

type DBRow = Record<string, unknown>;

interface ManagedClub { id: string | number; managerRole?: string; [key: string]: unknown; }
interface SeasonPlanningOptions {
  userId?:          string | null;
  allClubIds?:      (string | number)[];
  managedClubIds?:  (string | number)[];
  managedClubs?:    ManagedClub[];
  year?:            number;
  month?:           number;
  clubFilter?:      string | 'all';
  teamFilter?:      string[];
}

interface MatchScore { status?: string; score_home?: number | null; score_away?: number | null; }
interface ConvocStats { total: number; accepted: number; pending: number; declined: number; unavailable: number; }
export interface SeasonItem {
  id:           string;
  type:         'training' | 'match';
  date:         string;
  time:         string;
  title:        string;
  location:     string;
  club_id:      string;
  status?:      string;
  team_id?:     string | null;
  myStatus?:    string | null;
  presentCount: number;
  absentCount:  number;
  unsureCount:  number;
  isStaffClub:   boolean;
  isPlayerClub:  boolean;
  isSupporter:   boolean;
  isGuardian?:     boolean;   // parent/tuteur d'un joueur (non-joueur direct)
  childPlayerName?: string;  // prénom de l'enfant concerné (si isGuardian)
  childPlayerId?:   string;  // club_players.id de l'enfant (pour respond)
  // match-only
  sport?:       string;
  adversaire?:  string;
  event_type?:  string;
  category?:    string;
  team_name?:   string;
  home_or_away?: string;
  level?:       string;
  cup_type?:    string;
  score?:       unknown;
  matchScore?:  MatchScore | null;
  convocs?:     ConvocStats | null;
  isCoachClub?: boolean;
  isCommClub?:  boolean;
  isOwnerClub?: boolean;    // président / créateur du club
  posters?:     { announce?: string | null; convocation?: string | null; result?: string | null } | null;
  // training-only: sessions groupées par équipe (même date/heure/lieu)
  teams?: { sessionId: string; teamId: string | null; teamName: string; presentCount: number; absentCount: number; unsureCount: number; myStatus: string | null }[];
}

export function useSeasonPlanning({ userId, allClubIds = [], managedClubIds = [], managedClubs = [], year, month, clubFilter = 'all', teamFilter = [] }: SeasonPlanningOptions) {
  const [items,   setItems]   = useState<SeasonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const matchEventIdsRef = useRef(new Set<string>());

  const { firstDay, lastDay } = useMemo(() => {
    const y  = year  ?? new Date().getFullYear();
    const m  = month ?? new Date().getMonth() + 1;
    const last = new Date(y, m, 0);
    const mm = String(m).padStart(2, '0'); const dd = String(last.getDate()).padStart(2, '0');
    return { firstDay: `${y}-${mm}-01`, lastDay: `${y}-${mm}-${dd}` };
  }, [year, month]);

  const clubIdKey  = useMemo(() => [...new Set(allClubIds.map(String).filter(Boolean))].sort().join(','), [allClubIds]);
  const managedKey = useMemo(() => [...new Set(managedClubIds.map(String).filter(Boolean))].sort().join(','), [managedClubIds]);
  const coachKey   = useMemo(() => managedClubs.filter(c => c.managerRole !== 'communicant').map(c => String(c.id)).sort().join(','), [managedClubs]);
  const commKey    = useMemo(() => managedClubs.filter(c => c.managerRole === 'communicant').map(c => String(c.id)).sort().join(','), [managedClubs]);
  const ownerKey   = useMemo(() => managedClubs.filter(c => c.managerRole === 'owner').map(c => String(c.id)).sort().join(','), [managedClubs]);

  useEffect(() => {
    const baseClubIds = clubIdKey.split(',').filter(Boolean);
    const filtered    = clubFilter !== 'all' ? baseClubIds.filter(id => id === String(clubFilter)) : baseClubIds;
    const demo = isDemoMode();
    if ((!userId && !demo) || !filtered.length) { setItems([]); setLoading(false); return; }
    let cancelled = false;
    const managedSet = new Set(managedKey.split(',').filter(Boolean));
    const coachSet   = new Set(coachKey.split(',').filter(Boolean));
    const commSet    = new Set(commKey.split(',').filter(Boolean));
    const ownerSet   = new Set(ownerKey.split(',').filter(Boolean));

    async function load() {
      setLoading(true);
      // En mode démo, pas de currentUser → on saute les requêtes dépendant de userId
      const [{ data: directEntries }, { data: guardianRows }] = (!userId || demo) ? [{ data: [] }, { data: [] }] : await Promise.all([
        supabase.from('club_players').select('club_id, team_id, name').eq('user_id', userId!).eq('is_active', true),
        supabase.from('player_guardians').select('player_id').eq('user_id', userId!),
      ]) as [{ data: { club_id: string; team_id?: string; name?: string }[] | null }, { data: { player_id: string }[] | null }];

      let childEntries: { club_id: string; team_id?: string; name?: string }[] = [];
      if (guardianRows?.length) {
        const pids = guardianRows.map(g => g.player_id);
        const { data: children } = await supabase.from('club_players').select('id, club_id, team_id, name').in('id', pids).eq('is_active', true) as { data: typeof childEntries | null };
        childEntries = children ?? [];
      }
      if (cancelled) return;

      const allEntries       = [...(directEntries ?? []), ...childEntries];
      const directClubSet    = new Set((directEntries ?? []).map(e => String(e.club_id)));
      const guardianClubSet  = new Set(childEntries.map(e => String(e.club_id)));
      const playerClubSet    = new Set(allEntries.map(e => String(e.club_id)));
      const playerTeamIds    = [...new Set(allEntries.map(e => String(e.team_id)).filter(Boolean))];
      const trainingClubs    = filtered.filter(id => playerClubSet.has(id) || managedSet.has(id));
      // IDs club_players des enfants (pour fetch présence par player_id)
      const childPlayerUUIDs = childEntries.map(e => (e as any).id).filter((id): id is string => !!id);

      const [sessionsRes, eventsRes] = await Promise.all([
        trainingClubs.length
          ? supabase.from('training_sessions').select('id, club_id, team_id, date, time, location, status').in('club_id', trainingClubs).gte('date', firstDay).lte('date', lastDay).neq('status', 'cancelled').order('date').order('time')
          : Promise.resolve({ data: [] }),
        supabase.from('events').select('id, club_id, title, sport, date, venue, city, event_type, team_name, category, adversaire, home_or_away, level, cup_type, score').in('club_id', filtered).gte('date', `${firstDay}T00:00:00`).lte('date', `${lastDay}T23:59:59`).eq('is_archived', false).not('title', 'ilike', 'entraînement%').order('date'),
      ]) as [{ data: { id: string; club_id: string; team_id?: string | null; date: string; time?: string; location?: string; status?: string }[] | null }, { data: DBRow[] | null }];
      if (cancelled) return;

      const sessions  = (sessionsRes.data ?? []).filter(s => managedSet.has(String(s.club_id)) || !s.team_id || playerTeamIds.includes(String(s.team_id)));
      const events    = eventsRes.data ?? [];
      const sessionIds = sessions.map(s => s.id);
      const eventIds   = events.map(e => String(e.id));

      const [trainAttRes, matchAttRes, trainCntRes, matchCntRes, convocRes, matchScoresRes, postersRes, childTrainAttRes] = await Promise.all([
        (sessionIds.length && userId) ? supabase.from('training_attendance').select('session_id, status').in('session_id', sessionIds).eq('user_id', userId) : { data: [] },
        (eventIds.length && userId)   ? supabase.from('match_player_attendance').select('event_id, status').in('event_id', eventIds).eq('user_id', userId) : { data: [] },
        sessionIds.length ? supabase.from('training_attendance_counts').select('session_id, present_count, absent_count, unsure_count').in('session_id', sessionIds) : { data: [] },
        eventIds.length   ? supabase.from('match_attendance_counts').select('event_id, present_count, absent_count, unsure_count').in('event_id', eventIds) : { data: [] },
        (managedSet.size > 0 && eventIds.length) ? supabase.from('event_convocations').select('event_id, status').in('event_id', eventIds) : { data: [] },
        eventIds.length   ? supabase.from('match_scores').select('event_id, score_home, score_away, status').in('event_id', eventIds) : { data: [] },
        eventIds.length   ? supabase.from('match_posters').select('event_id, poster_type, image_url').in('event_id', eventIds) : { data: [] },
        // Présence des enfants (pour tuteurs/parents) — par player_id
        (sessionIds.length && childPlayerUUIDs.length) ? supabase.from('training_attendance').select('session_id, status, player_id').in('session_id', sessionIds).in('player_id', childPlayerUUIDs) : { data: [] },
      ]) as [{ data: { session_id: string; status: string }[] | null }, { data: { event_id: string; status: string }[] | null }, { data: { session_id: string; present_count?: number; absent_count?: number; unsure_count?: number }[] | null }, { data: { event_id: string; present_count?: number; absent_count?: number; unsure_count?: number }[] | null }, { data: { event_id: string; status: string }[] | null }, { data: MatchScore & { event_id: string }[] | null }, { data: { event_id: string; poster_type: string; image_url: string }[] | null }, { data: { session_id: string; status: string; player_id: string }[] | null }];
      if (cancelled) return;

      const trainStatusMap: Record<string, string> = Object.fromEntries((trainAttRes.data ?? []).map(a => [a.session_id, a.status]));
      // Présence des enfants (par player_id) — indexée par session_id + player_id
      const childAttMap: Record<string, Record<string, string>> = {};
      for (const a of (childTrainAttRes.data ?? [])) {
        if (!childAttMap[a.session_id]) childAttMap[a.session_id] = {};
        childAttMap[a.session_id][a.player_id] = a.status;
      }
      const matchStatusMap = Object.fromEntries((matchAttRes.data ?? []).map(a => [a.event_id,   a.status]));
      type CntRow = { present_count?: number; absent_count?: number; unsure_count?: number; [key: string]: unknown };
      const trainCntMap: Record<string, CntRow> = Object.fromEntries((trainCntRes.data ?? []).map(r => [r.session_id, r]));
      const matchCntMap: Record<string, CntRow> = Object.fromEntries((matchCntRes.data ?? []).map(r => [r.event_id,   r]));
      const matchScoreMap  = Object.fromEntries((matchScoresRes.data ?? []).map(r => [r.event_id, r]));
      const posterMap: Record<string, { announce?: string; convocation?: string; result?: string }> = {};
      for (const r of (postersRes.data ?? [])) {
        if (!posterMap[r.event_id]) posterMap[r.event_id] = {};
        (posterMap[r.event_id] as any)[r.poster_type] = r.image_url;
      }
      const convocMap: Record<string, ConvocStats> = {};
      (convocRes.data ?? []).forEach(c => {
        if (!convocMap[c.event_id]) convocMap[c.event_id] = { total: 0, accepted: 0, pending: 0, declined: 0, unavailable: 0 };
        convocMap[c.event_id].total++;
        convocMap[c.event_id][c.status as keyof ConvocStats] = ((convocMap[c.event_id][c.status as keyof ConvocStats] as number) ?? 0) + 1;
      });

      const directClubTeamSet = new Set((directEntries ?? []).map(e => `${e.club_id}|${e.team_id ?? ''}`));
      const trainingItemsRaw: SeasonItem[] = sessions.map(s => {
        const cnt         = trainCntMap[s.id] ?? {};
        const entry       = allEntries.find(e => String(e.team_id) === String(s.team_id) && String(e.club_id) === String(s.club_id));
        const childEntry  = childEntries.find(e => String((e as any).club_id) === String(s.club_id) && String((e as any).team_id) === String(s.team_id));
        const isGuardian  = !!childEntry && !directClubTeamSet.has(`${s.club_id}|${s.team_id ?? ''}`);
        const childPlayerId   = isGuardian ? ((childEntry as any).id as string | undefined) : undefined;
        const childPlayerName = isGuardian ? (childEntry?.name ?? undefined) : undefined;
        const childStatus = childPlayerId ? (childAttMap[s.id]?.[childPlayerId] ?? null) : null;
        const myStatus    = isGuardian ? childStatus : (trainStatusMap[s.id] ?? null);
        return { id: s.id, type: 'training', date: s.date, time: s.time ?? '', title: entry?.name ? `Entraînement ${entry.name}` : 'Entraînement', location: s.location ?? '', club_id: s.club_id, status: s.status, team_id: s.team_id, myStatus, presentCount: cnt.present_count ?? 0, absentCount: cnt.absent_count ?? 0, unsureCount: cnt.unsure_count ?? 0, isStaffClub: managedSet.has(String(s.club_id)), isPlayerClub: playerClubSet.has(String(s.club_id)), isGuardian, childPlayerName, childPlayerId, isSupporter: false };
      });

      // Grouper les sessions avec même (club_id, date, time, location) en une seule carte
      const groupMap = new Map<string, SeasonItem[]>();
      for (const item of trainingItemsRaw) {
        const key = `${item.club_id}|${item.date}|${item.time ?? ''}|${item.location ?? ''}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(item);
      }
      const trainingItems: SeasonItem[] = [...groupMap.values()].map(group => {
        if (group.length === 1) return group[0];
        const first = group[0];
        const teams = group.map(s => ({
          sessionId:    String(s.id),
          teamId:       s.team_id ?? null,
          teamName:     s.title.replace('Entraînement ', '').trim() || (s.team_id ?? 'Toutes'),
          presentCount: s.presentCount,
          absentCount:  s.absentCount,
          unsureCount:  s.unsureCount,
          myStatus:     s.myStatus ?? null,
        }));
        return {
          ...first,
          title:        'Entraînement',
          presentCount: group.reduce((sum, s) => sum + s.presentCount, 0),
          absentCount:  group.reduce((sum, s) => sum + s.absentCount,  0),
          unsureCount:  group.reduce((sum, s) => sum + s.unsureCount,  0),
          myStatus:     group.find(s => s.myStatus)?.myStatus ?? null,
          teams,
        };
      });
      const matchItems = events.map(ev => {
        const id = String(ev.id); const cnt = matchCntMap[id] ?? {}; const convocs = convocMap[id] ?? null; const matchScore = matchScoreMap[id] ?? null;
        const clubIdStr   = String(ev.club_id);
        const isCoachClub = coachSet.has(clubIdStr); const isCommClub = commSet.has(clubIdStr); const isOwnerClub = ownerSet.has(clubIdStr);
        const isStaffClub = managedSet.has(clubIdStr); const isPlayerClub = playerClubSet.has(clubIdStr);
        const isGuardian  = !directClubSet.has(clubIdStr) && guardianClubSet.has(clubIdStr);
        const dateStr = String(ev.date).slice(0, 10); const rawTime = String(ev.date).slice(11, 16); const timeStr = rawTime !== '00:00' ? rawTime : '';
        return { id, type: 'match', date: dateStr, time: timeStr, title: String(ev.title ?? ''), location: String(ev.venue ?? ev.city ?? ''), club_id: clubIdStr, sport: String(ev.sport ?? 'Football'), adversaire: String(ev.adversaire ?? ''), event_type: String(ev.event_type ?? ''), category: String(ev.category ?? ''), team_name: String(ev.team_name ?? ''), home_or_away: ev.home_or_away as string | undefined, level: String(ev.level ?? ''), cup_type: String(ev.cup_type ?? ''), score: ev.score, matchScore, myStatus: matchStatusMap[id] ?? null, presentCount: cnt.present_count ?? 0, absentCount: cnt.absent_count ?? 0, unsureCount: cnt.unsure_count ?? 0, convocs, isStaffClub, isCoachClub, isCommClub, isOwnerClub, isPlayerClub, isGuardian, isSupporter: !isStaffClub && !isPlayerClub, posters: posterMap[id] ?? null };
      });

      const merged: SeasonItem[] = [...trainingItems, ...matchItems as SeasonItem[]].sort((a, b) => a.date !== b.date ? (a.date < b.date ? -1 : 1) : (a.time ?? '').localeCompare(b.time ?? ''));

      // Demo: inject a synthetic live match so live-score-pupitre is always visible for coach/president tours
      if (demo) {
        const coachIds = coachKey.split(',').filter(Boolean);
        if (coachIds.length > 0 && !merged.some(m => m.matchScore?.status === 'in_progress')) {
          merged.unshift({
            id: 'demo-live-match',
            type: 'match',
            date: new Date().toISOString().slice(0, 10),
            time: '15:00',
            title: 'FC Brestois vs FC Rival',
            location: 'Stade municipal de Brest',
            club_id: coachIds[0],
            sport: 'Football',
            adversaire: 'FC Rival',
            event_type: 'championship',
            category: 'Senior A',
            team_name: 'Équipe 1',
            home_or_away: 'home',
            level: 'D3 Régionale',
            cup_type: '',
            score: null,
            matchScore: (() => { const h = new Date().getHours(); return (h >= 14 && h < 17) ? { status: 'in_progress', score_home: 2, score_away: 1 } : null; })(),
            myStatus: null,
            presentCount: 12,
            absentCount: 2,
            unsureCount: 1,
            convocs: { total: 15, accepted: 12, pending: 1, declined: 1, unavailable: 1 },
            isStaffClub:  true,
            isCoachClub:  true,
            isCommClub:   false,
            isOwnerClub:  typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sl-demo-profile') === 'president',
            isPlayerClub: false,
            isGuardian:   false,
            isSupporter:  false,
            posters:      null,
          });
        }

        // Entraînement multi-équipes démo
        if (coachIds.length > 0 && !merged.some(m => m.type === 'training' && (m.teams?.length ?? 0) > 1)) {
          const d = new Date(); d.setDate(d.getDate() + 2);
          const dateStr = d.toISOString().slice(0, 10);
          merged.push({
            id: 'demo-training-multi', type: 'training', date: dateStr, time: '18:30',
            title: 'Entraînement', location: 'Gymnase municipal de Brest', club_id: coachIds[0],
            status: 'active', team_id: null, myStatus: null,
            presentCount: 25, absentCount: 5, unsureCount: 2,
            isStaffClub: true, isPlayerClub: false, isGuardian: false, isSupporter: false,
            teams: [
              { sessionId: 'demo-ts-seniors', teamId: 'seniors', teamName: 'Seniors A', presentCount: 14, absentCount: 2, unsureCount: 1, myStatus: null },
              { sessionId: 'demo-ts-u17',     teamId: 'u17',     teamName: 'U17',       presentCount: 11, absentCount: 3, unsureCount: 1, myStatus: null },
            ],
          });
        }
      }

      matchEventIdsRef.current = new Set(matchItems.map(m => String(m.id)));
      const teamFiltered = teamFilter.length
        ? merged.filter(item =>
            item.type !== 'match' ||
            teamFilter.some(f => item.team_name === f || item.category === f)
          )
        : merged;
      setItems(teamFiltered); setLoading(false);
    }
    load().catch(err => { console.error('[SeasonPlanning] load error:', err); if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, clubIdKey, managedKey, coachKey, commKey, firstDay, lastDay, clubFilter, teamFilter.join(',')]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`season-planning-scores-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'match_scores' }, ({ new: row }: { new: DBRow }) => {
        if (!matchEventIdsRef.current.has(String(row.event_id))) return;
        setItems(prev => prev.map(item => item.id === row.event_id ? { ...item, matchScore: { status: row.status as string, score_home: row.score_home as number | null, score_away: row.score_away as number | null } } : item));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_scores' }, ({ new: row }: { new: DBRow }) => {
        if (!matchEventIdsRef.current.has(String(row.event_id))) return;
        setItems(prev => prev.map(item => item.id === row.event_id ? { ...item, matchScore: { status: row.status as string, score_home: row.score_home as number | null, score_away: row.score_away as number | null } } : item));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const respond = useCallback(async (type: 'training' | 'match', id: string, status: string, playerId?: string | null) => {
    if (!userId || !status) return;
    setItems(prev => prev.map(item => item.id === id ? { ...item, myStatus: status } : item));
    const table = type === 'training' ? 'training_attendance' : 'match_player_attendance';
    let payload: Record<string, unknown>;
    let conflict: string;
    if (type === 'training' && playerId) {
      // Parent répond pour son enfant → conflit sur (session_id, player_id)
      payload  = { session_id: id, user_id: userId, player_id: playerId, status, responded_by: userId, updated_at: new Date().toISOString() };
      conflict = 'session_id,player_id';
    } else if (type === 'training') {
      payload  = { session_id: id, user_id: userId, status, updated_at: new Date().toISOString() };
      conflict = 'session_id,user_id';
    } else {
      payload  = { event_id: id, user_id: userId, status, updated_at: new Date().toISOString() };
      conflict = 'event_id,user_id';
    }
    const { error } = await supabase.from(table).upsert(payload as any, { onConflict: conflict }) as { error: { message: string } | null };
    if (error) { console.error('[SeasonPlanning] respond failed:', error.message); setItems(prev => prev.map(item => item.id === id ? { ...item, myStatus: null } : item)); }
  }, [userId]);

  const updateMatchScore = useCallback((eventId: string, scoreData: MatchScore) => {
    setItems(prev => prev.map(item => item.id === eventId ? { ...item, matchScore: scoreData } : item));
  }, []);

  return { items, loading, respond, updateMatchScore };
}
