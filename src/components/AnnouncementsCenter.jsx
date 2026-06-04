import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyAnnouncements } from '../hooks/useMyAnnouncements.js';
import AnnouncementCard from './AnnouncementCard.jsx';

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
            {announcements.map((ann) => (
              <AnnouncementCard
                key={ann.id}
                ann={ann}
                variant="center"
                isRead={readIds.has(ann.id)}
                onRead={markRead}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
