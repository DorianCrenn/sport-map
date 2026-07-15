import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineSync } from '../hooks/useOfflineSync.js';

export default function OfflineBanner() {
  const { isOnline, pendingOps, syncing, syncNow } = useOfflineSync();
  const [dismissed,  setDismissed]  = useState(false);
  const [syncDone,   setSyncDone]   = useState(false);
  const [syncCount,  setSyncCount]  = useState(0);

  // Réafficher si on repasse offline
  useEffect(() => {
    if (!isOnline) setDismissed(false);
  }, [isOnline]);

  // Écouter l'event de fin de sync pour le toast de confirmation
  useEffect(() => {
    function handler(e: Event) {
      const { processed } = (e as CustomEvent<{ processed: number }>).detail;
      if (processed > 0) {
        setSyncCount(processed);
        setSyncDone(true);
        setTimeout(() => setSyncDone(false), 3000);
      }
    }
    window.addEventListener('sl-offline-sync-done', handler);
    return () => window.removeEventListener('sl-offline-sync-done', handler);
  }, []);

  const showOffline = !isOnline && !dismissed;
  const showPending = isOnline && pendingOps > 0 && !dismissed;
  const showSyncing = isOnline && syncing;

  return (
    <AnimatePresence>

      {/* Bandeau hors-ligne */}
      {showOffline && (
        <motion.div
          key="offline"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(245,158,11,0.10)', borderBottom: '1px solid rgba(245,158,11,0.25)' }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            <span style={{ flex: 1, fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              Pas de connexion — vos modifications seront synchronisées à la reconnexion.
            </span>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Fermer la bannière hors-ligne"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', opacity: 0.7, padding: 4, display: 'flex' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      {/* Bandeau opérations en attente (reconnecté mais file non vide) */}
      {showPending && !showSyncing && (
        <motion.div
          key="pending"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)' }}
          role="status"
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span style={{ flex: 1, fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
              {pendingOps} action{pendingOps > 1 ? 's' : ''} en attente de synchronisation
            </span>
            <button
              onClick={syncNow}
              style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.12)', border: 'none', cursor: 'pointer', padding: '3px 10px', borderRadius: 'var(--sl-radius-sm)' }}
            >
              Synchroniser
            </button>
          </div>
        </motion.div>
      )}

      {/* Indicateur de sync en cours */}
      {showSyncing && (
        <motion.div
          key="syncing"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(34,197,94,0.3)', borderTopColor: '#22c55e', animation: 'sl-spin 0.7s linear infinite', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Synchronisation en cours…</span>
          </div>
        </motion.div>
      )}

      {/* Toast de confirmation sync réussie */}
      {syncDone && (
        <motion.div
          key="sync-done"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(34,197,94,0.10)', borderBottom: '1px solid rgba(34,197,94,0.25)' }}
          role="status"
          aria-live="polite"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
              {syncCount} action{syncCount > 1 ? 's' : ''} synchronisée{syncCount > 1 ? 's' : ''} avec succès
            </span>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
