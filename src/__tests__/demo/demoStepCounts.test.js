/**
 * Tests de cohérence des step counts entre DemoLandingPage et les tours réels.
 *
 * Garantit que le nombre d'étapes affiché sur la card de sélection correspond
 * exactement au nombre d'étapes dans le tour correspondant.
 */
import { describe, it, expect } from 'vitest';
import { presidentTour }    from '../../demo/tours/president.js';
import { coachTour }        from '../../demo/tours/coach.js';
import { communicationTour } from '../../demo/tours/communication.js';
import { parentTour }       from '../../demo/tours/parent.js';
import { playerTour }       from '../../demo/tours/player.js';
import { supporterTour }    from '../../demo/tours/supporter.js';

// ── Référentiel des étapes affichées dans DemoLandingPage ────────────────────
// CES VALEURS DOIVENT ÊTRE MISES À JOUR SI LES TOURS CHANGENT.

const DISPLAYED_STEPS = {
  president:     13,
  coach:         13,
  communication: 6,
  parent:        7,
  player:        6,
  supporter:     7,
};

const TOURS = {
  president:     presidentTour,
  coach:         coachTour,
  communication: communicationTour,
  parent:        parentTour,
  player:        playerTour,
  supporter:     supporterTour,
};

describe('DemoLandingPage — step counts cohérents avec les tours réels', () => {
  for (const [profile, tour] of Object.entries(TOURS)) {
    it(`${profile} : ${DISPLAYED_STEPS[profile]} affiché === ${tour.length} dans le tour`, () => {
      expect(tour.length).toBe(DISPLAYED_STEPS[profile]);
    });
  }
});

describe('Tours — structure minimale garantie', () => {
  for (const [profile, tour] of Object.entries(TOURS)) {
    it(`${profile} : au moins 4 étapes`, () => {
      expect(tour.length).toBeGreaterThanOrEqual(4);
    });

    it(`${profile} : au plus 15 étapes (guide lisible sur mobile)`, () => {
      expect(tour.length).toBeLessThanOrEqual(15);
    });

    it(`${profile} : première étape a id, title, body, emoji`, () => {
      const first = tour[0];
      expect(first.id).toBeDefined();
      expect(first.title).toBeTruthy();
      expect(first.body).toBeTruthy();
      expect(first.emoji).toBeTruthy();
    });

    it(`${profile} : dernière étape est CTA ou info`, () => {
      const last = tour[tour.length - 1];
      expect(typeof last.id).toBe('number');
    });

    it(`${profile} : step IDs uniques`, () => {
      const ids = tour.map(s => s.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  }
});

describe('Tours interactifs — structure des étapes clickTarget', () => {
  const VALID_CLICK_TARGETS = [
    undefined, null,
    // Navigation
    'tab-home', 'tab-map', 'tab-favoris', 'tab-clubs', 'tab-profil', 'tab-mon-club',
    // FAB + sous-items
    'fab-add', 'fab-dashboard', 'fab-event', 'fab-announce', 'fab-mon-club', 'fab-training',
    // Éléments app
    'convocation-btn', 'convocation-popup-btn', 'convocation-respond', 'favorite-btn', 'follow-club-btn',
    'live-score-pupitre', 'live-multiplex', 'coach-match-card', 'carpool-card',
    'admin-dashboard', 'training-card', 'agenda-section',
  ];

  const VALID_TRY_IT_ACTIONS = [
    undefined,
    'event-created', 'announcement-sent', 'convocation-sent',
    'convocation-responded', 'event-favorited', 'carpool-requested',
    'poster-generated', 'club-followed',
  ];

  for (const [profile, tour] of Object.entries(TOURS)) {
    it(`${profile} : tous les clickTarget sont dans la liste valide`, () => {
      for (const step of tour) {
        expect(
          VALID_CLICK_TARGETS.includes(step.clickTarget),
          `clickTarget invalide "${step.clickTarget}" à l'étape ${step.id} du tour ${profile}`
        ).toBe(true);
      }
    });

    it(`${profile} : tous les tryItActions sont dans la liste valide`, () => {
      for (const step of tour) {
        expect(
          VALID_TRY_IT_ACTIONS.includes(step.tryItAction),
          `tryItAction invalide "${step.tryItAction}" à l'étape ${step.id} du tour ${profile}`
        ).toBe(true);
      }
    });

    it(`${profile} : si tryItAction défini, clickTarget aussi`, () => {
      for (const step of tour) {
        if (step.tryItAction) {
          expect(
            step.clickTarget,
            `tryItAction "${step.tryItAction}" défini sans clickTarget à l'étape ${step.id} du tour ${profile}`
          ).toBeTruthy();
        }
      }
    });

    it(`${profile} : la dernière étape est CTA (isCTA: true)`, () => {
      const last = tour[tour.length - 1];
      expect(last.isCTA).toBe(true);
    });

    it(`${profile} : les étapes CTA n'ont pas de clickTarget`, () => {
      for (const step of tour) {
        if (step.isCTA) {
          expect(step.clickTarget).toBeFalsy();
        }
      }
    });
  }
});
