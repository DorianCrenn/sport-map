import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '../../lib/dateUtils.js';
import type { MyAnnouncement } from '../../hooks/useMyAnnouncements.js';

const TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  urgent: { label: 'URGENT',    color: '#ef4444', emoji: '🚨' },
  info:   { label: 'INFO',      color: '#3b82f6', emoji: 'ℹ️' },
  result: { label: 'RÉSULTAT',  color: '#22c55e', emoji: '⚽' },
  event:  { label: 'ÉVÉNEMENT', color: '#a855f7', emoji: '🎟️' },
};

interface FeedAnnouncementsProps {
  announcements: MyAnnouncement[];
  readIds: Set<string>;
  onRead: (id: string) => void;
}

export default function FeedAnnouncements({ announcements, readIds, onRead }: FeedAnnouncementsProps) {
  if (!announcements.length) return null;

  const shown = announcements.slice(0, 5);

  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)' }}>Annonces clubs</span>
        {announcements.some(a => !readIds.has(a.id)) && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
            backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444',
          }}>
            {announcements.filter(a => !readIds.has(a.id)).length} nouvelle{announcements.filter(a => !readIds.has(a.id)).length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {shown.map((ann, i) => {
          const meta  = TYPE_META[ann.type] ?? TYPE_META.info;
          const isRead = readIds.has(ann.id);
          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => !isRead && onRead(ann.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 14, marginBottom: 6,
                backgroundColor: 'var(--sl-card)',
                border: `1px solid ${isRead ? 'var(--sl-border)' : meta.color + '35'}`,
                borderLeft: `3px solid ${isRead ? 'var(--sl-border)' : meta.color}`,
                cursor: isRead ? 'default' : 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Emoji type */}
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{meta.emoji}</span>

              {/* Contenu */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)' }}>
                    {ann.clubName}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 6,
                    backgroundColor: `${meta.color}18`, color: meta.color,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 'auto' }}>
                    {timeAgo(ann.createdAt)}
                  </span>
                </div>
                <p style={{
                  margin: 0, fontSize: 12, fontWeight: ann.title ? 700 : 500,
                  color: isRead ? 'var(--sl-t2)' : 'var(--sl-t1)',
                  lineHeight: 1.4,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                }}>
                  {ann.title || ann.message}
                </p>
                {ann.title && ann.message && (
                  <p style={{
                    margin: '2px 0 0', fontSize: 11, color: 'var(--sl-t3)',
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const,
                  }}>
                    {ann.message}
                  </p>
                )}
              </div>

              {/* Point non-lu */}
              {!isRead && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: meta.color, flexShrink: 0, marginTop: 4,
                }} />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
