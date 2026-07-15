import type { PlayerSeasonStat } from '../../../hooks/usePlayerStats.js';

export type Metric = 'goals' | 'assists' | 'presence' | 'cards';

export function presenceRate(p: PlayerSeasonStat): number {
  return p.matchesTotal > 0 ? p.matchesPlayed / p.matchesTotal : 0;
}

export function metricValue(p: PlayerSeasonStat, m: Metric): number {
  switch (m) {
    case 'goals':    return p.totalGoals;
    case 'assists':  return p.totalAssists;
    case 'presence': return presenceRate(p);
    case 'cards':    return p.totalYellow + p.totalRed;
  }
}

// Classement décroissant. Buts/passes/cartons : seuls les joueurs concernés (>0).
// Présence : tous ceux ayant au moins un match convoqué (matchesTotal > 0).
export function rankBy(stats: PlayerSeasonStat[], m: Metric): PlayerSeasonStat[] {
  const arr = [...stats].sort((a, b) => metricValue(b, m) - metricValue(a, m));
  return m === 'presence'
    ? arr.filter(p => p.matchesTotal > 0)
    : arr.filter(p => metricValue(p, m) > 0);
}
