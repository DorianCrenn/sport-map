/**
 * Tests de cohérence des step counts entre DemoLandingPage et les tours réels.
 *
 * Garantit que le nombre d'étapes affiché sur la card de sélection correspond
 * exactement au nombre d'étapes dans le tour correspondant.
 *
 * Régression prévenue : president affiché "12 étapes" mais tour a 9 étapes.
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
// Le test force la synchronisation entre la card et le tour réel.

const DISPLAYED_STEPS = {
  president:     9,
  coach:         7,
  communication: 5,
  parent:        6,
  player:        6,
  supporter:     5,
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

    it(`${profile} : au plus 10 étapes (guide lisible sur mobile)`, () => {
      expect(tour.length).toBeLessThanOrEqual(10);
    });

    it(`${profile} : première étape a id, title, body, emoji`, () => {
      const first = tour[0];
      expect(first.id).toBeDefined();
      expect(first.title).toBeTruthy();
      expect(first.body).toBeTruthy();
      expect(first.emoji).toBeTruthy();
    });

    it(`${profile} : dernière étape a isCTA ou est une étape normale`, () => {
      const last = tour[tour.length - 1];
      expect(typeof last.id).toBe('number');
      if (last.isCTA !== undefined) {
        expect(typeof last.isCTA).toBe('boolean');
      }
    });

    it(`${profile} : step IDs uniques`, () => {
      const ids = tour.map(s => s.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  }
});

describe('Tours — actions et targets valides', () => {
  const VALID_ACTIONS = [
    null, 'open-event-form', 'open-announcements', 'open-poster-studio',
    'focus-demo-event', 'open-dashboard', 'open-convocations',
    'focus-score-event', 'close-overlay',
  ];

  const BROKEN_ACTIONS = ['scroll-to-events', 'scroll-to-trainings', 'open-matchs-tab'];

  for (const [profile, tour] of Object.entries(TOURS)) {
    it(`${profile} : aucune action cassée`, () => {
      for (const step of tour) {
        expect(
          BROKEN_ACTIONS.includes(step.action),
          `Action cassée "${step.action}" à l'étape ${step.id} du tour ${profile}`
        ).toBe(false);
      }
    });

    it(`${profile} : toutes les actions sont dans la liste valide`, () => {
      for (const step of tour) {
        expect(
          VALID_ACTIONS.includes(step.action ?? null),
          `Action invalide "${step.action}" à l'étape ${step.id} du tour ${profile}`
        ).toBe(true);
      }
    });

    it(`${profile} : si tryItAction défini, tryItLabel aussi`, () => {
      for (const step of tour) {
        if (step.tryItAction) {
          expect(
            step.tryItLabel,
            `tryItLabel manquant à l'étape ${step.id} du tour ${profile}`
          ).toBeTruthy();
        }
      }
    });
  }
});
