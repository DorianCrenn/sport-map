/**
 * Source de vérité unique pour les règles de score par sport.
 * Ajouter un sport = ajouter un objet ici, aucun autre fichier à modifier.
 *
 * scoreType :
 *   'simple'    — 2 champs home/away (+ optionnels)
 *   'calculated'— score calculé depuis des actions (rugby)
 *   'periods'   — N périodes homo (basketball)
 *   'sets'      — N sets (volleyball)
 *   'individual_encounters' — rencontres individuelles (tennis)
 */
export const SPORT_MATCH_CONFIGS = {
  football: {
    scoreType: 'simple',
    homeLabel: 'Domicile',
    awayLabel: 'Extérieur',
    fields: {
      main: [
        { key: 'home', label: 'Dom.', min: 0, max: 99, inputMode: 'numeric' },
        { key: 'away', label: 'Ext.', min: 0, max: 99, inputMode: 'numeric' },
      ],
      optional: [
        { key: 'et_home',  label: 'Dom. (Prolong.)', group: 'extra_time', condition: 'draw' },
        { key: 'et_away',  label: 'Ext. (Prolong.)', group: 'extra_time', condition: 'draw' },
        { key: 'pen_home', label: 'Dom. (T.A.B.)',  group: 'penalties',  condition: 'draw_after_et' },
        { key: 'pen_away', label: 'Ext. (T.A.B.)',  group: 'penalties',  condition: 'draw_after_et' },
      ],
    },
    individualEncounters: false,
    manOfMatch: true,
  },

  rugby: {
    scoreType: 'calculated',
    homeLabel: 'Domicile',
    awayLabel: 'Extérieur',
    actions: [
      { key: 'tries',     label: 'Essais',        points: 5,  max: 30 },
      { key: 'conv',      label: 'Transformations', points: 2, max: 30 },
      { key: 'penalties', label: 'Pénalités',     points: 3,  max: 20 },
      { key: 'drops',     label: 'Drops',         points: 3,  max: 10 },
    ],
    // score = tries*5 + conv*2 + penalties*3 + drops*3
    scoreComputed: (d, side) =>
      (d[`tries_${side}`] || 0) * 5 +
      (d[`conv_${side}`]  || 0) * 2 +
      (d[`penalties_${side}`] || 0) * 3 +
      (d[`drops_${side}`] || 0) * 3,
    validation: {
      convLeTriesHome: (d) => (d.conv_home || 0) <= (d.tries_home || 0),
      convLeTriesAway: (d) => (d.conv_away || 0) <= (d.tries_away || 0),
    },
    individualEncounters: false,
    manOfMatch: true,
  },

  basketball: {
    scoreType: 'periods',
    homeLabel: 'Domicile',
    awayLabel: 'Extérieur',
    periods: 4,
    periodLabel: 'QT',
    overtimeEnabled: true,
    fields: {
      main: [
        { key: 'home', label: 'Dom.', min: 0, max: 999, inputMode: 'numeric' },
        { key: 'away', label: 'Ext.', min: 0, max: 999, inputMode: 'numeric' },
      ],
    },
    individualEncounters: false,
    manOfMatch: true,
  },

  volleyball: {
    scoreType: 'sets',
    homeLabel: 'Domicile',
    awayLabel: 'Extérieur',
    setsToWin: 3,
    maxSets: 5,
    setPoints: 25,
    tiebreakPoints: 15,
    fields: {
      main: [
        { key: 'sets_home', label: 'Sets Dom.', min: 0, max: 5 },
        { key: 'sets_away', label: 'Sets Ext.', min: 0, max: 5 },
      ],
    },
    individualEncounters: false,
    manOfMatch: false,
  },

  handball: {
    scoreType: 'simple',
    homeLabel: 'Domicile',
    awayLabel: 'Extérieur',
    fields: {
      main: [
        { key: 'home', label: 'Dom.', min: 0, max: 99, inputMode: 'numeric' },
        { key: 'away', label: 'Ext.', min: 0, max: 99, inputMode: 'numeric' },
      ],
      optional: [
        { key: 'ht_home', label: 'Mi-temps Dom.', group: 'halftime' },
        { key: 'ht_away', label: 'Mi-temps Ext.', group: 'halftime' },
      ],
    },
    individualEncounters: false,
    manOfMatch: false,
  },

  futsal: {
    scoreType: 'simple',
    homeLabel: 'Domicile',
    awayLabel: 'Extérieur',
    fields: {
      main: [
        { key: 'home', label: 'Dom.', min: 0, max: 99, inputMode: 'numeric' },
        { key: 'away', label: 'Ext.', min: 0, max: 99, inputMode: 'numeric' },
      ],
    },
    individualEncounters: false,
    manOfMatch: false,
  },

  tennis: {
    scoreType: 'individual_encounters',
    homeLabel: 'Domicile',
    awayLabel: 'Extérieur',
    encounterTypes: [
      { key: 'single_1', label: 'Simple 1', players: { home: 1, away: 1 }, order: 0 },
      { key: 'single_2', label: 'Simple 2', players: { home: 1, away: 1 }, order: 1 },
      { key: 'single_3', label: 'Simple 3', players: { home: 1, away: 1 }, order: 2 },
      { key: 'double_1', label: 'Double',   players: { home: 2, away: 2 }, order: 3 },
    ],
    setsPerMatch: 3,
    tiebreakEnabled: true,
    playerFields: ['first_name', 'last_name', 'ranking', 'club'],
    individualEncounters: true,
    manOfMatch: false,
  },

  default: {
    scoreType: 'simple',
    homeLabel: 'Domicile',
    awayLabel: 'Extérieur',
    fields: {
      main: [
        { key: 'home', label: 'Dom.', min: 0, max: 999, inputMode: 'numeric' },
        { key: 'away', label: 'Ext.', min: 0, max: 999, inputMode: 'numeric' },
      ],
    },
    individualEncounters: false,
    manOfMatch: true,
  },
};

/** Retourne la config d'un sport (insensible à la casse). */
export function getSportConfig(sport) {
  if (!sport) return SPORT_MATCH_CONFIGS.default;
  const key = sport.toLowerCase().trim();
  return SPORT_MATCH_CONFIGS[key] ?? SPORT_MATCH_CONFIGS.default;
}

/** Ce sport utilise-t-il des rencontres individuelles ? */
export function hasIndividualEncounters(sport) {
  return getSportConfig(sport).individualEncounters === true;
}
