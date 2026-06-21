import { DEMO_CLUB_ID, DEMO_USER_ID } from './club.js';

// Photos CDN randomuser.me — déterministes, stables, vraies photos de personnes
const M = (n) => `https://randomuser.me/api/portraits/men/${n}.jpg`;
const W = (n) => `https://randomuser.me/api/portraits/women/${n}.jpg`;

function makePlayer(idx, name, team, position, number, photoUrl, email, userId = null) {
  return {
    id:         `demo-player-${String(idx).padStart(3, '0')}`,
    club_id:    DEMO_CLUB_ID,
    user_id:    userId,
    name,
    team_name:  team,
    team_id:    team,   // team_id = team_name (identifiant textuel dans categories)
    position,
    number,
    photo_url:  photoUrl,
    email,
    phone:      null,
    is_active:  true,
    created_at: '2026-01-15T10:00:00Z',
  };
}

export const demoPlayers = [
  // ── Équipe 1 Seniors (22 joueurs) ──────────────────────────────────────────
  makePlayer(1,  'Nicolas Perrin',    'Équipe 1', 'Gardien',           1,  M(1),  'nicolas.perrin@fc-sportlink.app',    DEMO_USER_ID),
  makePlayer(2,  'Romain Quéméner',   'Équipe 1', 'Défenseur central', 4,  M(2),  'romain.quemener@fc-sportlink.app'),
  makePlayer(3,  'Maxime Briand',     'Équipe 1', 'Défenseur central', 5,  M(3),  'maxime.briand@fc-sportlink.app'),
  makePlayer(4,  'Kevin Le Goff',     'Équipe 1', 'Latéral droit',     2,  M(4),  'kevin.legoff@fc-sportlink.app'),
  makePlayer(5,  'Antonin Salaün',    'Équipe 1', 'Latéral gauche',    3,  M(5),  'antonin.salaun@fc-sportlink.app'),
  makePlayer(6,  'Thomas Guyader',    'Équipe 1', 'Milieu défensif',   6,  M(6),  'thomas.guyader@fc-sportlink.app'),
  makePlayer(7,  'Pierre Jaouen',     'Équipe 1', 'Milieu central',    8,  M(7),  'pierre.jaouen@fc-sportlink.app'),
  makePlayer(8,  'Lucas Morel',       'Équipe 1', 'Milieu offensif',   10, M(8),  'lucas.morel@fc-sportlink.app'),
  makePlayer(9,  'Clément Hélas',     'Équipe 1', 'Ailier droit',      7,  M(9),  'clement.helas@fc-sportlink.app'),
  makePlayer(10, 'Baptiste Seznec',   'Équipe 1', 'Ailier gauche',     11, M(10), 'baptiste.seznec@fc-sportlink.app'),
  makePlayer(11, 'Julien Prigent',    'Équipe 1', 'Avant-centre',      9,  M(11), 'julien.prigent@fc-sportlink.app'),
  makePlayer(12, 'Florian Calvez',    'Équipe 1', 'Milieu central',    14, M(12), 'florian.calvez@fc-sportlink.app'),
  makePlayer(13, 'Mathieu Dourdain',  'Équipe 1', 'Défenseur central', 13, M(13), 'mathieu.dourdain@fc-sportlink.app'),
  makePlayer(14, 'Hugo Kervarrec',    'Équipe 1', 'Latéral droit',     15, M(14), 'hugo.kervarrec@fc-sportlink.app'),
  makePlayer(15, 'Nathan Kermarrec',  'Équipe 1', 'Attaquant',         18, M(15), 'nathan.kermarrec@fc-sportlink.app'),
  makePlayer(16, 'Yann Le Guével',    'Équipe 1', 'Gardien',           16, M(16), 'yann.leguevel@fc-sportlink.app'),
  makePlayer(17, 'Erwan Bodéré',      'Équipe 1', 'Défenseur central', 19, M(17), 'erwan.bodere@fc-sportlink.app'),
  makePlayer(18, 'Matthieu Briec',    'Équipe 1', 'Milieu défensif',   20, M(18), 'matthieu.briec@fc-sportlink.app'),
  makePlayer(19, 'Gauthier Faou',     'Équipe 1', 'Attaquant',         22, M(19), 'gauthier.faou@fc-sportlink.app'),
  makePlayer(20, 'Raphaël Coic',      'Équipe 1', 'Latéral gauche',    21, M(20), 'raphael.coic@fc-sportlink.app'),
  makePlayer(21, 'Thibault Nédélec',  'Équipe 1', 'Milieu central',    17, M(21), 'thibault.nedelec@fc-sportlink.app'),
  makePlayer(22, 'Sébastien Poher',   'Équipe 1', 'Ailier droit',      23, M(22), 'sebastien.poher@fc-sportlink.app'),

  // ── Réserve (14 joueurs) ───────────────────────────────────────────────────
  makePlayer(23, "Enzo Cabioc'h",     'Réserve',  'Gardien',           1,  M(23), 'enzo.cabioch@fc-sportlink.app'),
  makePlayer(24, 'Gaël Kerboas',      'Réserve',  'Défenseur central', 4,  M(24), 'gael.kerboas@fc-sportlink.app'),
  makePlayer(25, 'Arnaud Coat',       'Réserve',  'Milieu central',    6,  M(25), 'arnaud.coat@fc-sportlink.app'),
  makePlayer(26, 'Loïc Brézulier',    'Réserve',  'Attaquant',         9,  M(26), 'loic.brezulier@fc-sportlink.app'),
  makePlayer(27, 'Simon Hélias',      'Réserve',  'Ailier droit',      7,  M(27), 'simon.helias@fc-sportlink.app'),
  makePlayer(28, 'Tristan Gall',      'Réserve',  'Latéral droit',     2,  M(28), 'tristan.gall@fc-sportlink.app'),
  makePlayer(29, 'Dylan Kerdraon',    'Réserve',  'Milieu offensif',   10, M(29), 'dylan.kerdraon@fc-sportlink.app'),
  makePlayer(30, 'Alexis Pennarun',   'Réserve',  'Défenseur central', 5,  M(30), 'alexis.pennarun@fc-sportlink.app'),
  makePlayer(31, 'Kevin Trébaol',     'Réserve',  'Latéral gauche',    3,  M(31), 'kevin.trebaol@fc-sportlink.app'),
  makePlayer(32, 'Corentin Floch',    'Réserve',  'Milieu défensif',   8,  M(32), 'corentin.floch@fc-sportlink.app'),
  makePlayer(33, 'Nicolas Paugam',    'Réserve',  'Attaquant',         11, M(33), 'nicolas.paugam@fc-sportlink.app'),
  makePlayer(34, 'Damien Séveno',     'Réserve',  'Gardien',           16, M(34), 'damien.seveno@fc-sportlink.app'),
  makePlayer(35, 'Rémi Gourmelon',    'Réserve',  'Milieu central',    14, M(35), 'remi.gourmelon@fc-sportlink.app'),
  makePlayer(36, 'Tom Pérennou',      'Réserve',  'Ailier gauche',     15, M(36), 'tom.perennou@fc-sportlink.app'),

  // ── U17 (16 joueurs) ───────────────────────────────────────────────────────
  makePlayer(37, 'Théo Tanguy',       'U17',      'Gardien',           1,  M(37), 'theo.tanguy@fc-sportlink.app'),
  makePlayer(38, 'Liam Creach',       'U17',      'Défenseur central', 4,  M(38), 'liam.creach@fc-sportlink.app'),
  makePlayer(39, 'Mael Rolland',      'U17',      'Milieu central',    6,  M(39), 'mael.rolland@fc-sportlink.app'),
  makePlayer(40, 'Ewen Pors',         'U17',      'Ailier gauche',     11, M(40), 'ewen.pors@fc-sportlink.app'),
  makePlayer(41, 'Noa Kerguelen',     'U17',      'Avant-centre',      9,  M(41), 'noa.kerguelen@fc-sportlink.app'),
  makePlayer(42, 'Titouan Jézéquel',  'U17',      'Latéral droit',     2,  M(42), 'titouan.jezequel@fc-sportlink.app'),
  makePlayer(43, 'Mathis Keriven',    'U17',      'Milieu offensif',   10, M(43), 'mathis.keriven@fc-sportlink.app'),
  makePlayer(44, 'Ilann Lefloch',     'U17',      'Défenseur central', 5,  M(44), 'ilann.lefloch@fc-sportlink.app'),
  makePlayer(45, 'Brieuc Salaün',     'U17',      'Latéral gauche',    3,  M(45), 'brieuc.salaun@fc-sportlink.app'),
  makePlayer(46, 'Yohan Queffélec',   'U17',      'Milieu défensif',   8,  M(46), 'yohan.queffelec@fc-sportlink.app'),
  makePlayer(47, 'Corentin Roudaut',  'U17',      'Ailier droit',      7,  M(47), 'corentin.roudaut@fc-sportlink.app'),
  makePlayer(48, 'Sacha Ollivier',    'U17',      'Attaquant',         18, M(48), 'sacha.ollivier@fc-sportlink.app'),
  makePlayer(49, 'Louis Diquélou',    'U17',      'Gardien',           16, M(49), 'louis.diqueou@fc-sportlink.app'),
  makePlayer(50, 'Axel Troadec',      'U17',      'Milieu central',    14, M(50), 'axel.troadec@fc-sportlink.app'),
  makePlayer(51, 'Hugo Kermarrec',    'U17',      'Défenseur central', 13, M(51), 'hugo.kermarrec.u17@fc-sportlink.app'),
  makePlayer(52, 'Clément Ar Menn',   'U17',      'Avant-centre',      17, M(52), 'clement.armenn@fc-sportlink.app'),

  // ── U15 (12 joueurs) ───────────────────────────────────────────────────────
  makePlayer(53, 'Erwan Queau',       'U15',      'Gardien',           1,  M(53), 'erwan.queau@fc-sportlink.app'),
  makePlayer(54, 'Maël Bodilis',      'U15',      'Défenseur central', 4,  M(54), 'mael.bodilis@fc-sportlink.app'),
  makePlayer(55, 'Yann Queffélec',    'U15',      'Milieu central',    6,  M(55), 'yann.queffelec.u15@fc-sportlink.app'),
  makePlayer(56, 'Tristan Herry',     'U15',      'Ailier droit',      7,  M(56), 'tristan.herry@fc-sportlink.app'),
  makePlayer(57, 'Luc Mével',         'U15',      'Avant-centre',      9,  M(57), 'luc.mevel@fc-sportlink.app'),
  makePlayer(58, 'Gauthier Brélivet', 'U15',      'Latéral droit',     2,  M(58), 'gauthier.brelivet@fc-sportlink.app'),
  makePlayer(59, 'Mathieu Guégan',    'U15',      'Milieu offensif',   10, M(59), 'mathieu.guegan@fc-sportlink.app'),
  makePlayer(60, 'Enzo Gloaguen',     'U15',      'Défenseur central', 5,  M(60), 'enzo.gloaguen@fc-sportlink.app'),
  makePlayer(61, 'Louan Riou',        'U15',      'Ailier gauche',     11, M(61), 'louan.riou@fc-sportlink.app'),
  makePlayer(62, 'Antonin Conan',     'U15',      'Milieu défensif',   8,  M(62), 'antonin.conan@fc-sportlink.app'),
  makePlayer(63, 'Baptiste Péron',    'U15',      'Attaquant',         14, M(63), 'baptiste.peron@fc-sportlink.app'),
  makePlayer(64, 'Noa Talec',         'U15',      'Gardien',           16, M(64), 'noa.talec@fc-sportlink.app'),

  // ── Féminines (11 joueuses) ────────────────────────────────────────────────
  makePlayer(65, 'Anaëlle Kervran',   'Équipe F', 'Gardienne',              1,  W(1),  'anaelle.kervran@fc-sportlink.app'),
  makePlayer(66, 'Maïwenn Pouliquen', 'Équipe F', 'Défenseure centrale',    4,  W(2),  'maiwenn.pouliquen@fc-sportlink.app'),
  makePlayer(67, 'Léa Quéré',         'Équipe F', 'Défenseure centrale',    5,  W(3),  'lea.quere@fc-sportlink.app'),
  makePlayer(68, 'Camille Burel',     'Équipe F', 'Latérale droite',        2,  W(4),  'camille.burel@fc-sportlink.app'),
  makePlayer(69, 'Sophie Kerboas',    'Équipe F', 'Milieu centrale',        6,  W(5),  'sophie.kerboas@fc-sportlink.app'),
  makePlayer(70, 'Manon Le Reste',    'Équipe F', 'Milieu offensif',        10, W(6),  'manon.lereste@fc-sportlink.app'),
  makePlayer(71, 'Inès Cloarec',      'Équipe F', 'Ailière droite',         7,  W(7),  'ines.cloarec@fc-sportlink.app'),
  makePlayer(72, 'Pauline Tanguy',    'Équipe F', 'Ailière gauche',         11, W(8),  'pauline.tanguy@fc-sportlink.app'),
  makePlayer(73, 'Jade Berthou',      'Équipe F', 'Avant-centre',           9,  W(9),  'jade.berthou@fc-sportlink.app'),
  makePlayer(74, 'Juliette Morvan',   'Équipe F', 'Latérale gauche',        3,  W(10), 'juliette.morvan@fc-sportlink.app'),
  makePlayer(75, 'Clara Faou',        'Équipe F', 'Milieu défensif',        8,  W(11), 'clara.faou@fc-sportlink.app'),
];
