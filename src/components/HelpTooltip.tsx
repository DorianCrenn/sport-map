import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpTooltipProps { content: React.ReactNode; size?: number; }

export default function HelpTooltip({ content, size = 14 }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(rect.left + rect.width / 2, window.innerWidth - 220);
    setPos({ top: rect.bottom + 8, left: Math.max(10, left - 100) });
    setOpen(o => !o);
  }

  useEffect(() => {
    if (!open) return;
    function onClose(e: MouseEvent) { if (!triggerRef.current?.contains(e.target as Node)) setOpen(false); }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onClose);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClose); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={handleOpen} aria-label="Aide" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size + 8, height: size + 8, borderRadius: '50%', backgroundColor: open ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', cursor: 'pointer', flexShrink: 0, fontSize: size - 2, fontWeight: 700, lineHeight: 1, transition: 'all 0.12s' }}>?</button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.12 }} style={{ position: 'fixed', top: pos.top, left: pos.left, width: 220, zIndex: 'var(--sl-z-tooltip)', backgroundColor: '#1e293b', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--sl-radius-xl)', padding: '10px 14px', fontSize: 12, lineHeight: 1.55, color: 'rgba(222,238,255,0.9)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: -5, left: 14, width: 8, height: 8, backgroundColor: '#1e293b', border: '1px solid rgba(99,102,241,0.3)', borderRight: 'none', borderBottom: 'none', transform: 'rotate(45deg)' }} />
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
