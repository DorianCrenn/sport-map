import { useRef } from 'react';
import { motion } from 'framer-motion';

const PREDEFINED = [
  { key: 'today',   label: "Aujourd'hui" },
  { key: 'weekend', label: 'Ce week-end' },
  { key: 'week',    label: 'Cette semaine' },
];

function formatDate(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function DateFilterBar({ active, onChange, upcomingOnly = true, onUpcomingOnlyChange }) {
  const dateInputRef = useRef(null);
  const isSpecific = active && !PREDEFINED.find((o) => o.key === active);

  const inactive = {
    backgroundColor: 'transparent',
    color: 'var(--sl-t2)',
    border: '1px solid var(--sl-border-s)',
  };
  const activeStyle = {
    backgroundColor: 'var(--sl-green)',
    color: '#fff',
    border: '1px solid transparent',
    fontWeight: 700,
  };

  return (
    <div
      style={{
        display: 'flex', gap: 6, padding: '6px 14px',
        flexShrink: 0, overflowX: 'auto', alignItems: 'center',
        backgroundColor: 'var(--sl-surface)',
        borderBottom: '1px solid var(--sl-border)',
        scrollbarWidth: 'none',
      }}
    >
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => onChange(null)}
        style={{
          ...(active === null ? activeStyle : inactive),
          padding: '4px 12px', borderRadius: 999,
          fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          flexShrink: 0, cursor: 'pointer',
        }}
      >
        Tout
      </motion.button>

      {PREDEFINED.map(({ key, label }) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.93 }}
          onClick={() => onChange(active === key ? null : key)}
          style={{
            ...(active === key ? activeStyle : inactive),
            padding: '4px 12px', borderRadius: 999,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            flexShrink: 0, cursor: 'pointer',
          }}
        >
          {label}
        </motion.button>
      ))}

      {/* Divider */}
      <div style={{ width: 1, height: 16, backgroundColor: 'var(--sl-border-s)', flexShrink: 0, margin: '0 2px' }} />

      {/* Upcoming toggle */}
      {onUpcomingOnlyChange && (
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => onUpcomingOnlyChange(!upcomingOnly)}
          title={upcomingOnly ? 'Afficher aussi les événements passés' : 'Masquer les événements passés'}
          style={{
            ...(upcomingOnly ? { backgroundColor: 'rgba(34,217,106,0.12)', color: 'var(--sl-green)', border: '1px solid rgba(34,217,106,0.3)' } : inactive),
            padding: '4px 10px', borderRadius: 999,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            flexShrink: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          À venir
        </motion.button>
      )}

      <input
        ref={dateInputRef}
        type="date"
        value={isSpecific ? active : ''}
        onChange={(e) => onChange(e.target.value || null)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
      />
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => dateInputRef.current?.showPicker()}
        style={{
          ...(isSpecific ? activeStyle : inactive),
          padding: '4px 12px', borderRadius: 999,
          fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        {isSpecific ? formatDate(active) : 'Choisir'}
      </motion.button>
    </div>
  );
}
