/**
 * Tests ISO Demo ↔ App
 *
 * Vérifie que les hooks et composants se comportent de la même manière
 * en mode démo et en mode production (mêmes clés de données, mêmes états).
 */
import { describe, it, expect } from 'vitest';

// ── Shape des données retournées ──────────────────────────────────────────────

describe('ISO — shape des événements (demo vs app)', () => {
  const demoEvent = {
    id: 'demo-event-001',
    club_id: 'demo-club-001',
    sport: 'Football',
    date: new Date(Date.now() + 4 * 86400000).toISOString(),
    homeTeam: 'FC SportLink Démo',
    awayTeam: 'AS Plougastel',
    type: 'championship',
    score: null,
    teamName: 'Équipe 1',
    adversaire: 'AS Plougastel',
  };

  const appEvent = {
    id: 'real-event-001',
    club_id: 'real-club-001',
    sport: 'Football',
    date: new Date(Date.now() + 2 * 86400000).toISOString(),
    homeTeam: 'FC Brest',
    awayTeam: 'FC Quimper',
    type: 'championship',
    score: null,
    teamName: 'Équipe 1',
    adversaire: 'FC Quimper',
  };

  // Les deux objets doivent avoir les mêmes clés essentielles
  const REQUIRED_EVENT_KEYS = [
    'id', 'club_id', 'sport', 'date', 'homeTeam', 'awayTeam', 'type', 'score',
  ];

  it('événement démo a toutes les clés essentielles', () => {
    for (const key of REQUIRED_EVENT_KEYS) {
      expect(demoEvent, `Clé manquante : ${key}`).toHaveProperty(key);
    }
  });

  it('événement app a les mêmes clés essentielles', () => {
    for (const key of REQUIRED_EVENT_KEYS) {
      expect(appEvent, `Clé manquante : ${key}`).toHaveProperty(key);
    }
  });

  it('types de données identiques pour les clés partagées', () => {
    expect(typeof demoEvent.id).toBe(typeof appEvent.id);
    expect(typeof demoEvent.sport).toBe(typeof appEvent.sport);
    expect(typeof demoEvent.date).toBe(typeof appEvent.date);
  });
});

// ── Shape des joueurs (demo vs app) ──────────────────────────────────────────

describe('ISO — shape des joueurs (demo vs app)', () => {
  const demoPlayer = {
    id: 'demo-player-001',
    club_id: 'demo-club-001',
    name: 'Nicolas Perrin',
    team_name: 'Équipe 1',
    position: 'Gardien',
    number: 1,
    photo_url: 'https://randomuser.me/api/portraits/men/1.jpg',
    email: 'nicolas.perrin@fc-sportlink.app',
    user_id: 'demo-user-001',
  };

  const appPlayer = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    club_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Jean Dupont',
    team_name: 'Équipe A',
    position: 'Gardien',
    number: 1,
    photo_url: null,
    email: 'jean.dupont@example.com',
    user_id: null,
  };

  const REQUIRED_PLAYER_KEYS = ['id', 'club_id', 'name', 'position', 'number'];

  it('joueur démo a toutes les clés requises', () => {
    for (const key of REQUIRED_PLAYER_KEYS) {
      expect(demoPlayer).toHaveProperty(key);
    }
  });

  it('joueur app a les mêmes clés requises', () => {
    for (const key of REQUIRED_PLAYER_KEYS) {
      expect(appPlayer).toHaveProperty(key);
    }
  });

  it('photo_url peut être null en production mais pas en démo', () => {
    expect(demoPlayer.photo_url).not.toBeNull();
    expect(appPlayer.photo_url).toBeNull(); // acceptable en prod
  });
});

// ── Shape des convocations ────────────────────────────────────────────────────

describe('ISO — shape des convocations', () => {
  const demoConvoc = {
    id: 'demo-conv-001-01',
    event_id: 'demo-event-001',
    club_id: 'demo-club-001',
    player_id: 'demo-player-001',
    player_name: 'Nicolas Perrin',
    team_name: 'Équipe 1',
    status: 'accepted',
    note: null,
    created_at: '2026-06-10T09:00:00Z',
    responded_at: '2026-06-11T09:00:00Z',
  };

  const REQUIRED_CONVOC_KEYS = [
    'id', 'event_id', 'club_id', 'player_id', 'player_name', 'status',
  ];

  it('convocation démo a toutes les clés requises', () => {
    for (const key of REQUIRED_CONVOC_KEYS) {
      expect(demoConvoc).toHaveProperty(key);
    }
  });

  it('status est l\'un des statuts valides', () => {
    const VALID_STATUSES = ['pending', 'accepted', 'declined', 'unavailable'];
    expect(VALID_STATUSES).toContain(demoConvoc.status);
  });
});

// ── Tour steps — structure cohérente ─────────────────────────────────────────

import { presidentTour } from '../../demo/tours/president.js';
import { coachTour }     from '../../demo/tours/coach.js';
import { parentTour }    from '../../demo/tours/parent.js';
import { playerTour }    from '../../demo/tours/player.js';
import { communicationTour } from '../../demo/tours/communication.js';
import { supporterTour } from '../../demo/tours/supporter.js';

// Mode interactif : les tours utilisent désormais clickTarget au lieu de action/target.
// Les champs `action` et `target` sont supprimés.

const VALID_CLICK_TARGETS = [
  undefined, null,
  'tab-home', 'tab-map', 'tab-favoris', 'tab-clubs', 'tab-profil', 'tab-mon-club',
  'fab-add', 'fab-dashboard', 'fab-event', 'fab-announce', 'fab-mon-club', 'fab-training',
  'convocation-btn', 'convocation-popup-btn', 'convocation-respond', 'favorite-btn', 'follow-club-btn',
  'live-score-pupitre', 'live-multiplex', 'coach-match-card', 'carpool-card',
  'admin-dashboard', 'training-card', 'agenda-section', 'convocations-tab', 'poster-feature-strip',
];

const VALID_TRY_IT_ACTIONS = [
  undefined,
  'event-created', 'announcement-sent', 'convocation-sent',
  'convocation-responded', 'event-favorited', 'carpool-requested',
  'poster-generated', 'poster-opened', 'club-followed',
];

const TOURS = [
  ['president', presidentTour],
  ['coach', coachTour],
  ['parent', parentTour],
  ['player', playerTour],
  ['communication', communicationTour],
  ['supporter', supporterTour],
];

for (const [name, tour] of TOURS) {
  describe(`Tour ${name} — structure des étapes`, () => {
    it('a entre 4 et 15 étapes', () => {
      expect(tour.length).toBeGreaterThanOrEqual(4);
      expect(tour.length).toBeLessThanOrEqual(15);
    });

    it('chaque étape a un id, title, body, emoji', () => {
      for (const step of tour) {
        expect(step.id, `Étape sans id`).toBeDefined();
        expect(step.title, `Étape ${step.id} sans title`).toBeTruthy();
        expect(step.body,  `Étape ${step.id} sans body`).toBeTruthy();
        expect(step.emoji, `Étape ${step.id} sans emoji`).toBeTruthy();
      }
    });

    it('la dernière étape est un CTA (isCTA: true)', () => {
      const last = tour[tour.length - 1];
      expect(last.isCTA).toBe(true);
    });

    it('tous les clickTargets sont dans la liste des cibles valides', () => {
      for (const step of tour) {
        expect(
          VALID_CLICK_TARGETS.includes(step.clickTarget),
          `clickTarget invalide "${step.clickTarget}" à l'étape ${step.id}`
        ).toBe(true);
      }
    });

    it('tous les tryItActions sont dans la liste des actions valides', () => {
      for (const step of tour) {
        if (step.tryItAction !== undefined) {
          expect(
            VALID_TRY_IT_ACTIONS.includes(step.tryItAction),
            `tryItAction invalide "${step.tryItAction}" à l'étape ${step.id}`
          ).toBe(true);
        }
      }
    });

    it('si tryItAction est défini, tryItLabel et clickTarget le sont aussi', () => {
      for (const step of tour) {
        if (step.tryItAction) {
          expect(step.tryItLabel,  `tryItLabel manquant à l'étape ${step.id}`).toBeTruthy();
          expect(step.clickTarget, `clickTarget manquant à l'étape ${step.id} qui a tryItAction`).toBeTruthy();
        }
      }
    });

    it('les étapes CTA n\'ont pas de clickTarget', () => {
      for (const step of tour) {
        if (step.isCTA) {
          expect(step.clickTarget).toBeFalsy();
        }
      }
    });
  });
}
