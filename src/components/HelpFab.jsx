import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../constants/zIndex.js';

/**
 * HelpFab — Bouton d'aide flottant "?" en bas à gauche.
 * Masqué quand hidden=true (overlay ouvert).
 */
export default function HelpFab({ onClick, hidden = false }) {
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
          aria-label="Centre d'aide"
          style={{
            position: 'fixed',
            bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 12px)',
            left: 14,
            zIndex: Z.helpFab,
            width: 40, height: 40,
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
        </motion.button>
      )}
    </AnimatePresence>
  );
}
