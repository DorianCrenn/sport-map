import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToastType } from '../types/sportlink.js';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  onReport?: () => void;
}

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  onReport?: () => void;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastCtx = createContext<ToastContextValue>({ toast: () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx);

function ToastItemComponent({ message, type, onReport }: { message: string; type: ToastType; onReport?: () => void }) {
  const accent =
    type === 'error' ? '#ef4444' :
    type === 'info'  ? 'var(--sl-blue)' :
                       'var(--sl-green)';

  const path =
    type === 'error'
      ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
      : <polyline points="20 6 9 17 4 12"/>;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 99,
      backgroundColor: 'var(--sl-card)',
      border: '1px solid var(--sl-border-s)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)',
      fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)',
      whiteSpace: 'nowrap', maxWidth: 'min(360px, 92vw)',
      userSelect: 'none',
      pointerEvents: onReport ? 'auto' : 'none',
    }}>
      <span style={{ color: accent, display: 'flex', flexShrink: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {path}
        </svg>
      </span>
      <span style={{ flex: 1, paddingRight: onReport ? 4 : 4 }}>{message}</span>
      {onReport && (
        <button
          onClick={onReport}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
            fontSize: 12, fontWeight: 700, color: '#818cf8',
            textDecoration: 'underline', textUnderlineOffset: 2, flexShrink: 0,
          }}
        >
          Signaler
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(({ message, type = 'success', duration = 2800, onReport }: ToastOptions) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type, onReport }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
      >
        {toasts.map(t => t.message).join('. ')}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 10px)',
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        pointerEvents: 'none',
      }}>
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.88 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0,    y: 10,  scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ pointerEvents: t.onReport ? 'auto' : 'none' }}
            >
              <ToastItemComponent message={t.message} type={t.type} onReport={t.onReport} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
