import { useState } from 'react';
import { motion } from 'framer-motion';
import { timeAgo } from '../lib/dateUtils.js';

const TYPE_META = {
  urgent: { label: 'URGENT',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '🚨' },
  info:   { label: 'INFO',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: 'ℹ️' },
  result: { label: 'RÉSULTAT',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: '⚽' },
  event:  { label: 'ÉVÉNEMENT', color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  icon: '🎉' },
};

// variant="full"      → ClubNewsTab : expand/collapse, chips équipes
// variant="center"    → AnnouncementsCenter : clubName, état lu/non-lu, onRead
// variant="dashboard" → ClubDashboard : ligne compacte, suppression intégrée

export default function AnnouncementCard({
  ann,
  variant = 'full',
  isRead = false,
  onRead,
  onDelete,
  isLast = false,
}) {
  const meta = TYPE_META[ann.type] ?? TYPE_META.info;
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Variante dashboard : ligne compacte avec suppression
  if (variant === 'dashboard') {
    async function handleDelete() {
      setDeleting(true);
      await onDelete?.(ann.id);
      setDeleting(false);
      setConfirmDelete(false);
    }
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--sl-border)',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: meta.color, flexShrink: 0, marginTop: 5,
          boxShadow: `0 0 5px ${meta.color}80`,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              backgroundColor: `${meta.color}18`, color: meta.color,
            }}>
              {meta.icon} {meta.label}
            </span>
            <span style={{ fontSize: 9, color: 'var(--sl-t3)' }}>{timeAgo(ann.createdAt)}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ann.title || ann.message}
          </div>
        </div>
        {confirmDelete ? (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 10, cursor: 'pointer' }}
            >
              Non
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ padding: '4px 8px', borderRadius: 7, border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, cursor: deleting ? 'wait' : 'pointer' }}
            >
              {deleting ? '…' : 'Supprimer'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // ── Variante center : AnnouncementsCenter (clubName + état lu)
  if (variant === 'center') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => !isRead && onRead?.(ann.id)}
        style={{
          borderRadius: 16, padding: 14, marginBottom: 10,
          backgroundColor: isRead ? 'var(--sl-surface)' : 'var(--sl-card)',
          border: `1px solid ${isRead ? 'var(--sl-border)' : meta.color + '30'}`,
          cursor: isRead ? 'default' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--sl-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: 'var(--sl-t2)', flexShrink: 0,
            }}>
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
        {ann.title && (
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', margin: '0 0 4px', lineHeight: 1.35 }}>
            {ann.title}
          </p>
        )}
        <p style={{ fontSize: 14, fontWeight: isRead ? 400 : 600, color: 'var(--sl-t1)', margin: 0, lineHeight: 1.5 }}>
          {ann.message}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          {(ann.targetTeams ?? []).length > 0 ? (
            <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>→ {ann.targetTeams.join(', ')}</span>
          ) : (
            <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Tous les abonnés</span>
          )}
          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{timeAgo(ann.createdAt)}</span>
        </div>
      </motion.div>
    );
  }

  // ── Variante full (défaut) : ClubNewsTab — expand/collapse + chips équipes
  const isLong = (ann.message?.length ?? 0) > 120;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 14, overflow: 'hidden',
        backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
      }}
    >
      <div style={{ height: 4, backgroundColor: meta.color }} />
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
            {timeAgo(ann.createdAt)}
          </span>
        </div>
        {ann.title && (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6, lineHeight: 1.35 }}>
            {ann.title}
          </div>
        )}
        <div style={{
          fontSize: 13, color: 'var(--sl-t2)', lineHeight: 1.55,
          ...(isLong && !expanded ? {
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          } : {}),
        }}>
          {ann.message}
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ marginTop: 6, padding: 0, border: 'none', background: 'none', fontSize: 12, fontWeight: 600, color: meta.color, cursor: 'pointer' }}
          >
            {expanded ? 'Voir moins ↑' : 'Lire la suite ↓'}
          </button>
        )}
        {(ann.targetTeams ?? []).length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {ann.targetTeams.map(t => (
              <span key={t} style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', color: 'var(--sl-t3)',
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
