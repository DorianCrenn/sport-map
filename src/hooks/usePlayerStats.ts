import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export interface PlayerMatchStat {
  id?:            string;
  eventId:        string;
  playerId:       string;
  clubId:         string;
  status:         'present' | 'absent' | 'unsure' | 'not_called';
  goals:          number;
  assists:        number;
  yellowCards:    number;
  redCards:       number;
  minutesPlayed?: number | null;
}

export interface PlayerSeasonStat {
  playerId:      string;
  clubId:        string;
  playerName:    string;
  jerseyNumber?: number | null;
  position?:     string | null;
  matchesTotal:  number;
  matchesPlayed: number;
  totalGoals:    number;
  totalAssists:  number;
  totalYellow:   number;
  totalRed:      number;
}

function mapFromDB(row: Record<string, any>): PlayerMatchStat {
  return {
    id:            row.id,
    eventId:       row.event_id,
    playerId:      row.player_id,
    clubId:        row.club_id,
    status:        row.status ?? 'present',
    goals:         row.goals ?? 0,
    assists:       row.assists ?? 0,
    yellowCards:   row.yellow_cards ?? 0,
    redCards:      row.red_cards ?? 0,
    minutesPlayed: row.minutes_played ?? null,
  };
}

// ── Stats par match (pour saisie admin post-match) ────────────────────────────

export function useMatchStats(eventId: string | null) {
  const [stats,   setStats]   = useState<PlayerMatchStat[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) { setStats([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('player_match_stats')
      .select('*')
      .eq('event_id', eventId);
    setStats((data ?? []).map(mapFromDB));
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  async function upsertStat(stat: Omit<PlayerMatchStat, 'id'>): Promise<void> {
    await supabase.from('player_match_stats').upsert({
      event_id:       stat.eventId,
      player_id:      stat.playerId,
      club_id:        stat.clubId,
      status:         stat.status,
      goals:          stat.goals,
      assists:        stat.assists,
      yellow_cards:   stat.yellowCards,
      red_cards:      stat.redCards,
      minutes_played: stat.minutesPlayed ?? null,
    }, { onConflict: 'event_id,player_id' });
    await load();
  }

  async function bulkUpsert(stats: Omit<PlayerMatchStat, 'id'>[]): Promise<void> {
    if (!stats.length) return;
    await supabase.from('player_match_stats').upsert(
      stats.map(s => ({
        event_id:       s.eventId,
        player_id:      s.playerId,
        club_id:        s.clubId,
        status:         s.status,
        goals:          s.goals,
        assists:        s.assists,
        yellow_cards:   s.yellowCards,
        red_cards:      s.redCards,
        minutes_played: s.minutesPlayed ?? null,
      })),
      { onConflict: 'event_id,player_id' }
    );
    await load();
  }

  return { stats, loading, upsertStat, bulkUpsert, refresh: load };
}

// ── Stats de saison (pour ProfilPage et classement) ──────────────────────────

export function usePlayerSeasonStats(clubId: string | null) {
  const [stats,   setStats]   = useState<PlayerSeasonStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) { setStats([]); return; }
    setLoading(true);
    supabase
      .from('player_season_stats')
      .select('*')
      .eq('club_id', clubId)
      .then(({ data }) => {
        setStats((data ?? []).map((r: any) => ({
          playerId:      r.player_id,
          clubId:        r.club_id,
          playerName:    r.player_name ?? '?',
          jerseyNumber:  r.jersey_number,
          position:      r.position,
          matchesTotal:  Number(r.matches_total ?? 0),
          matchesPlayed: Number(r.matches_played ?? 0),
          totalGoals:    Number(r.total_goals ?? 0),
          totalAssists:  Number(r.total_assists ?? 0),
          totalYellow:   Number(r.total_yellow ?? 0),
          totalRed:      Number(r.total_red ?? 0),
        })));
        setLoading(false);
      });
  }, [clubId]);

  return { stats, loading };
}

// ── Stats d'un joueur individuel (pour sa ProfilPage) ────────────────────────

export function useMyPlayerStats(userId: string | null) {
  const [stats,   setStats]   = useState<PlayerSeasonStat | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setStats(null); return; }
    setLoading(true);
    supabase
      .from('club_players')
      .select('id, club_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
      .then(async ({ data: cp }) => {
        if (!cp) { setStats(null); setLoading(false); return; }
        const { data } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', cp.id)
          .eq('club_id', cp.club_id)
          .maybeSingle();
        if (data) {
          setStats({
            playerId:      data.player_id,
            clubId:        data.club_id,
            playerName:    data.player_name ?? '?',
            jerseyNumber:  data.jersey_number,
            position:      data.position,
            matchesTotal:  Number(data.matches_total ?? 0),
            matchesPlayed: Number(data.matches_played ?? 0),
            totalGoals:    Number(data.total_goals ?? 0),
            totalAssists:  Number(data.total_assists ?? 0),
            totalYellow:   Number(data.total_yellow ?? 0),
            totalRed:      Number(data.total_red ?? 0),
          });
        }
        setLoading(false);
      });
  }, [userId]);

  return { stats, loading };
}
