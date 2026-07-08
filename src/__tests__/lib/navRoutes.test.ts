import { describe, it, expect } from 'vitest';
import {
  TAB_ORDER,
  normalizeStoredTab,
  tabDirection,
  parseDeepLink,
  deepLinkToHash,
  type DeepLink,
} from '../../lib/navRoutes.js';

describe('navRoutes — TAB_ORDER', () => {
  it('reproduit le TAB_ORDER historique de App.tsx (mon-club inclus)', () => {
    expect(TAB_ORDER).toEqual(['home', 'map', 'favoris', 'clubs', 'profil', 'admin', 'mon-club']);
  });
});

describe('navRoutes — normalizeStoredTab', () => {
  it('repli sur home si null/undefined/vide', () => {
    expect(normalizeStoredTab(null)).toBe('home');
    expect(normalizeStoredTab(undefined)).toBe('home');
    expect(normalizeStoredTab('')).toBe('home');
  });

  it('repli sur home pour les onglets non restaurables (news, mon-club)', () => {
    expect(normalizeStoredTab('news')).toBe('home');
    expect(normalizeStoredTab('mon-club')).toBe('home');
  });

  it('conserve un onglet valide restaurable', () => {
    expect(normalizeStoredTab('map')).toBe('map');
    expect(normalizeStoredTab('clubs')).toBe('clubs');
    expect(normalizeStoredTab('admin')).toBe('admin');
  });
});

describe('navRoutes — tabDirection', () => {
  it('+1 en avançant dans l\'ordre', () => {
    expect(tabDirection('home', 'map')).toBe(1);
    expect(tabDirection('favoris', 'admin')).toBe(1);
  });

  it('-1 en reculant', () => {
    expect(tabDirection('admin', 'home')).toBe(-1);
    expect(tabDirection('clubs', 'map')).toBe(-1);
  });

  it('+1 sur onglet identique', () => {
    expect(tabDirection('map', 'map')).toBe(1);
  });

  it('gère mon-club (dernier de l\'ordre) comme les autres', () => {
    expect(tabDirection('home', 'mon-club')).toBe(1);   // 0 → 6 : avant
    expect(tabDirection('mon-club', 'map')).toBe(-1);   // 6 → 1 : arrière
  });

  it('+1 quand un onglet est totalement inconnu de l\'ordre', () => {
    expect(tabDirection('rides', 'map')).toBe(1);       // rides absent → index -1
  });
});

describe('navRoutes — parseDeepLink', () => {
  it('parse #club/:id', () => {
    expect(parseDeepLink('#club/abc-123')).toEqual({ kind: 'club', id: 'abc-123' });
  });

  it('parse #join/:id', () => {
    expect(parseDeepLink('#join/club-9')).toEqual({ kind: 'join', id: 'club-9' });
  });

  it('parse #join-player/:token (distinct de #join)', () => {
    expect(parseDeepLink('#join-player/deadbeef01')).toEqual({ kind: 'joinPlayer', token: 'deadbeef01' });
    // ne doit PAS être capté comme un #join classique
    expect(parseDeepLink('#join-player/deadbeef01').kind).toBe('joinPlayer');
  });

  it('parse #event/:id', () => {
    expect(parseDeepLink('#event/42')).toEqual({ kind: 'event', id: '42' });
  });

  it('parse #user/:id', () => {
    expect(parseDeepLink('#user/u-1')).toEqual({ kind: 'user', id: 'u-1' });
  });

  it('parse #convoc-reply/:token sans statut', () => {
    expect(parseDeepLink('#convoc-reply/deadbeef01')).toEqual({ kind: 'convocReply', token: 'deadbeef01', status: null });
  });

  it('parse #convoc-reply/:token?s=accepted', () => {
    expect(parseDeepLink('#convoc-reply/deadbeef01?s=accepted')).toEqual({ kind: 'convocReply', token: 'deadbeef01', status: 'accepted' });
  });

  it('parse #legal avec section par défaut', () => {
    expect(parseDeepLink('#legal')).toEqual({ kind: 'legal', section: 'mentions' });
  });

  it('parse #legal/:section explicite', () => {
    expect(parseDeepLink('#legal/cgu')).toEqual({ kind: 'legal', section: 'cgu' });
  });

  it('parse #subscription/:clubId', () => {
    expect(parseDeepLink('#subscription/club-7')).toEqual({ kind: 'subscription', clubId: 'club-7' });
  });

  it('parse #register', () => {
    expect(parseDeepLink('#register')).toEqual({ kind: 'register' });
  });

  it('retourne null pour un hash inconnu ou vide', () => {
    expect(parseDeepLink('')).toBeNull();
    expect(parseDeepLink('#')).toBeNull();
    expect(parseDeepLink('#unknown/thing')).toBeNull();
  });
});

describe('navRoutes — deepLinkToHash', () => {
  it('sérialise chaque type', () => {
    expect(deepLinkToHash({ kind: 'club', id: 'x' })).toBe('#club/x');
    expect(deepLinkToHash({ kind: 'join', id: 'x' })).toBe('#join/x');
    expect(deepLinkToHash({ kind: 'event', id: '3' })).toBe('#event/3');
    expect(deepLinkToHash({ kind: 'user', id: 'u' })).toBe('#user/u');
    expect(deepLinkToHash({ kind: 'legal', section: 'cgu' })).toBe('#legal/cgu');
    expect(deepLinkToHash({ kind: 'subscription', clubId: 'c' })).toBe('#subscription/c');
    expect(deepLinkToHash({ kind: 'register' })).toBe('#register');
  });

  it('convocReply inclut ?s= seulement si statut présent', () => {
    expect(deepLinkToHash({ kind: 'convocReply', token: 't', status: null })).toBe('#convoc-reply/t');
    expect(deepLinkToHash({ kind: 'convocReply', token: 't', status: 'declined' })).toBe('#convoc-reply/t?s=declined');
  });
});

describe('navRoutes — round-trip parse ∘ serialize', () => {
  const links: DeepLink[] = [
    { kind: 'club', id: 'abc-123' },
    { kind: 'join', id: 'club-9' },
    { kind: 'event', id: '42' },
    { kind: 'user', id: 'u-1' },
    { kind: 'legal', section: 'cgu' },
    { kind: 'subscription', clubId: 'club-7' },
    { kind: 'register' },
    { kind: 'convocReply', token: 'deadbeef01', status: 'accepted' },
    { kind: 'convocReply', token: 'deadbeef01', status: null },
  ];

  it.each(links)('parse(serialize($kind)) reconstruit le lien', (link) => {
    expect(parseDeepLink(deepLinkToHash(link))).toEqual(link);
  });
});
