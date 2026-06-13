// ─────────────────────────────────────────────────────────────────────────────
// eventFormConstants.js — Constantes partagées du formulaire d'événements
// ─────────────────────────────────────────────────────────────────────────────

export const BREST = { name: 'Brest', lat: 48.3904, lng: -4.4861 };

export const TEAM_PRESETS = {
  Football:   ['Seniors A', 'Seniors B', 'Seniors C', 'U18 A', 'U18 B', 'U15 A', 'U15 B', 'U13 A', 'U13 B', 'U11', 'Féminines A', 'Féminines B', 'Vétérans'],
  Handball:   ['Seniors Masculins', 'Seniors Féminines', 'U18 Masculins', 'U18 Féminines', 'U15 A', 'U15 B', 'U13', 'U11'],
  Basketball: ['Seniors Masculins', 'Seniors Féminines', 'Espoirs', 'U18 M', 'U18 F', 'U15', 'U13', 'U11'],
  Rugby:      ['Seniors 1', 'Seniors 2', 'Espoirs', 'U18 A', 'U18 B', 'U15', 'Féminines'],
  Running:    ['Elite', 'Seniors', 'Juniors', 'Vétérans', 'Tout niveau'],
  Trail:      ['Elite', 'Seniors', 'Vétérans', 'Tout niveau'],
  Cyclisme:   ['Elite', 'Seniors', 'Espoirs', 'Juniors', 'Vétérans'],
};

export const CHAMPIONSHIP_LEVELS = {
  Football: [
    // Seniors masculins
    { value: 'National', label: 'National'              },
    { value: 'R1',       label: 'R1 — Régional 1'       },
    { value: 'R2',       label: 'R2 — Régional 2'       },
    { value: 'R3',       label: 'R3 — Régional 3'       },
    { value: 'DH',       label: "DH — Division d'Honneur" },
    { value: 'D1',       label: 'D1 — District 1'       },
    { value: 'D2',       label: 'D2 — District 2'       },
    { value: 'D3',       label: 'D3 — District 3'       },
    // Féminines seniors
    { value: 'R1 F',     label: 'R1 F — Régional 1 Féminin' },
    { value: 'R2 F',     label: 'R2 F — Régional 2 Féminin' },
    { value: 'D1 F',     label: 'D1 F — District 1 Féminin' },
    { value: 'D2 F',     label: 'D2 F — District 2 Féminin' },
    // U17
    { value: 'R1 U17',   label: 'R1 U17 — Régional 1 U17'   },
    { value: 'R2 U17',   label: 'R2 U17 — Régional 2 U17'   },
    { value: 'D1 U17',   label: 'D1 U17 — District 1 U17'   },
    { value: 'D2 U17',   label: 'D2 U17 — District 2 U17'   },
    // U15
    { value: 'D1 U15',   label: 'D1 U15 — District 1 U15'   },
    { value: 'D2 U15',   label: 'D2 U15 — District 2 U15'   },
    { value: 'D1 U15 F', label: 'D1 U15 F — District 1 U15 Féminin' },
    // U13
    { value: 'D1 U13',   label: 'D1 U13 — District 1 U13'   },
    { value: 'D2 U13',   label: 'D2 U13 — District 2 U13'   },
    // U11
    { value: 'D1 U11',   label: 'D1 U11 — District 1 U11'   },
    { value: 'D2 U11',   label: 'D2 U11 — District 2 U11'   },
  ],
  Handball: [
    { value: 'N3',   label: 'N3 — Nationale 3' },
    { value: 'R1',   label: 'R1 — Régionale 1' },
    { value: 'R2',   label: 'R2 — Régionale 2' },
    { value: 'Dept', label: 'Départementale' },
  ],
  Basketball: [
    { value: 'ProB', label: 'Pro B' },
    { value: 'N2',   label: 'N2 — Nationale 2' },
    { value: 'N3',   label: 'N3 — Nationale 3' },
    { value: 'R1',   label: 'R1 — Régionale 1' },
    { value: 'R2',   label: 'R2 — Régionale 2' },
    { value: 'Dept', label: 'Départementale' },
  ],
  Rugby: [
    { value: 'F1', label: 'F1 — Fédérale 1' },
    { value: 'F2', label: 'F2 — Fédérale 2' },
    { value: 'F3', label: 'F3 — Fédérale 3' },
    { value: 'R1', label: 'R1 — Régionale 1' },
    { value: 'R2', label: 'R2 — Régionale 2' },
  ],
  default: [
    { value: 'National', label: 'National' },
    { value: 'R1',       label: 'R1 — Régional 1' },
    { value: 'R2',       label: 'R2 — Régional 2' },
    { value: 'Dept',     label: 'Départemental' },
  ],
};

export const CUP_TYPES = [
  { value: 'Coupe de France',    label: 'Coupe de France'    },
  { value: 'Coupe de Bretagne',  label: 'Coupe de Bretagne'  },
  { value: 'Coupe du Finistère', label: 'Coupe du Finistère' },
  { value: 'Coupe régionale',    label: 'Coupe régionale'    },
  { value: 'Coupe de district',  label: 'Coupe de district'  },
  { value: 'Tournoi amical',     label: 'Tournoi amical'     },
];

export const TOURNAMENT_TYPES = [
  { value: 'Local',         label: 'Local'         },
  { value: 'Régional',      label: 'Régional'      },
  { value: 'National',      label: 'National'      },
  { value: 'International', label: 'International' },
  { value: 'Scolaire',      label: 'Scolaire'      },
  { value: 'Entreprises',   label: 'Entreprises'   },
  { value: 'Interne',       label: 'Interne'       },
];

export const NUM_TEAMS_OPTIONS = ['4', '6', '8', '10', '12', '16', '24', '32'];

export const TOURNAMENT_FORMATS = [
  { value: 'Poules + Élimination directe', label: 'Poules + Élim.' },
  { value: 'Poules seules',                label: 'Poules'         },
  { value: 'Élimination directe',          label: 'Élim. directe'  },
  { value: 'Swiss',                        label: 'Swiss'          },
  { value: 'Round Robin',                  label: 'Round Robin'    },
];

export const EMPTY_FORM = {
  title: '', sport: 'Football', date: '', time: '15:00',
  cityName: BREST.name, cityLat: BREST.lat, cityLng: BREST.lng,
  venue: '', description: '',
  eventType: 'championship', teamName: '', category: '',
  level: '', cupType: '', homeOrAway: 'home', adversaire: '',
  homeTeam: '', awayTeam: '',
  recurrenceEnabled: false, recurrenceFreq: 'weekly', recurrenceUntil: '',
  tournamentName: '', tournamentType: '', numTeams: '',
  tournamentFormat: '', tournamentCategories: '', prize: '', organizer: '',
  manOfMatch: '',
};
