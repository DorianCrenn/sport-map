import { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGE_DEFS } from '../hooks/useBadges.js';

const SPARKLES = [
  { x: 0,   y: -68 }, { x: 48,  y: -48 }, { x: 68,  y: 0  }, { x: 48,  y: 48  },
  { x: 0,   y: 68  }, { x: -48, y: 48  }, { x: -68, y: 0  }, { x: -48, y: -48 },
];

function SparkleParticles({ color }: { color: string }) {
  return (
    <>
      {SPARKLES.map((pos, i) => (
        <motion.div key={i} initial={{ x: 0, y: 0, scale: 0, opacity: 0 }} animate={{ x: pos.x, y: pos.y, scale: [0, 1.3, 0], opacity: [0, 1, 0] }} transition={{ duration: 0.85, delay: 0.05 + i * 0.055, ease: 'easeOut' }} style={{ position: 'absolute', width: 7, height: 7, borderRadius: 2, backgroundColor: color, transform: 'rotate(45deg)', pointerEvents: 'none' }} />
      ))}
    </>
  );
}

interface BadgeUnlockModalProps { badges: string[]; onDone: () => void; }

export default function BadgeUnlockModal({ badges, onDone }: BadgeUnlockModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef);
  useAndroidBack(true, onDone);
  const [index, setIndex] = useState(0);
  const def = (BADGE_DEFS as Record<string, any>)[badges[index]];

  function next() { if (index < badges.length - 1) setIndex(i => i + 1); else onDone(); }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDone]);

  if (!def) return null;

  return (
    <motion.div key="badge-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} ref={panelRef} role="dialog" aria-modal="true" aria-label="Badge débloqué"
      style={{ position: 'fixed', inset: 0, zIndex: 9500, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, scale: 0.65, y: 70 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.82, y: -35 }} transition={{ type: 'spring', stiffness: 270, damping: 22 }} style={{ textAlign: 'center', maxWidth: 310, width: '100%' }}>
          {badges.length > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 30 }}>
              {badges.map((_, i) => <motion.div key={i} animate={{ backgroundColor: i <= index ? def.color : 'rgba(255,255,255,0.18)' }} transition={{ duration: 0.3 }} style={{ height: 3, flex: 1, borderRadius: 2 }} />)}
            </div>
          )}
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={{ color: def.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 22px', fontFamily: 'Inter, sans-serif' }}>Nouveau badge débloqué !</motion.p>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
            <SparkleParticles color={def.color} />
            <motion.div animate={{ scale: [1, 1.55, 1], opacity: [0.45, 0, 0.45] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', width: 165, height: 165, borderRadius: '50%', border: `1.5px solid ${def.color}`, pointerEvents: 'none' }} />
            <motion.div animate={{ scale: [1, 1.32, 1], opacity: [0.65, 0, 0.65] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.45 }} style={{ position: 'absolute', width: 135, height: 135, borderRadius: '50%', border: `2px solid ${def.color}`, pointerEvents: 'none' }} />
            <motion.div animate={{ boxShadow: [`0 0 0 0 ${def.glow}`, `0 0 36px 14px ${def.glow}`, `0 0 0 0 ${def.glow}`] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} style={{ width: 114, height: 114, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, backgroundColor: `${def.color}1a`, border: `2.5px solid ${def.color}` }}>{def.icon}</motion.div>
          </div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} style={{ color: '#fff', fontSize: 30, fontWeight: 800, margin: '0 0 10px', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.025em', lineHeight: 1.1 }}>{def.name}</motion.h2>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} style={{ color: 'rgba(255,255,255,0.52)', fontSize: 15, lineHeight: 1.6, margin: '0 0 36px', fontFamily: 'Inter, sans-serif' }}>{def.description}</motion.p>
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }} whileTap={{ scale: 0.95 }} onClick={next} style={{ padding: '14px 52px', borderRadius: 999, border: 'none', backgroundColor: def.color, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 28px ${def.glow}`, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
            {index < badges.length - 1 ? 'Suivant →' : 'Super !'}
          </motion.button>
          {badges.length > 1 && index < badges.length - 1 && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} onClick={onDone} style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.28)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', padding: '10px 16px' }}>Passer tout</motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
