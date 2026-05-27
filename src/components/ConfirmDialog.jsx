import { memo } from 'react';
import ModalFrame from './ModalFrame.jsx';

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
  return (
    <ModalFrame open={open} onClose={onCancel} variant="sheet" zIndex={500} labelledBy="confirm-dlg-title">
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
    </ModalFrame>
  );
});

export default ConfirmDialog;
