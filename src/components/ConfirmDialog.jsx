import { memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = memo(function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmColor = '#ef4444',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            display: 'flex', alignItems: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
          onClick={e => e.target === e.currentTarget && onCancel?.()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dlg-title"
        >
          <motion.div
            initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            style={{
              borderRadius: '20px 20px 0 0',
              padding: '24px 24px calc(24px + env(safe-area-inset-bottom, 0px))',
              width: '100%',
              backgroundColor: 'var(--sl-card)',
              borderTop: '1px solid var(--sl-border)',
            }}
          >
            <h3
              id="confirm-dlg-title"
              style={{ fontWeight: 700, fontSize: 16, color: 'var(--sl-t1)', margin: '0 0 8px', fontFamily: 'Inter, sans-serif' }}
            >
              {title}
            </h3>
            {message && (
              <p style={{ fontSize: 14, color: 'var(--sl-t2)', margin: '0 0 20px' }}>
                {message}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                ref={cancelRef}
                onClick={onCancel}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  border: '1px solid var(--sl-border-s)',
                  color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)',
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                  fontSize: 14, fontWeight: 700,
                  backgroundColor: confirmColor, color: '#fff', border: 'none',
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default ConfirmDialog;
