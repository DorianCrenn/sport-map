import { useState } from 'react';
import type { MyAnnouncement } from '../../hooks/useMyAnnouncements.js';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  urgent:      { label: 'URGENT',      color: '#DC2626' },
  info:        { label: 'INFO',        color: '#2563EB' },
  event:       { label: 'ÉVÉNEMENT',   color: '#16a34a' },
  result:      { label: 'RÉSULTAT',    color: '#EA580C' },
  convocation: { label: 'CONVOCATION', color: '#8b5cf6' },
};

interface Props {
  announcement: MyAnnouncement;
  isRead: boolean;
  onMarkRead?: (id: string) => void;
}

export default function AnnouncementPlanningCard({ announcement, isRead, onMarkRead }: Props) {
  const [expanded, setExpanded] = useState(false);
  const conf   = TYPE_CONFIG[announcement.type] ?? { label: 'ANNONCE', color: '#EA580C' };
  const isLong = announcement.message.length > 120;

  return (
    <button
      onClick={() => {
        setExpanded(e => !e);
        if (!isRead) onMarkRead?.(announcement.id);
      }}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        borderRadius: 'var(--sl-radius-2xl)',
        border: '1px solid var(--sl-border)',
        borderLeft: `3px solid ${conf.color}`,
        backgroundColor: isRead ? 'var(--sl-card)' : `${conf.color}08`,
        padding: '12px 14px',
      }}
    >
      {/* En-tête : badge type + point non-lu + club */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>📢</span>
          <span style={{
            fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
            color: conf.color, backgroundColor: `${conf.color}18`,
            padding: '2px 6px', borderRadius: 'var(--sl-radius-xs)',
          }}>
            {conf.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isRead && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: conf.color, flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600 }}>
            {announcement.clubName}
          </span>
        </div>
      </div>

      {/* Titre */}
      <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', lineHeight: 1.35 }}>
        {announcement.title}
      </p>

      {/* Message tronqué / étendu */}
      <p style={{
        margin: 0, fontSize: 12, color: 'var(--sl-t2)', lineHeight: 1.5,
        ...(expanded || !isLong ? {} : {
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        } as React.CSSProperties),
      }}>
        {announcement.message}
      </p>
      {isLong && (
        <span style={{ fontSize: 11, color: conf.color, fontWeight: 700, marginTop: 4, display: 'block' }}>
          {expanded ? 'Voir moins ↑' : 'Voir plus ↓'}
        </span>
      )}
    </button>
  );
}
