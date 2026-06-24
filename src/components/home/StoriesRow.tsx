import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface StoriesRowProps {
  sports: string[];
  sportColors: Record<string, string>;
  sportIcons: Record<string, string>;
  activeSport: string | null;
  onSelect: (sport: string | null) => void;
  eventCountBySport?: Record<string, number>;
}

const ALL_ITEM = { key: 'all', label: 'Tout', emoji: '⚡', color: '#22d96a' };

export default function StoriesRow({
  sports,
  sportColors,
  sportIcons,
  activeSport,
  onSelect,
  eventCountBySport = {},
}: StoriesRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const items = [
    ALL_ITEM,
    ...sports.map(s => ({ key: s, label: s, emoji: null, color: sportColors[s] ?? '#22d96a' })),
  ];

  function handleClick(key: string) {
    onSelect(key === 'all' ? null : key);
    if (navigator.vibrate) navigator.vibrate(6);
  }

  return (
    <div
      style={{ padding: '10px 0 4px', background: 'var(--sl-bg)' }}
      aria-label="Filtrer par sport"
    >
      <div
        ref={rowRef}
        style={{
          display: 'flex',
          gap: 14,
          overflowX: 'auto',
          paddingLeft: 16,
          paddingRight: 16,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        {items.map((item, i) => {
          const isActive = item.key === 'all' ? activeSport === null : activeSport === item.key;
          const count = item.key === 'all'
            ? Object.values(eventCountBySport).reduce((a, b) => a + b, 0)
            : (eventCountBySport[item.key] ?? 0);
          const iconHtml = item.key !== 'all' ? sportIcons[item.key] : null;

          return (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 420, damping: 26 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleClick(item.key)}
              aria-pressed={isActive}
              aria-label={`${item.label}${count ? ` — ${count} événements` : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {/* Ring */}
              <div style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                padding: 2.5,
                background: isActive
                  ? `linear-gradient(135deg, ${item.color} 0%, ${item.color}99 100%)`
                  : 'transparent',
                border: isActive ? 'none' : `2px solid rgba(222,238,255,0.18)`,
                transition: 'all 0.2s',
                boxShadow: isActive ? `0 0 14px ${item.color}55` : 'none',
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: 'var(--sl-card)',
                  border: isActive ? '2.5px solid var(--sl-bg)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {item.emoji ? (
                    <span style={{ fontSize: 22 }}>{item.emoji}</span>
                  ) : iconHtml ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
                      style={{ display: 'block', color: isActive ? item.color : 'var(--sl-t2)' }}>
                      <g dangerouslySetInnerHTML={{ __html: iconHtml }} />
                    </svg>
                  ) : (
                    <span style={{ fontSize: 18, color: item.color }}>🏆</span>
                  )}
                </div>
              </div>

              {/* Label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? item.color : 'var(--sl-t2)',
                  whiteSpace: 'nowrap',
                  maxWidth: 58,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontFamily: 'var(--sl-font-brand)',
                  letterSpacing: '0.01em',
                  transition: 'color 0.2s',
                }}>
                  {item.label}
                </span>
                {count > 0 && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: isActive ? item.color : 'var(--sl-t3)',
                    transition: 'color 0.2s',
                  }}>
                    {count}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
