/**
 * useOfflineSync — expose l'état de la file offline et déclenche la sync
 * automatiquement quand la connexion revient.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { processQueue, queueSize, type SyncResult } from '../lib/offlineQueue.js';

export interface OfflineSyncState {
  isOnline:    boolean;
  pendingOps:  number;
  syncing:     boolean;
  lastSync:    Date | null;
  syncNow:     () => Promise<void>;
}

export function useOfflineSync(): OfflineSyncState {
  const [isOnline,   setIsOnline]   = useState(navigator.onLine);
  const [pendingOps, setPendingOps] = useState(0);
  const [syncing,    setSyncing]    = useState(false);
  const [lastSync,   setLastSync]   = useState<Date | null>(null);
  const syncingRef = useRef(false);

  // Rafraîchir le compteur de la file toutes les 10s
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const n = await queueSize().catch(() => 0);
      if (!cancelled) setPendingOps(n);
    }
    refresh();
    const t = setInterval(refresh, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
      const anonKey     = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

      const result: SyncResult = await processQueue(supabaseUrl, anonKey, token, ({ processed, failed }) => {
        setPendingOps(prev => Math.max(0, prev - (processed > 0 ? 1 : 0)));
        if (failed > 0) console.warn(`[offlineSync] ${failed} opération(s) échouées`);
      });

      const remaining = await queueSize().catch(() => 0);
      setPendingOps(remaining);
      setLastSync(new Date());

      if (result.processed > 0) {
        window.dispatchEvent(new CustomEvent('sl-offline-sync-done', {
          detail: { processed: result.processed, failed: result.failed },
        }));
      }
    } catch (err: unknown) {
      console.error('[useOfflineSync] sync error:', err);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  // Écouter les events online/offline
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // Attendre 1s que la connexion se stabilise avant de syncer
      setTimeout(syncNow, 1000);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  return { isOnline, pendingOps, syncing, lastSync, syncNow };
}
