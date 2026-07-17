import { useEffect } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyAnnouncements } from '../hooks/useMyAnnouncements.js';
import AnnouncementCard from './AnnouncementCard.jsx';
import { Z } from '../constants/zIndex.js';
import { IconBell } from './icons.js';

interface AnnouncementsCenterProps { onClose: () => void; }

export default function AnnouncementsCenter({ onClose }: AnnouncementsCenterProps) {
  const { announcements, readIds, unreadCount, loading, markRead, markAllRead } = useMyAnnouncements();

  useEffect(() => {
    if (unreadCount > 0) {
      const t = setTimeout(() => (markAllRead as () => void)(), 3000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAndroidBack(true, onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Annonces clubs" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 36 }} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)', zIndex: Z.announcementsPanel }}>
      <div style={{ flexShrink: 0, backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose} aria-label="Retour" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-lg)', border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}><IconBell size={18} color="var(--sl-green)" /> Annonces clubs</h1>
            <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: '2px 0 0' }}>{unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead as () => void} style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', background: 'none', border: '1px solid rgba(59,130,246,0.3)', padding: '10px 12px', borderRadius: 'var(--sl-radius-md)', cursor: 'pointer' }}>Tout lire</button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px calc(32px + env(safe-area-inset-bottom, 0px))' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sl-t3)', fontSize: 13 }}>Chargement…</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <IconBell size={48} color="var(--sl-t3)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 8 }}>Aucune annonce</div>
            <div style={{ fontSize: 13, color: 'var(--sl-t3)', lineHeight: 1.6 }}>Suivez des clubs pour recevoir leurs annonces de match, résultats et événements.</div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {announcements.map((ann) => (
              <AnnouncementCard key={ann.id} ann={ann} variant="center" isRead={(readIds as Set<any>).has(ann.id)} onRead={markRead as (id: any) => void} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
