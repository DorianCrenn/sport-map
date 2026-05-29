import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyAnnouncements } from '../hooks/useMyAnnouncements.js';
import { timeAgo } from '../lib/dateUtils.js';

const TYPE_META = {
  urgent: { label: 'URGENT', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🚨' },
  info:   { label: 'INFO',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: 'ℹ️' },
  result: { label: 'RÉSULTAT', color: '#22d96a', bg: 'rgba(34,217,106,0.12)', icon: '⚽' },
  event:  { label: 'ÉVÉNEMENT', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: '🎉' },
};

export default function AnnouncementsCenter({ onClose }) {
  const { announcements, readIds, unreadCount, loading, markRead, markAllRead } = useMyAnnouncements();

  // Auto mark-read on open after a delay
  useEffect(() => {
    if (unreadCount > 0) {
      const t = setTimeout(() => markAllRead(), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)', zIndex: 1200 }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
              🔔 Annonces clubs
            </h1>
            <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: '2px 0 0' }}>
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', background: 'none', border: '1px solid rgba(59,130,246,0.3)', padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}>
              Tout lire
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px calc(32px + env(safe-area-inset-bottom, 0px))' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sl-t3)', fontSize: 13 }}>Chargement…</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 8 }}>Aucune annonce</div>
            <div style={{ fontSize: 13, color: 'var(--sl-t3)', lineHeight: 1.6 }}>
              Suivez des clubs pour recevoir leurs annonces de match, résultats et événements.
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {announcements.map((ann, i) => {
              const meta = TYPE_META[ann.type] ?? TYPE_META.info;
              const isRead = readIds.has(ann.id);
              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !isRead && markRead(ann.id)}
                  style={{
                    borderRadius: 16, padding: '14px', marginBottom: 10,
                    backgroundColor: isRead ? 'var(--sl-surface)' : 'var(--sl-card)',
                    border: `1px solid ${isRead ? 'var(--sl-border)' : meta.color + '30'}`,
                    cursor: isRead ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Club + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--sl-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--sl-t2)', flexShrink: 0 }}>
                        {(ann.clubName ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t2)' }}>{ann.clubName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, backgroundColor: meta.bg, color: meta.color }}>
                        {meta.icon} {meta.label}
                      </span>
                      {!isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: meta.color, flexShrink: 0 }} />}
                    </div>
                  </div>

                  {/* Message */}
                  <p style={{ fontSize: 14, fontWeight: isRead ? 400 : 600, color: 'var(--sl-t1)', margin: 0, lineHeight: 1.5 }}>
                    {ann.message}
                  </p>

                  {/* Target + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    {ann.targetTeams.length > 0 ? (
                      <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>→ {ann.targetTeams.join(', ')}</span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Tous les abonnés</span>
                    )}
                    <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{timeAgo(ann.createdAt)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
