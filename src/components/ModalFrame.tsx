import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';

const VARIANTS = {
  sheet: {
    backdrop: {},
    panel: {
      initial:    { y: 60 },
      animate:    { y: 0  },
      exit:       { y: 60 },
      transition: { type: 'spring', stiffness: 340, damping: 34 },
      style: { borderRadius: '20px 20px 0 0', width: '100%', borderTop: '1px solid var(--sl-border)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' },
    },
    align: { alignItems: 'flex-end' },
  },
  center: {
    backdrop: {},
    panel: {
      initial:    { scale: 0.92, opacity: 0 },
      animate:    { scale: 1,    opacity: 1 },
      exit:       { scale: 0.92, opacity: 0 },
      transition: { type: 'spring', stiffness: 340, damping: 30 },
      style: { borderRadius: 20, width: '100%', maxWidth: 480, margin: '0 16px', border: '1px solid var(--sl-border)' },
    },
    align: { alignItems: 'center', justifyContent: 'center' },
  },
};

interface ModalFrameProps {
  open:        boolean;
  onClose:     () => void;
  variant?:    'sheet' | 'center';
  zIndex?:     number;
  labelledBy?: string;
  children:    ReactNode;
  panelStyle?: React.CSSProperties;
}

export default function ModalFrame({ open, onClose, variant = 'sheet', zIndex = 400, labelledBy, children, panelStyle = {} }: ModalFrameProps) {
  const v           = VARIANTS[variant] ?? VARIANTS.sheet;
  const firstFocusRef = useRef<HTMLDivElement>(null);
  const [sheetDy, setSheetDy] = useState(0);
  useAndroidBack(open, onClose);
  useFocusTrap(firstFocusRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => { if (!open) setSheetDy(0); }, [open]);

  const handleDragHandleDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (variant !== 'sheet') return;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    function onMove(e: TouchEvent | MouseEvent) { const y = 'touches' in e ? e.touches[0].clientY : e.clientY; setSheetDy(Math.max(0, y - startY)); }
    function onEnd(e: TouchEvent | MouseEvent)  { const y = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY; if (y - startY > 100) onClose?.(); setSheetDy(0); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd as EventListener); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd as EventListener); }
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd as EventListener);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd as EventListener);
  }, [variant, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex, display: 'flex', backgroundColor: 'rgba(0,0,0,0.65)', ...v.align }} onClick={e => { if (e.target === e.currentTarget) onClose?.(); }} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
          <motion.div ref={firstFocusRef as any} {...(v.panel as any)} style={{ backgroundColor: 'var(--sl-card)', padding: variant === 'sheet' ? '0' : '24px', ...v.panel.style, ...panelStyle, transform: variant === 'sheet' && sheetDy > 0 ? `translateY(${sheetDy}px)` : undefined, transition: sheetDy > 0 ? 'none' : undefined }} onClick={e => e.stopPropagation()}>
            {variant === 'sheet' && (
              <div role="button" tabIndex={-1} onMouseDown={handleDragHandleDown} onTouchStart={handleDragHandleDown} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClose?.()} aria-label="Glisser pour fermer" style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
              </div>
            )}
            <div style={{ padding: '4px 24px 24px' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
