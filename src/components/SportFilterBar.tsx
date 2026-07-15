import { memo } from 'react';
import { motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useAuth } from '../contexts/AuthContext.js';
import SportIcon from './SportIcon.jsx';

interface SportFilterBarProps {
  active:              string | null;
  onChange:            (sport: string | null) => void;
  showAllSports:       boolean;
  onShowAllSports:     () => void;
  onHideSomeSports:    () => void;
}

const SportFilterBar = memo(function SportFilterBar({ active, onChange, showAllSports, onShowAllSports, onHideSomeSports }: SportFilterBarProps) {
  const { allSports } = useSports();
  const { currentUser } = useAuth();
  const favoriteSports   = (currentUser as any)?.favoriteSports ?? [];
  const hasFavorites     = favoriteSports.length > 0;
  const inFavoritesMode  = hasFavorites && !showAllSports;
  const inExpandedMode   = hasFavorites && showAllSports;
  const allVisible       = Object.values(allSports as Record<string, { id: string; label: string; color: string; isArchived?: boolean }>).filter(s => !s.isArchived);
  const visibleSports    = inFavoritesMode ? allVisible.filter(s => favoriteSports.includes(s.id)) : allVisible;
  const hiddenCount      = inFavoritesMode ? allVisible.filter(s => !favoriteSports.includes(s.id)).length : 0;
  const inactiveChip     = { backgroundColor: 'transparent', color: 'var(--sl-t2)', border: '1px solid var(--sl-border-s)' };
  const allActiveChip    = { backgroundColor: 'var(--sl-green)', color: '#fff', border: '1px solid transparent', fontWeight: 700 };

  return (
    <div style={{ position: 'relative', flexShrink: 0, backgroundColor: 'var(--sl-surface)', borderBottom: '1px solid var(--sl-border)' }}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, background: 'linear-gradient(to left, var(--sl-surface) 20%, transparent)', zIndex: 10, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', gap: 6, padding: '8px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {inExpandedMode && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => { onHideSomeSports(); onChange(null); }} style={{ ...inactiveChip, padding: '5px 12px', borderRadius: 'var(--sl-radius-full)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', background: 'none', backgroundColor: 'var(--sl-green-dim)', color: 'var(--sl-green)', border: '1px solid var(--sl-green)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Mes sports
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => onChange(null)} style={{ ...(active === null ? allActiveChip : inactiveChip), padding: '5px 14px', borderRadius: 'var(--sl-radius-full)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', background: active === null ? 'var(--sl-green)' : 'transparent' }}>
          {inFavoritesMode ? 'Mes sports' : 'Tous'}
        </motion.button>
        {visibleSports.map((sport) => {
          const isActive = active === sport.id;
          return (
            <motion.button key={sport.id} whileTap={{ scale: 0.93 }} onClick={() => onChange(isActive ? null : sport.id)} style={{ padding: '5px 12px', borderRadius: 'var(--sl-radius-full)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', backgroundColor: isActive ? sport.color : 'transparent', color: isActive ? '#fff' : 'var(--sl-t2)', border: isActive ? '1px solid transparent' : '1px solid var(--sl-border-s)' }}>
              <SportIcon sport={sport.id} size={13} color={isActive ? '#fff' : sport.color} />
              {sport.label}
            </motion.button>
          );
        })}
        {inFavoritesMode && hiddenCount > 0 && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={onShowAllSports} style={{ padding: '5px 12px', borderRadius: 'var(--sl-radius-full)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', backgroundColor: 'var(--sl-green-dim)', color: 'var(--sl-green)', border: '1px dashed var(--sl-green)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {hiddenCount} sport{hiddenCount > 1 ? 's' : ''}
          </motion.button>
        )}
      </div>
    </div>
  );
});

export default SportFilterBar;
