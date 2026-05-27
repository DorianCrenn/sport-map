import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VARIANTS = {
  sheet: {
    backdrop: {},
    panel: {
      initial: { y: 60 },
      animate: { y: 0 },
      exit:    { y: 60 },
      transition: { type: 'spring', stiffness: 340, damping: 34 },
      style: {
        borderRadius: '20px 20px 0 0',
        width: '100%',
        borderTop: '1px solid var(--sl-border)',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      },
    },
    align: { alignItems: 'flex-end' },
  },
  center: {
    backdrop: {},
    panel: {
      initial: { scale: 0.92, opacity: 0 },
      animate: { scale: 1,    opacity: 1 },
      exit:    { scale: 0.92, opacity: 0 },
      transition: { type: 'spring', stiffness: 340, damping: 30 },
      style: {
        borderRadius: 20,
        width: '100%',
        maxWidth: 480,
        margin: '0 16px',
        border: '1px solid var(--sl-border)',
      },
    },
    align: { alignItems: 'center', justifyContent: 'center' },
  },
};

/**
 * Reusable modal shell — handles backdrop, animation, Escape key, aria attrs.
 *
 * Props:
 *   open         — boolean
 *   onClose      — () => void
 *   variant      — 'sheet' (default, bottom slide) | 'center'
 *   zIndex       — number (default 400)
 *   labelledBy   — id of the h2/h3 inside the modal for aria-labelledby
 *   children     — modal content
 *   panelStyle   — extra inline styles merged on the panel div
 */
export default function ModalFrame({
  open,
  onClose,
  variant = 'sheet',
  zIndex = 400,
  labelledBy,
  children,
  panelStyle = {},
}) {
  const v = VARIANTS[variant] ?? VARIANTS.sheet;
  const firstFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Auto-focus first focusable element when opening
  useEffect(() => {
    if (!open || !firstFocusRef.current) return;
    const el = firstFocusRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    el?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0,
            zIndex,
            display: 'flex',
            backgroundColor: 'rgba(0,0,0,0.65)',
            ...v.align,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <motion.div
            ref={firstFocusRef}
            {...v.panel}
            style={{
              backgroundColor: 'var(--sl-card)',
              padding: '24px',
              ...v.panel.style,
              ...panelStyle,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
