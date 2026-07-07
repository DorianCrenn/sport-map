/**
 * useRouter — source de vérité unique pour la navigation par onglets et les
 * deep-links hash. Remplace, à terme, le triptyque dispersé de App.tsx
 * (`activeTab` + `sessionStorage('sl-tab')` + gros useEffect de parsing hash).
 *
 * Périmètre volontairement restreint (Phase 1) : le hook possède l'onglet actif,
 * son sens de transition et sa persistance, plus les helpers de parsing/écriture
 * du hash. Il N'EXÉCUTE PAS les effets applicatifs des deep-links (requêtes
 * Supabase, toasts, follow) : il expose l'intent parsé, App orchestre le reste.
 */
import { useState, useRef, useCallback } from 'react';
import {
  normalizeStoredTab,
  tabDirection,
  parseDeepLink,
  deepLinkToHash,
  type Tab,
  type DeepLink,
} from '../lib/navRoutes.js';

const TAB_STORAGE_KEY = 'sl-tab';

export function useRouter() {
  const [tab, _setTab] = useState<Tab>(() =>
    normalizeStoredTab(typeof window !== 'undefined' ? sessionStorage.getItem(TAB_STORAGE_KEY) : null)
  );
  const tabDirRef = useRef<1 | -1>(1);

  // Change d'onglet : calcule le sens de transition. Ne fait aucun gating
  // (auth/admin/mon-club) — c'est la responsabilité de l'appelant.
  // Ne persiste QUE les onglets restaurables : mon-club (non restaurable) laisse
  // la valeur précédente intacte, comme le bypass historique de App.tsx.
  const go = useCallback((next: Tab) => {
    _setTab(prev => {
      tabDirRef.current = tabDirection(prev, next);
      return next;
    });
    if (normalizeStoredTab(next) === next) {
      try { sessionStorage.setItem(TAB_STORAGE_KEY, next); } catch { /* navigation privée */ }
    }
  }, []);

  // Deep-link présent dans l'URL au montage (à lire une fois dans un effet).
  const readInitialDeepLink = useCallback((): DeepLink | null =>
    parseDeepLink(typeof window !== 'undefined' ? window.location.hash : ''), []);

  // Retire le fragment de hash (fin d'un deep-link consommé). Remplace l'entrée
  // courante (pas de nouvelle entrée d'historique) — équivaut au
  // `replaceState(null, '', pathname)` historique dispersé dans App.tsx.
  const clearHash = useCallback(() => {
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // Écrit le hash d'un overlay EN REMPLAÇANT l'entrée courante (replaceState) —
  // pour refléter l'overlay ouvert sans ajouter d'entrée d'historique.
  const replaceOverlay = useCallback((link: DeepLink) => {
    window.history.replaceState(null, '', deepLinkToHash(link));
  }, []);

  // Ouvre un overlay en POUSSANT son hash dans l'historique (back natif OK).
  const pushOverlay = useCallback((link: DeepLink) => {
    window.history.pushState(null, '', deepLinkToHash(link));
  }, []);

  // Abonnement aux changements de hash (deep-link ou retour arrière).
  // Retourne la fonction de désabonnement — à utiliser dans un useEffect.
  const onDeepLink = useCallback((cb: (link: DeepLink | null) => void) => {
    const handler = () => cb(parseDeepLink(window.location.hash));
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('hashchange', handler);
      window.removeEventListener('popstate', handler);
    };
  }, []);

  return { tab, tabDir: tabDirRef.current, go, readInitialDeepLink, clearHash, replaceOverlay, pushOverlay, onDeepLink };
}
