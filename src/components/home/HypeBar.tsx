import { useMemo } from 'react';
import { shouldShowHypeBar } from '../../lib/progressiveDisclosure.js';

interface HypeBarProps {
  liveCount?: number;
  totalToday?: number;
  clubCount?: number;
  upcomingThisWeek?: number;
}

export default function HypeBar({
  liveCount = 0,
  totalToday = 0,
  clubCount = 0,
  upcomingThisWeek = 0,
}: HypeBarProps) {
  const segments = useMemo(() => {
    const s: string[] = [];
    if (liveCount > 0) s.push(`🔴 ${liveCount} en direct`);
    if (totalToday > 0) s.push(`⚡ ${totalToday} inscrits aujourd'hui`);
    if (upcomingThisWeek > 0) s.push(`📅 ${upcomingThisWeek} matchs cette semaine`);
    if (clubCount > 0) s.push(`🏟️ ${clubCount} clubs actifs`);
    return s;
  }, [liveCount, totalToday, clubCount, upcomingThisWeek]);

  // Divulgation progressive : rien de réel à montrer → on masque (pas de filler).
  if (!shouldShowHypeBar(segments.length)) return null;

  const repeated = [...segments, ...segments];

  return (
    <div
      aria-label="Activité en cours"
      style={{
        overflow: 'hidden',
        background: 'linear-gradient(90deg, rgba(34,217,106,0.06) 0%, rgba(77,166,255,0.06) 100%)',
        borderBottom: '1px solid rgba(34,217,106,0.1)',
        height: 30,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="sl-ticker-track" aria-hidden="true">
        {repeated.map((seg, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--sl-t2)',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--sl-font-brand)',
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            {seg}
          </span>
        ))}
      </div>
    </div>
  );
}
