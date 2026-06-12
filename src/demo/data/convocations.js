import { DEMO_CLUB_ID } from './club.js';

function past(days, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Convocations pour demo-event-001 (match Équipe 1 dans 4 jours)
const convocEvent001 = [
  { id: 'demo-conv-001-01', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-001', player_name: 'Nicolas Perrin',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(1) },
  { id: 'demo-conv-001-02', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-002', player_name: 'Romain Quéméner',  team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(2) },
  { id: 'demo-conv-001-03', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-003', player_name: 'Maxime Briand',    team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(1) },
  { id: 'demo-conv-001-04', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-004', player_name: 'Kevin Le Goff',    team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(2) },
  { id: 'demo-conv-001-05', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-005', player_name: 'Antonin Salaün',   team_name: 'Équipe 1', status: 'declined',    note: 'Indisponible ce jour',   created_at: past(2), responded_at: past(1) },
  { id: 'demo-conv-001-06', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-006', player_name: 'Thomas Guyader',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(2) },
  { id: 'demo-conv-001-07', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-007', player_name: 'Pierre Jaouen',    team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(1) },
  { id: 'demo-conv-001-08', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-008', player_name: 'Lucas Morel',      team_name: 'Équipe 1', status: 'pending',     note: null,                     created_at: past(2), responded_at: null    },
  { id: 'demo-conv-001-09', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-009', player_name: 'Clément Hélas',    team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(1) },
  { id: 'demo-conv-001-10', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-010', player_name: 'Baptiste Seznec',  team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(2) },
  { id: 'demo-conv-001-11', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-011', player_name: 'Julien Prigent',   team_name: 'Équipe 1', status: 'pending',     note: null,                     created_at: past(2), responded_at: null    },
  { id: 'demo-conv-001-12', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-012', player_name: 'Florian Calvez',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(1) },
  { id: 'demo-conv-001-13', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-013', player_name: 'Mathieu Dourdain', team_name: 'Équipe 1', status: 'unavailable', note: 'Blessure à la cheville', created_at: past(2), responded_at: past(2) },
  { id: 'demo-conv-001-14', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-014', player_name: 'Hugo Kervarrec',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(1) },
  { id: 'demo-conv-001-15', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-015', player_name: 'Nathan Kermarrec', team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(2) },
  { id: 'demo-conv-001-16', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-016', player_name: 'Yann Le Guével',   team_name: 'Équipe 1', status: 'pending',     note: null,                     created_at: past(2), responded_at: null    },
  { id: 'demo-conv-001-17', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-031', player_name: 'Erwan Bodéré',     team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(1) },
  { id: 'demo-conv-001-18', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID, player_id: 'demo-player-032', player_name: 'Matthieu Briec',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(2), responded_at: past(2) },
];

// Convocations pour demo-event-002 (Coupe dans 7 jours)
const convocEvent002 = [
  { id: 'demo-conv-002-01', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-001', player_name: 'Nicolas Perrin',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-02', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-002', player_name: 'Romain Quéméner',  team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-03', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-003', player_name: 'Maxime Briand',    team_name: 'Équipe 1', status: 'pending',     note: null,                     created_at: past(1), responded_at: null    },
  { id: 'demo-conv-002-04', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-004', player_name: 'Kevin Le Goff',    team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-05', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-006', player_name: 'Thomas Guyader',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-06', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-007', player_name: 'Pierre Jaouen',    team_name: 'Équipe 1', status: 'pending',     note: null,                     created_at: past(1), responded_at: null    },
  { id: 'demo-conv-002-07', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-008', player_name: 'Lucas Morel',      team_name: 'Équipe 1', status: 'accepted',    note: 'OK pour covoiturage',    created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-08', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-009', player_name: 'Clément Hélas',    team_name: 'Équipe 1', status: 'pending',     note: null,                     created_at: past(1), responded_at: null    },
  { id: 'demo-conv-002-09', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-010', player_name: 'Baptiste Seznec',  team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-10', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-011', player_name: 'Julien Prigent',   team_name: 'Équipe 1', status: 'declined',    note: 'Déplacement professionnel', created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-11', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-012', player_name: 'Florian Calvez',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-12', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-014', player_name: 'Hugo Kervarrec',   team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-13', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-015', player_name: 'Nathan Kermarrec', team_name: 'Équipe 1', status: 'pending',     note: null,                     created_at: past(1), responded_at: null    },
  { id: 'demo-conv-002-14', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-031', player_name: 'Erwan Bodéré',     team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-002-15', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID, player_id: 'demo-player-033', player_name: 'Gauthier Faou',    team_name: 'Équipe 1', status: 'accepted',    note: null,                     created_at: past(1), responded_at: past(1) },
];

// Convocations pour demo-event-005 (championnat dans 18 jours)
const convocEvent005 = [
  { id: 'demo-conv-005-01', event_id: 'demo-event-005', club_id: DEMO_CLUB_ID, player_id: 'demo-player-001', player_name: 'Nicolas Perrin',   team_name: 'Équipe 1', status: 'pending',     note: null, created_at: past(0), responded_at: null },
  { id: 'demo-conv-005-02', event_id: 'demo-event-005', club_id: DEMO_CLUB_ID, player_id: 'demo-player-002', player_name: 'Romain Quéméner',  team_name: 'Équipe 1', status: 'pending',     note: null, created_at: past(0), responded_at: null },
  { id: 'demo-conv-005-03', event_id: 'demo-event-005', club_id: DEMO_CLUB_ID, player_id: 'demo-player-003', player_name: 'Maxime Briand',    team_name: 'Équipe 1', status: 'pending',     note: null, created_at: past(0), responded_at: null },
  { id: 'demo-conv-005-04', event_id: 'demo-event-005', club_id: DEMO_CLUB_ID, player_id: 'demo-player-006', player_name: 'Thomas Guyader',   team_name: 'Équipe 1', status: 'pending',     note: null, created_at: past(0), responded_at: null },
  { id: 'demo-conv-005-05', event_id: 'demo-event-005', club_id: DEMO_CLUB_ID, player_id: 'demo-player-008', player_name: 'Lucas Morel',      team_name: 'Équipe 1', status: 'pending',     note: null, created_at: past(0), responded_at: null },
];

// Convocations pour demo-event-006 (U17, J+6 vs US Bohars)
const convocEvent006 = [
  { id: 'demo-conv-006-01', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-037', player_name: 'Théo Tanguy',      team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-006-02', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-038', player_name: 'Liam Creach',       team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-006-03', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-039', player_name: 'Mael Rolland',      team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(0) },
  { id: 'demo-conv-006-04', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-040', player_name: 'Ewen Pors',         team_name: 'U17', status: 'pending',     note: null,                    created_at: past(1), responded_at: null    },
  { id: 'demo-conv-006-05', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-041', player_name: 'Noa Kerguelen',     team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-006-06', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-042', player_name: 'Titouan Jézéquel', team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(0) },
  { id: 'demo-conv-006-07', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-043', player_name: 'Mathis Keriven',   team_name: 'U17', status: 'pending',     note: null,                    created_at: past(1), responded_at: null    },
  { id: 'demo-conv-006-08', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-044', player_name: 'Ilann Lefloch',    team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-006-09', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-045', player_name: 'Brieuc Salaün',    team_name: 'U17', status: 'declined',    note: 'Voyage scolaire',       created_at: past(1), responded_at: past(0) },
  { id: 'demo-conv-006-10', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-046', player_name: 'Yohan Queffélec',  team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-006-11', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-047', player_name: 'Corentin Roudaut', team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(0) },
  { id: 'demo-conv-006-12', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-048', player_name: 'Sacha Ollivier',   team_name: 'U17', status: 'pending',     note: null,                    created_at: past(1), responded_at: null    },
  { id: 'demo-conv-006-13', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-050', player_name: 'Axel Troadec',     team_name: 'U17', status: 'accepted',    note: null,                    created_at: past(1), responded_at: past(1) },
  { id: 'demo-conv-006-14', event_id: 'demo-event-006', club_id: DEMO_CLUB_ID, player_id: 'demo-player-052', player_name: 'Clément Ar Menn',  team_name: 'U17', status: 'unavailable', note: 'Entorse légère',        created_at: past(1), responded_at: past(0) },
];

// Convocations pour demo-event-017 (Réserve, J+5 vs CA Brest Métropole R)
const convocEvent017 = [
  { id: 'demo-conv-017-01', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-023', player_name: "Enzo Cabioc'h",   team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-02', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-024', player_name: 'Gaël Kerboas',    team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-03', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-025', player_name: 'Arnaud Coat',     team_name: 'Réserve', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-017-04', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-026', player_name: 'Loïc Brézulier', team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-05', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-027', player_name: 'Simon Hélias',    team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-06', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-028', player_name: 'Tristan Gall',    team_name: 'Réserve', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-017-07', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-029', player_name: 'Dylan Kerdraon',  team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-08', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-030', player_name: 'Alexis Pennarun', team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-09', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-031', player_name: 'Kevin Trébaol',   team_name: 'Réserve', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-017-10', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-032', player_name: 'Corentin Floch',  team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-11', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-033', player_name: 'Nicolas Paugam',  team_name: 'Réserve', status: 'declined', note: 'Travail',            created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-12', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-035', player_name: 'Rémi Gourmelon',  team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-017-13', event_id: 'demo-event-017', club_id: DEMO_CLUB_ID, player_id: 'demo-player-036', player_name: 'Tom Pérennou',    team_name: 'Réserve', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
];

// Convocations pour demo-event-007 (Féminines, J+11 vs Quimper FC F)
const convocEvent007 = [
  { id: 'demo-conv-007-01', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-065', player_name: 'Anaëlle Kervran',    team_name: 'Équipe F', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-007-02', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-066', player_name: 'Maïwenn Pouliquen',  team_name: 'Équipe F', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-007-03', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-067', player_name: 'Léa Quéré',          team_name: 'Équipe F', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-007-04', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-068', player_name: 'Camille Burel',      team_name: 'Équipe F', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-007-05', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-069', player_name: 'Sophie Kerboas',     team_name: 'Équipe F', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-007-06', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-070', player_name: 'Manon Le Reste',     team_name: 'Équipe F', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-007-07', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-071', player_name: 'Inès Cloarec',       team_name: 'Équipe F', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-007-08', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-072', player_name: 'Pauline Tanguy',     team_name: 'Équipe F', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-007-09', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-073', player_name: 'Jade Berthou',       team_name: 'Équipe F', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
  { id: 'demo-conv-007-10', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-074', player_name: 'Juliette Morvan',    team_name: 'Équipe F', status: 'pending',  note: null, created_at: past(0), responded_at: null    },
  { id: 'demo-conv-007-11', event_id: 'demo-event-007', club_id: DEMO_CLUB_ID, player_id: 'demo-player-075', player_name: 'Clara Faou',         team_name: 'Équipe F', status: 'accepted', note: null, created_at: past(0), responded_at: past(0) },
];

export const demoConvocations = [
  ...convocEvent001,
  ...convocEvent002,
  ...convocEvent005,
  ...convocEvent006,
  ...convocEvent007,
  ...convocEvent017,
];
