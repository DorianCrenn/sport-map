import { memo } from 'react';
import { motion } from 'framer-motion';
import { useActiveClubs } from '../hooks/useActiveClubs.js';
import SportIcon from './SportIcon.jsx';
import { SkeletonLeaderboardRow } from './Skeleton.jsx';

const MEDAL = ['🥇', '🥈', '🥉'];

function LeaderboardRow({ entry, rank, index }) {
  const medal = MEDAL[rank] ?? null;
  const initials = entry.name
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.18 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 0',
        borderBottom: '1px solid var(--sl-border)',
      }}
    >
      {/* Rank */}
      <div style={{
        width: 24, flexShrink: 0, textAlign: 'center',
        fontSize: medal ? 15 : 11, fontWeight: 700,
        color: medal ? 'inherit' : 'var(--sl-t3)',
      }}>
        {medal ?? `${rank + 1}`}
      </div>

      {/* Logo / initials */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        backgroundColor: 'var(--sl-surface)',
        border: '1px solid var(--sl-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        fontSize: 10, fontWeight: 700, color: 'var(--sl-t2)',
      }}>
        {entry.logo_url
          ? <img src={entry.logo_url} alt={entry.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : initials}
      </div>

      {/* Club info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <SportIcon sport={entry.sport} size={10} color="var(--sl-t3)" />
          <span>{entry.sport}</span>
          {entry.city && <><span>·</span><span>{entry.city}</span></>}
        </div>
      </div>

      {/* Event count */}
      <div style={{
        flexShrink: 0, textAlign: 'right',
        padding: '4px 10px', borderRadius: 8,
        backgroundColor: 'rgba(34,217,106,0.1)',
        border: '1px solid rgba(34,217,106,0.2)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-green)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {entry.count}
        </div>
        <div style={{ fontSize: 8, color: 'var(--sl-t3)', marginTop: 1 }}>
          {entry.count > 1 ? 'matchs' : 'match'}
        </div>
      </div>
    </motion.div>
  );
}

function ClubLeaderboard() {
  const { ranking, loading } = useActiveClubs({ limit: 10 });

  const now   = new Date();
  const month = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div style={{
      borderRadius: 16, backgroundColor: 'var(--sl-card)',
      border: '1px solid var(--sl-border)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--sl-border)',
        background: 'linear-gradient(135deg, var(--sl-card) 0%, rgba(34,217,106,0.05) 100%)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          backgroundColor: 'rgba(34,217,106,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>
          🏆
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>
            Clubs les plus actifs
          </div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)', textTransform: 'capitalize' }}>
            {month}
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 16px 8px' }}>
        {loading ? (
          <div aria-label="Chargement du classement">
            {[0, 1, 2, 3].map(i => <SkeletonLeaderboardRow key={i} />)}
          </div>
        ) : ranking.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--sl-t3)', fontSize: 12 }}>
            Aucun événement ce mois-ci
          </div>
        ) : (
          ranking.map((entry, i) => (
            <LeaderboardRow key={entry.clubId} entry={entry} rank={i} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(ClubLeaderboard);
