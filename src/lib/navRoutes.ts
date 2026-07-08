/**
 * Primitives de navigation — pures, sans React ni effets de bord.
 * Source de vérité unique pour : l'ordre des onglets, la normalisation de
 * l'onglet restauré, et la (dé)sérialisation des deep-links hash.
 *
 * Consommé par `useRouter` (hooks/useRouter.ts) et, à terme, par App.tsx en
 * remplacement du parsing hash dispersé.
 */

export type Tab = 'home' | 'map' | 'favoris' | 'clubs' | 'profil' | 'admin' | 'mon-club';

// Ordre des onglets — sert à calculer le sens de glissement des transitions.
// Reproduit à l'identique le TAB_ORDER historique de App.tsx (mon-club inclus
// pour l'animation, même s'il est non-restaurable — voir normalizeStoredTab).
export const TAB_ORDER: Tab[] = ['home', 'map', 'favoris', 'clubs', 'profil', 'admin', 'mon-club'];

export type DeepLink =
  | { kind: 'club';         id: string }
  | { kind: 'join';         id: string }
  | { kind: 'joinPlayer';   token: string }
  | { kind: 'convocReply';  token: string; status: string | null }
  | { kind: 'event';        id: string }
  | { kind: 'user';         id: string }
  | { kind: 'legal';        section: string }
  | { kind: 'subscription'; clubId: string }
  | { kind: 'register' };

// Onglets à NE PAS restaurer au démarrage à froid (ils dépendent d'un état
// runtime pas encore disponible) → repli sur 'home'. Reproduit la règle
// historique de App.tsx.
export function normalizeStoredTab(stored: string | null | undefined): Tab {
  if (!stored || stored === 'news' || stored === 'mon-club') return 'home';
  return stored as Tab;
}

// +1 = glissement avant (vers la droite dans TAB_ORDER), -1 = arrière.
// Onglet inconnu → +1 (comportement historique).
export function tabDirection(prev: string, next: string): 1 | -1 {
  const p = TAB_ORDER.indexOf(prev as Tab);
  const n = TAB_ORDER.indexOf(next as Tab);
  return n >= p ? 1 : -1;
}

// Parse le hash courant en un deep-link typé, ou null si aucun ne matche.
// L'ordre reproduit celui de l'effet historique de App.tsx.
export function parseDeepLink(hash: string): DeepLink | null {
  const clubMatch = hash.match(/^#club\/(.+)$/);
  if (clubMatch) return { kind: 'club', id: clubMatch[1] };

  const joinPlayerMatch = hash.match(/^#join-player\/([a-f0-9]+)/);
  if (joinPlayerMatch) return { kind: 'joinPlayer', token: joinPlayerMatch[1] };

  const joinMatch = hash.match(/^#join\/(.+)$/);
  if (joinMatch) return { kind: 'join', id: joinMatch[1] };

  const convocMatch = hash.match(/^#convoc-reply\/([a-f0-9]+)/);
  if (convocMatch) {
    const params = new URLSearchParams(hash.split('?')[1] ?? '');
    return { kind: 'convocReply', token: convocMatch[1], status: params.get('s') };
  }

  const eventMatch = hash.match(/^#event\/(.+)$/);
  if (eventMatch) return { kind: 'event', id: eventMatch[1] };

  const userMatch = hash.match(/^#user\/(.+)$/);
  if (userMatch) return { kind: 'user', id: userMatch[1] };

  const legalMatch = hash.match(/^#legal(?:\/(\w+))?$/);
  if (legalMatch) return { kind: 'legal', section: legalMatch[1] || 'mentions' };

  const subscriptionMatch = hash.match(/^#subscription\/(.+)$/);
  if (subscriptionMatch) return { kind: 'subscription', clubId: subscriptionMatch[1] };

  if (hash === '#register') return { kind: 'register' };

  return null;
}

// Sérialise un deep-link en fragment de hash (round-trip avec parseDeepLink).
export function deepLinkToHash(link: DeepLink): string {
  switch (link.kind) {
    case 'club':         return `#club/${link.id}`;
    case 'join':         return `#join/${link.id}`;
    case 'joinPlayer':   return `#join-player/${link.token}`;
    case 'convocReply':  return link.status ? `#convoc-reply/${link.token}?s=${link.status}` : `#convoc-reply/${link.token}`;
    case 'event':        return `#event/${link.id}`;
    case 'user':         return `#user/${link.id}`;
    case 'legal':        return `#legal/${link.section}`;
    case 'subscription': return `#subscription/${link.clubId}`;
    case 'register':     return '#register';
  }
}
