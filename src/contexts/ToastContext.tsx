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
  const isError   = type === 'error';
  const isInfo    = type === 'info';
  const isSuccess = !isError && !isInfo;

  const accent    = isError ? '#ef4444' : isInfo ? 'var(--sl-blue)' : 'var(--sl-green)';
  const accentBg  = isError ? 'rgba(239,68,68,0.14)' : isInfo ? 'rgba(77,166,255,0.14)' : 'rgba(34,217,106,0.14)';
  const borderCol = isError ? 'rgba(239,68,68,0.3)'  : isInfo ? 'rgba(77,166,255,0.28)' : 'rgba(34,217,106,0.28)';

  const iconPath = isError
    ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
    : isInfo
    ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
    : <polyline points="20 6 9 17 4 12"/>;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px 10px 12px', borderRadius: 14,
      backgroundColor: 'var(--sl-card)',
      border: `1px solid ${borderCol}`,
      boxShadow: `0 8px 36px rgba(0,0,0,0.42), 0 2px 8px rgba(0,0,0,0.18), inset 0 0 0 1px ${accentBg}`,
      fontSize: 15, fontWeight: 600, color: 'var(--sl-t1)',
      whiteSpace: 'nowrap', maxWidth: 'min(380px, 92vw)',
      userSelect: 'none',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      pointerEvents: onReport ? 'auto' : 'none',
    }}>
      {/* Colored left strip */}
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 999, backgroundColor: accent, flexShrink: 0, marginRight: 2 }} />
      {/* Icon in tinted pill */}
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        backgroundColor: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {iconPath}
        </svg>
      </div>
      <span style={{
        flex: 1,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: '-0.01em',
      }}>
        {message}
      </span>
      {onReport && (
        <button
          onClick={onReport}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
            fontSize: 11, fontWeight: 700, color: '#818cf8',
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.04em', textTransform: 'uppercase',
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

  const toast = useCallback(({ message, type = 'success', duration = 5000, onReport }: ToastOptions) => {
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
