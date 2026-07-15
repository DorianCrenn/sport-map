import { DEMO_CLUB_ID } from './club.js';
import { demoPlayers } from './players.js';

export const demoStats = {
  clubId:   DEMO_CLUB_ID,
  followers: 342,
  viewsByWeek: [
    { week: 'S-7', count: 23 },
    { week: 'S-6', count: 31 },
    { week: 'S-5', count: 18 },
    { week: 'S-4', count: 42 },
    { week: 'S-3', count: 38 },
    { week: 'S-2', count: 29 },
    { week: 'S-1', count: 45 },
    { week: 'Cette semaine', count: 12 },
  ],
  topEvents: [
    { event_id: 'demo-event-012', count: 31 },
    { event_id: 'demo-event-001', count: 28 },
    { event_id: 'demo-event-013', count: 19 },
    { event_id: 'demo-event-003', count: 22 },
    { event_id: 'demo-event-004', count: 12 },
  ],
  posterExports:  6,
  socialShares:   18,
  newFollowersThisMonth: 24,
  // Données enrichies
  monthlyFollowerGrowth: [
    { month: 'juil', count: 12 }, { month: 'août', count: 18 },
    { month: 'sep',  count: 31 }, { month: 'oct',  count: 22 },
    { month: 'nov',  count: 19 }, { month: 'déc',  count: 14 },
    { month: 'jan',  count: 28 }, { month: 'fév',  count: 35 },
    { month: 'mar',  count: 42 }, { month: 'avr',  count: 38 },
    { month: 'mai',  count: 47 }, { month: 'juin', count: 24 },
  ],
  participationByTeam: {
    'Équipe 1': 82, 'Réserve': 71, 'U17': 88,
    'U15': 79, 'Équipe F': 85,
  },
  posterFormatDistribution: { story: 3, square: 2, landscape: 1 },
};

// Pour useClubPageViews — format attendu par le hook
export const demoPageViews = Array.from({ length: 8 }, (_, i) => ({
  id:       `demo-pv-${i}`,
  club_id:  DEMO_CLUB_ID,
  week_start: new Date(Date.now() - (7 - i) * 7 * 86400000).toISOString().slice(0, 10),
  count:    demoStats.viewsByWeek[i]?.count ?? 0,
}));

// Pour useClubDashboard — poster_exports du mois
export const demoPosterExports = Array.from({ length: 6 }, (_, i) => ({
  id:         `demo-pe-${i}`,
  club_id:    DEMO_CLUB_ID,
  event_id:   `demo-event-0${(i % 8) + 1}`,
  user_id:    'demo-user-001',
  format:     ['story', 'square', 'landscape'][i % 3],
  channel:    ['whatsapp', 'instagram', 'facebook'][i % 3],
  created_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}));

// Pour useClubFollows — abonnés du club
export const demoClubFollows = Array.from({ length: 342 }, (_, i) => ({
  user_id:  `demo-follower-${i}`,
  club_id:  DEMO_CLUB_ID,
  teams:    'all',
  notif:    { match: true, news: true },
}));

// ── Stats de saison démo (onglet « Saison » du club) ─────────────────────────
// Générées de façon DÉTERMINISTE (stables) depuis l'effectif Équipe 1, avec une
// distribution réaliste par poste (attaquants marquent, gardiens non, etc.).
function rnd(seed) { const x = Math.sin(seed * 127.1) * 43758.5453; return x - Math.floor(x); }
function categoryOf(pos) {
  const p = (pos || '').toLowerCase();
  if (p.includes('gardien')) return 'gk';
  if (p.includes('attaquant') || p.includes('avant') || p.includes('buteur')) return 'fw';
  if (p.includes('ailier')) return 'wg';
  if (p.includes('offensif')) return 'am';
  if (p.includes('défenseur') || p.includes('latéral') || p.includes('lateral') || p.includes('arrière')) return 'df';
  return 'mf';
}
const GOAL_MAX   = { gk: 0, df: 3, mf: 6, am: 11, wg: 10, fw: 17 };
const ASSIST_MAX = { gk: 0, df: 3, mf: 7, am: 10, wg: 9,  fw: 6  };

// Généré pour toutes les équipes qui ont assez de joueurs (pour démontrer le
// filtre par équipe). Le seed intègre l'équipe → stats stables et distinctes.
const teamCounts = demoPlayers.reduce((acc, pl) => {
  acc[pl.team_name] = (acc[pl.team_name] ?? 0) + 1; return acc;
}, {} as Record<string, number>);

export const demoSeasonStats = demoPlayers
  .filter(pl => (teamCounts[pl.team_name] ?? 0) >= 7)
  .map((pl, i) => {
    const cat = categoryOf(pl.position);
    const s   = (pl.number ?? 0) + i * 0.31 + 1;
    const matchesTotal  = 14 + Math.floor(rnd(s) * 8);                                            // 14–21
    const matchesPlayed = Math.min(matchesTotal, Math.round(matchesTotal * (0.5 + rnd(s + 10) * 0.5)));
    return {
      playerId:      pl.id,
      clubId:        DEMO_CLUB_ID,
      playerName:    pl.name,
      jerseyNumber:  pl.number,
      position:      pl.position,
      teamId:        pl.team_id,
      matchesTotal,
      matchesPlayed,
      totalGoals:    Math.floor(rnd(s + 20) * (GOAL_MAX[cat]   + 1)),
      totalAssists:  Math.floor(rnd(s + 30) * (ASSIST_MAX[cat] + 1)),
      totalYellow:   Math.floor(rnd(s + 40) * 5),
      totalRed:      rnd(s + 50) > 0.88 ? 1 : 0,
    };
  });
