import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '../../../lib/dateUtils.js';

const TYPE_META = {
  urgent: { label: 'URGENT',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: '🚨' },
  info:   { label: 'INFO',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: 'ℹ️' },
  result: { label: 'RÉSULTAT',    color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   icon: '⚽' },
  event:  { label: 'ÉVÉNEMENT',   color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: '🎉' },
};

function AnnouncementCard({ ann }) {
  const meta = TYPE_META[ann.type] ?? TYPE_META.info;
  const [expanded, setExpanded] = useState(false);
  const longText = ann.message?.length > 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 14, overflow: 'hidden',
        backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
      }}
    >
      {/* Top colored bar */}
      <div style={{
        height: 4, backgroundColor: meta.color,
      }} />

      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            padding: '3px 7px', borderRadius: 6,
            backgroundColor: meta.bg, color: meta.color,
          }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 500 }}>
            {timeAgo(ann.created_at)}
          </span>
        </div>

        {ann.title && (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6, lineHeight: 1.35 }}>
            {ann.title}
          </div>
        )}

        <div style={{
          fontSize: 13, color: 'var(--sl-t2)', lineHeight: 1.55,
          ...(longText && !expanded ? {
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          } : {}),
        }}>
          {ann.message}
        </div>

        {longText && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              marginTop: 6, padding: 0, border: 'none', background: 'none',
              fontSize: 12, fontWeight: 600, color: meta.color, cursor: 'pointer',
            }}
          >
            {expanded ? 'Voir moins ↑' : 'Lire la suite ↓'}
          </button>
        )}

        {ann.target_teams?.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {ann.target_teams.map(t => (
              <span key={t} style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
                color: 'var(--sl-t3)',
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ClubNewsTab({ announcements = [], loading = false, canEdit, onNewAnnouncement }) {
  return (
    <div style={{ padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
          Actualités
        </h2>
        {canEdit && (
          <button
            onClick={onNewAnnouncement}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 10, border: 'none',
              backgroundColor: '#3b82f6', color: '#fff',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Annonce
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 90, borderRadius: 14, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
            Aucune actualité pour l'instant
          </div>
          {canEdit ? (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 16, lineHeight: 1.5 }}>
              Envoyez votre première annonce à vos abonnés.
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>
              Revenez bientôt pour les dernières nouvelles du club.
            </div>
          )}
          {canEdit && (
            <button
              onClick={onNewAnnouncement}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                backgroundColor: '#3b82f6', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              📢 Envoyer une annonce
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {announcements.map(ann => (
              <AnnouncementCard key={ann.id} ann={ann} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
