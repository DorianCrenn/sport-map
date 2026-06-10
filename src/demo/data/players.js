import { DEMO_CLUB_ID } from './club.js';

function makePlayer(idx, name, team, position, number) {
  return {
    id:         `demo-player-${String(idx).padStart(3, '0')}`,
    club_id:    DEMO_CLUB_ID,
    user_id:    null,
    name,
    team_name:  team,
    position,
    number,
    photo_url:  null,
    email:      null,
    phone:      null,
    created_at: '2026-01-15T10:00:00Z',
  };
}

export const demoPlayers = [
  // Équipe 1 Seniors (16 joueurs)
  makePlayer(1,  'Nicolas Perrin',   'Équipe 1', 'Gardien',          1),
  makePlayer(2,  'Romain Quéméner',  'Équipe 1', 'Défenseur central',4),
  makePlayer(3,  'Maxime Briand',    'Équipe 1', 'Défenseur central',5),
  makePlayer(4,  'Kevin Le Goff',    'Équipe 1', 'Latéral droit',    2),
  makePlayer(5,  'Antonin Salaün',   'Équipe 1', 'Latéral gauche',   3),
  makePlayer(6,  'Thomas Guyader',   'Équipe 1', 'Milieu défensif',  6),
  makePlayer(7,  'Pierre Jaouen',    'Équipe 1', 'Milieu central',   8),
  makePlayer(8,  'Lucas Morel',      'Équipe 1', 'Milieu offensif',  10),
  makePlayer(9,  'Clément Hélas',    'Équipe 1', 'Ailier droit',     7),
  makePlayer(10, 'Baptiste Seznec',  'Équipe 1', 'Ailier gauche',    11),
  makePlayer(11, 'Julien Prigent',   'Équipe 1', 'Avant-centre',     9),
  makePlayer(12, 'Florian Calvez',   'Équipe 1', 'Milieu central',   14),
  makePlayer(13, 'Mathieu Dourdain', 'Équipe 1', 'Défenseur central',13),
  makePlayer(14, 'Hugo Kervarrec',   'Équipe 1', 'Latéral droit',    15),
  makePlayer(15, 'Nathan Kermarrec', 'Équipe 1', 'Attaquant',        18),
  makePlayer(16, 'Yann Le Guével',   'Équipe 1', 'Gardien',          16),

  // Réserve (7 joueurs)
  makePlayer(17, 'Enzo Cabioc\'h',   'Réserve', 'Gardien',           1),
  makePlayer(18, 'Gaël Kerboas',     'Réserve', 'Défenseur central', 4),
  makePlayer(19, 'Arnaud Coat',      'Réserve', 'Milieu central',    6),
  makePlayer(20, 'Loïc Brézulier',   'Réserve', 'Attaquant',         9),
  makePlayer(21, 'Simon Hélias',     'Réserve', 'Ailier droit',      7),
  makePlayer(22, 'Tristan Gall',     'Réserve', 'Latéral droit',     2),
  makePlayer(23, 'Dylan Kerdraon',   'Réserve', 'Milieu offensif',   10),

  // U17 (7 joueurs)
  makePlayer(24, 'Théo Tanguy',      'U17', 'Gardien',               1),
  makePlayer(25, 'Liam Creach',      'U17', 'Défenseur central',      4),
  makePlayer(26, 'Mael Rolland',     'U17', 'Milieu central',         6),
  makePlayer(27, 'Ewen Pors',        'U17', 'Ailier gauche',          11),
  makePlayer(28, 'Noa Kerguelen',    'U17', 'Avant-centre',           9),
  makePlayer(29, 'Titouan Jézéquel', 'U17', 'Latéral droit',          2),
  makePlayer(30, 'Mathis Keriven',   'U17', 'Milieu offensif',        10),
];
