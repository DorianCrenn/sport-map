import { memo } from 'react';
import { motion } from 'framer-motion';
import { useUserLeaderboard } from '../hooks/useUserLeaderboard.js';
import { LEVELS, getLevel } from '../hooks/useBadges.js';
import { Skeleton } from './Skeleton.jsx';

const MEDAL = ['🥇', '🥈', '🥉'];

function UserRow({ user, rank, index }) {
  const medal = MEDAL[rank] ?? null;
  const xp = user.xp ?? 0;
  const { level, name: levelName, progress, nextLevel } = getLevel(xp);
  const initials = (user.name ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.18 }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--sl-border)' }}
    >
      <div style={{ width: 24, flexShrink: 0, textAlign: 'center', fontSize: medal ? 15 : 11, fontWeight: 700, color: medal ? 'inherit' : 'var(--sl-t3)' }}>
        {medal ?? `${rank + 1}`}
      </div>

      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)',
      }}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt={user.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name ?? 'Anonyme'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Niv. {level} · {levelName}</span>
          <div style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'var(--sl-border)', maxWidth: 60 }}>
            <div style={{ height: '100%', borderRadius: 2, backgroundColor: 'var(--sl-green)', width: `${progress * 100}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right', padding: '4px 10px', borderRadius: 8, backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#8b5cf6', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{xp}</div>
        <div style={{ fontSize: 8, color: 'var(--sl-t3)', marginTop: 1 }}>XP</div>
      </div>
    </motion.div>
  );
}

function UserLeaderboard() {
  const { ranking, loading } = useUserLeaderboard({ limit: 10 });

  return (
    <div style={{ borderRadius: 16, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--sl-border)',
        background: 'linear-gradient(135deg, var(--sl-card) 0%, rgba(139,92,246,0.05) 100%)',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, backgroundColor: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          ⚡
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Classement XP</div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Top membres actifs</div>
        </div>
      </div>

      <div style={{ padding: '4px 16px 8px' }}>
        {loading ? (
          <div aria-label="Chargement du classement">
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--sl-border)' }}>
                <Skeleton width={24} height={14} radius={4} />
                <Skeleton width={34} height={34} radius={10} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Skeleton width="60%" height={12} radius={4} />
                  <Skeleton width="40%" height={10} radius={4} />
                </div>
                <Skeleton width={48} height={38} radius={8} />
              </div>
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--sl-t3)', fontSize: 12 }}>
            Aucun membre pour l'instant
          </div>
        ) : (
          ranking.map((user, i) => <UserRow key={user.id} user={user} rank={i} index={i} />)
        )}
      </div>
    </div>
  );
}

export default memo(UserLeaderboard);
