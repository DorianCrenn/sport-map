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

export const demoConvocations = [
  ...convocEvent001,
  ...convocEvent002,
  ...convocEvent005,
];
