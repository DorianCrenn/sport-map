import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../constants/zIndex.js';

/**
 * HelpFab — Bouton d'aide flottant "?" en bas à gauche.
 * Masqué quand hidden=true (overlay ouvert).
 */
export default function HelpFab({ onClick, hidden = false, notificationCount = 0 }) {
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          whileTap={{ scale: 0.92 }}
          onClick={onClick}
          aria-label={notificationCount > 0 ? `Centre d'aide — ${notificationCount} notification${notificationCount > 1 ? 's' : ''}` : "Centre d'aide"}
          style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 12px)',
            left: 14,
            zIndex: Z.helpFab,
            width: 44, height: 44,
            borderRadius: '50%',
            backgroundColor: 'rgba(99,102,241,0.15)',
            border: '1.5px solid rgba(99,102,241,0.35)',
            color: '#818cf8',
            fontSize: 17, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(99,102,241,0.2)',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.15)'; }}
        >
          ?
          {notificationCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute', top: 0, right: 0,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: '#ef4444',
                border: '2px solid var(--sl-bg)',
                fontSize: 9, fontWeight: 800, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
