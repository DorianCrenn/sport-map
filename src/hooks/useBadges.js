import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

// ── Badge definitions ──────────────────────────────────────────────────────────

export const BADGE_DEFS = {
  first_step: {
    id: 'first_step',
    name: 'Premier pas',
    description: 'Première participation à un événement sportif',
    icon: '🎯',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.45)',
    threshold: '1 participation',
    xp: 50,
  },
  explorer: {
    id: 'explorer',
    name: 'Explorateur',
    description: 'Participations dans 3 sports différents',
    icon: '🧭',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.45)',
    threshold: '3 sports',
    xp: 100,
  },
  loyal_fan: {
    id: 'loyal_fan',
    name: 'Fan fidèle',
    description: '5 participations dans le même club',
    icon: '❤️',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.45)',
    threshold: '5 fois dans un club',
    xp: 150,
  },
  streak_3: {
    id: 'streak_3',
    name: 'Sur la lancée',
    description: '3 événements consécutifs dans le même club (dans les 60 jours)',
    icon: '🔥',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.45)',
    threshold: '3 matchs de suite',
    xp: 200,
  },
  streak_5: {
    id: 'streak_5',
    name: 'Indéfectible',
    description: '5 événements consécutifs dans le même club (dans les 90 jours)',
    icon: '⚡',
    color: '#eab308',
    glow: 'rgba(234,179,8,0.45)',
    threshold: '5 matchs de suite',
    xp: 350,
  },
  veteran: {
    id: 'veteran',
    name: 'Vétéran',
    description: '10 participations au total',
    icon: '🏆',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.45)',
    threshold: '10 participations',
    xp: 500,
  },
  champion: {
    id: 'champion',
    name: 'Champion',
    description: '25 participations au total — le sommet !',
    icon: '🥇',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.45)',
    threshold: '25 participations',
    xp: 1000,
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    description: '3 pronostics corrects — tu lis l\'avenir !',
    icon: '🔮',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.45)',
    threshold: '3 bons pronostics',
    xp: 150,
  },
};

// ── XP / Levels ────────────────────────────────────────────────────────────────

export const LEVELS = [
  { level: 1, name: 'Rookie',     minXp: 0    },
  { level: 2, name: 'Amateur',    minXp: 100  },
  { level: 3, name: 'Confirmé',   minXp: 300  },
  { level: 4, name: 'Expérimenté',minXp: 600  },
  { level: 5, name: 'Expert',     minXp: 1000 },
  { level: 6, name: 'Élite',      minXp: 1500 },
  { level: 7, name: 'Légende',    minXp: 2500 },
];

export function computeXP(earned, attendingSize = 0) {
  const badgeXP = earned.reduce((sum, id) => sum + (BADGE_DEFS[id]?.xp ?? 0), 0);
  const participationXP = Math.min(attendingSize * 10, 500);
  return badgeXP + participationXP;
}

export function getLevel(xp) {
  let current = LEVELS[0];
  for (const tier of LEVELS) {
    if (xp >= tier.minXp) current = tier;
    else break;
  }
  const nextIdx = LEVELS.indexOf(current) + 1;
  const next = LEVELS[nextIdx] ?? null;
  const progress = next
    ? Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp))
    : 1;
  return { ...current, xp, nextLevel: next, progress };
}

export const BADGE_ORDER = ['first_step', 'explorer', 'loyal_fan', 'streak_3', 'streak_5', 'veteran', 'oracle', 'champion'];

// ── Badge computation ──────────────────────────────────────────────────────────

export function computeEarned(attending, allEvents, correctPredictions = 0) {
  if (!attending || attending.size === 0) return [];

  const attendedIds = [...attending].map(String);
  const attendedEvents = allEvents
    .filter(e => attendedIds.includes(String(e.id)))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const total = attending.size;
  const sports = new Set(attendedEvents.map(e => e.sport).filter(Boolean));

  // Comptes par club
  const clubCounts = {};
  attendedEvents.forEach(e => {
    const cid = e.clubId ?? e.club_id ?? null;
    if (cid) clubCounts[String(cid)] = (clubCounts[String(cid)] || 0) + 1;
  });

  // Calcul de streak par club : séquences d'événements consécutifs dans les N jours
  const maxStreak = computeMaxStreak(attendedEvents);

  const earned = [];
  if (total >= 1)  earned.push('first_step');
  if (sports.size >= 3) earned.push('explorer');
  if (Object.values(clubCounts).some(c => c >= 5)) earned.push('loyal_fan');
  if (maxStreak >= 3) earned.push('streak_3');
  if (maxStreak >= 5) earned.push('streak_5');
  if (total >= 10) earned.push('veteran');
  if (correctPredictions >= 3) earned.push('oracle');
  if (total >= 25) earned.push('champion');
  return earned;
}

/**
 * Calcul du streak maximal : nombre maximal d'événements consécutifs dans
 * le même club espacés de moins de 45 jours chacun.
 */
function computeMaxStreak(sortedEvents) {
  // Grouper par club
  const byClub = {};
  sortedEvents.forEach(e => {
    const cid = String(e.clubId ?? e.club_id ?? '');
    if (!cid) return;
    if (!byClub[cid]) byClub[cid] = [];
    byClub[cid].push(new Date(e.date));
  });

  let maxStreak = 0;
  const MAX_GAP_MS = 45 * 24 * 3600 * 1000; // 45 jours

  Object.values(byClub).forEach(dates => {
    dates.sort((a, b) => a - b);
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] - dates[i - 1] <= MAX_GAP_MS) {
        streak++;
      } else {
        streak = 1;
      }
      if (streak > maxStreak) maxStreak = streak;
    }
    if (dates.length > 0 && 1 > maxStreak) maxStreak = 1;
  });

  return maxStreak;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBadges({ attending, allEvents }) {
  const { currentUser, updateProfile } = useAuth();
  const [correctPredictions, setCorrectPredictions] = useState(0);

  // Charge le nombre de pronostics corrects (event terminé + score connu + bonne prédiction)
  useEffect(() => {
    if (!currentUser?.id) return;
    supabase
      .from('event_predictions')
      .select('prediction, events!inner(score, date)')
      .eq('user_id', currentUser.id)
      .not('events.score', 'is', null)
      .then(({ data }) => {
        if (!data) return;
        const count = data.filter(row => {
          const score = row.events?.score;
          if (!score || score.home == null || score.away == null) return false;
          if (row.prediction === 'home') return score.home > score.away;
          if (row.prediction === 'away') return score.away > score.home;
          if (row.prediction === 'draw') return score.home === score.away;
          return false;
        }).length;
        setCorrectPredictions(count);
      });
  }, [currentUser?.id]);

  const earned = useMemo(
    () => computeEarned(attending, allEvents, correctPredictions),
    [attending, allEvents, correctPredictions]
  );

  const levelInfo = useMemo(
    () => getLevel(computeXP(earned, attending?.size ?? 0)),
    [earned, attending]
  );

  // Stable string for deps comparison (avoids array reference churn)
  const storedKey = (currentUser?.badges ?? []).join(',');

  const newBadges = useMemo(() => {
    if (!currentUser || earned.length === 0) return [];
    const stored = new Set(currentUser?.badges ?? []);
    return earned.filter(b => !stored.has(b));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earned, currentUser?.id, storedKey]);

  async function markSeen() {
    if (!currentUser) return;
    // Persist all earned badges to Supabase — cross-device consistent
    await updateProfile({ badges: earned, xp: levelInfo.xp });
  }

  return { earned, newBadges, markSeen, ...levelInfo };
}
