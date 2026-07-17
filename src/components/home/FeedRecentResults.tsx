import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';

const SPORT_EMOJI: Record<string, string> = {
  Football: '⚽', Basketball: '🏀', Rugby: '🏉', Handball: '🤾',
  Tennis: '🎾', Volleyball: '🏐', Hockey: '🏑', Natation: '🏊',
};

function fmtDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface ResultItem {
  id:         string;
  date:       string;
  sport:      string;
  clubName:   string;
  adversaire: string;
  scoreHome:  number;
  scoreAway:  number;
  isHome:     boolean;
}

interface FeedRecentResultsProps {
  clubIds: string[];
}

export default function FeedRecentResults({ clubIds }: FeedRecentResultsProps) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubIds.length) { setLoading(false); return; }
    let cancelled = false;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const today        = new Date().toISOString().slice(0, 10);

    supabase
      .from('events')
      .select('id, date, sport, adversaire, home_or_away, club_id, clubs(name)')
      .in('club_id', clubIds)
      .gte('date', sevenDaysAgo)
      .lte('date', today)
      .in('event_type', ['match', 'friendly', 'championship', 'cup'])
      .order('date', { ascending: false })
      .limit(8)
      .then(async ({ data: events }) => {
        if (cancelled || !events?.length) { if (!cancelled) setLoading(false); return; }

        const ids = events.map((e: any) => e.id);
        const { data: scores } = await supabase
          .from('match_scores')
          .select('event_id, score_home, score_away')
          .in('event_id', ids)
          .eq('status', 'final');

        if (cancelled) return;

        const scoreMap: Record<string, { score_home: number; score_away: number }> = {};
        for (const s of scores ?? []) scoreMap[s.event_id] = s;

        const built: ResultItem[] = events
          .filter(e => scoreMap[e.id])
          .map(e => ({
            id:         String(e.id),
            date:       String(e.date),
            sport:      String(e.sport ?? ''),
            clubName:   String((e.clubs as any)?.name ?? ''),
            adversaire: String(e.adversaire ?? 'Adversaire'),
            scoreHome:  scoreMap[e.id].score_home,
            scoreAway:  scoreMap[e.id].score_away,
            isHome:     e.home_or_away !== 'away',
          }))
          .slice(0, 4);

        setResults(built);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [clubIds.join(',')]);

  if (loading || !results.length) return null;

  return (
    <div style={{ padding: '10px 16px 0' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 10 }}>
        Derniers résultats
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
        {results.map((r, i) => {
          const emoji  = SPORT_EMOJI[r.sport] ?? '🏆';
          const myScore  = r.isHome ? r.scoreHome : r.scoreAway;
          const oppScore = r.isHome ? r.scoreAway  : r.scoreHome;
          const won      = myScore > oppScore;
          const draw     = myScore === oppScore;
          const resultColor = won ? '#22d96a' : draw ? '#f59e0b' : '#ef4444';
          const resultLabel = won ? 'V' : draw ? 'N' : 'D';

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                flexShrink: 0, minWidth: 160, borderRadius: 'var(--sl-radius-2xl)',
                padding: '10px 12px',
                backgroundColor: 'var(--sl-card)',
                border: `1px solid ${resultColor}30`,
                borderLeft: `3px solid ${resultColor}`,
              }}
            >
              {/* Sport + date */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{emoji}</span>
                <span style={{ fontSize: 9, color: 'var(--sl-t3)', fontWeight: 600 }}>
                  {fmtDate(r.date)}
                </span>
              </div>

              {/* Équipes */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.clubName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                vs {r.adversaire}
              </div>

              {/* Score + badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 18, fontWeight: 900, color: 'var(--sl-t1)',
                  fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {r.scoreHome} <span style={{ color: 'var(--sl-t3)', fontSize: 14 }}>–</span> {r.scoreAway}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 900, width: 22, height: 22,
                  borderRadius: 'var(--sl-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${resultColor}20`, color: resultColor,
                }}>
                  {resultLabel}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
