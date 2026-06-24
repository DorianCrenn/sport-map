// Clubs répartis sur toute la France — alimentent la carte et montrent la diversité sportive

function future(days: number, hour = 15, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}
function past(days: number, hour = 15) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── CLUB F01 — AS Paris 18e (Football, Paris) ────────────────────────────────

const CLUB_P18_ID = 'demo-club-f01';
const clubParis18 = {
  id: CLUB_P18_ID, user_id: 'demo-mgr-f01',
  name: 'AS Paris 18e', sport: 'Football', city: 'Paris',
  description: 'Club de quartier fondé en 1987, évoluant en Division Honneur Île-de-France. 350 licenciés, 14 équipes.',
  logo_url: null, website: null, phone: '01 42 59 34 78', email: 'contact@as-paris18.fr',
  categories: [
    { id: 'cat_p18_sen', name: 'Seniors', teams: [{ id: 'Seniors A', name: 'Seniors A', level: 'DH Île-de-France' }, { id: 'Seniors B', name: 'Seniors B', level: 'Régional 2' }] },
    { id: 'cat_p18_u17', name: 'Jeunes', teams: [{ id: 'U17', name: 'U17', level: 'Régional' }, { id: 'U15', name: 'U15', level: 'Régional' }] },
  ],
  status: 'verified', verified_at: '2026-02-10T09:00:00Z', verification_note: null,
  sigle: 'ASP18', slogan: 'Le foot, la vie du quartier', founding_year: 1987,
  primary_color: '#dc2626', banner_url: null,
  venue: 'Stade Émile-Anthoine', address: '9 Rue Jean Rey', postal_code: '75015',
  region: 'Île-de-France', lat: 48.8538, lng: 2.2876,
  manager_name: 'Karim Belkacem', manager_function: 'Président', manager_phone: '06 71 23 45 67',
  member_count: 350, level: 'Division Honneur',
  facebook: 'asparis18', instagram: 'as_paris_18e', tiktok: '',
  created_at: '2026-01-20T10:00:00Z',
};

const playersParis18 = [
  { id: 'demo-p-f01-01', club_id: CLUB_P18_ID, user_id: null, name: 'Mehdi Ziani',       team_id: 'Seniors A', position: 'Gardien',          number: 1, photo_url: 'https://randomuser.me/api/portraits/men/70.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-p-f01-02', club_id: CLUB_P18_ID, user_id: null, name: 'Lucas Traoré',      team_id: 'Seniors A', position: 'Défenseur',         number: 4, photo_url: 'https://randomuser.me/api/portraits/men/71.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-p-f01-03', club_id: CLUB_P18_ID, user_id: null, name: 'Théo Marchand',     team_id: 'Seniors A', position: 'Milieu',            number: 8, photo_url: 'https://randomuser.me/api/portraits/men/72.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-p-f01-04', club_id: CLUB_P18_ID, user_id: null, name: 'Idrissa Diallo',    team_id: 'Seniors A', position: 'Attaquant',         number: 9, photo_url: 'https://randomuser.me/api/portraits/men/73.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
];

const eventsParis18 = [
  { id: 'demo-evt-f01-01', club_id: CLUB_P18_ID, user_id: 'demo-mgr-f01', title: 'AS Paris 18e vs FC Belleville', sport: 'Football', date: future(3, 15), lat: 48.8538, lng: 2.2876, city: 'Paris', venue: 'Stade Émile-Anthoine', level: 'Division Honneur', event_type: 'championship', team_name: 'Seniors A', adversaire: 'FC Belleville', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(5) },
  { id: 'demo-evt-f01-02', club_id: CLUB_P18_ID, user_id: 'demo-mgr-f01', title: 'AS Paris 18e @ Sporting Club Paris', sport: 'Football', date: future(10, 14, 30), lat: 48.8701, lng: 2.3472, city: 'Paris', venue: 'Terrain du Sporting', level: 'Division Honneur', event_type: 'championship', team_name: 'Seniors A', adversaire: 'Sporting Club Paris', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f01-03', club_id: CLUB_P18_ID, user_id: 'demo-mgr-f01', title: 'AS Paris 18e vs Red Star IDF', sport: 'Football', date: future(17, 16), lat: 48.8538, lng: 2.2876, city: 'Paris', venue: 'Stade Émile-Anthoine', level: 'Division Honneur', event_type: 'championship', team_name: 'Seniors A', adversaire: 'Red Star IDF', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(1) },
  { id: 'demo-evt-f01-04', club_id: CLUB_P18_ID, user_id: 'demo-mgr-f01', title: 'Résultat — AS Paris 18e 2-0 SC Épinay', sport: 'Football', date: past(7, 14), lat: 48.8538, lng: 2.2876, city: 'Paris', venue: 'Stade Émile-Anthoine', level: 'Division Honneur', event_type: 'championship', team_name: 'Seniors A', adversaire: 'SC Épinay', home_or_away: 'home', score: '2-0', source: 'user', is_archived: false, created_at: past(10) },
];

const annParis18 = [
  { id: 'demo-ann-f01-01', club_id: CLUB_P18_ID, club_name: 'AS Paris 18e', author_id: 'demo-mgr-f01', author_name: 'Karim Belkacem', type: 'result', title: '✅ Victoire 2-0 face à SC Épinay !', message: 'Belle maîtrise collective, 2 buts en seconde période. On reste dans le top 4 !', target_teams: [], scheduled_for: null, created_at: past(7, 19) },
  { id: 'demo-ann-f01-02', club_id: CLUB_P18_ID, club_name: 'AS Paris 18e', author_id: 'demo-mgr-f01', author_name: 'Karim Belkacem', type: 'info', title: '📋 Reprise des entraînements — mardi 18h30', message: 'Reprise ce mardi à 18h30 sur le terrain municipal. Présence obligatoire pour les convoqués.', target_teams: [], scheduled_for: null, created_at: past(2, 10) },
];

// ─── CLUB F02 — Lyon Olympique Club (Football, Lyon) ──────────────────────────

const CLUB_LYON_ID = 'demo-club-f02';
const clubLyon = {
  id: CLUB_LYON_ID, user_id: 'demo-mgr-f02',
  name: 'Lyon Olympique Club', sport: 'Football', city: 'Lyon',
  description: 'Club lyonnais fondé en 1962, en Régional 1 Auvergne-Rhône-Alpes. 420 membres.',
  logo_url: null, website: null, phone: '04 78 32 56 89', email: 'contact@lyon-oc.fr',
  categories: [
    { id: 'cat_lyon_sen', name: 'Seniors', teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'Régional 1' }] },
    { id: 'cat_lyon_u19', name: 'U19/U17', teams: [{ id: 'U19', name: 'U19', level: 'Régional' }, { id: 'U17', name: 'U17', level: 'Régional' }] },
  ],
  status: 'verified', verified_at: '2026-01-25T09:00:00Z', verification_note: null,
  sigle: 'LOC', slogan: 'Ensemble, vers le sommet', founding_year: 1962,
  primary_color: '#b45309', banner_url: null,
  venue: 'Stade André-Chanal', address: '12 Avenue du Stade', postal_code: '69003',
  region: 'Auvergne-Rhône-Alpes', lat: 45.7480, lng: 4.8392,
  manager_name: 'Sébastien Morel', manager_function: 'Directeur sportif', manager_phone: '06 82 34 56 78',
  member_count: 420, level: 'Régional 1',
  facebook: 'lyonolympiqueclub', instagram: 'lyon_oc', tiktok: '',
  created_at: '2026-01-25T10:00:00Z',
};

const playersLyon = [
  { id: 'demo-p-f02-01', club_id: CLUB_LYON_ID, user_id: null, name: 'Antoine Rivière',  team_id: 'Équipe 1', position: 'Gardien',  number: 1, photo_url: 'https://randomuser.me/api/portraits/men/74.jpg', email: null, is_active: true, created_at: '2026-01-25T10:00:00Z' },
  { id: 'demo-p-f02-02', club_id: CLUB_LYON_ID, user_id: null, name: 'Matteo Poncet',    team_id: 'Équipe 1', position: 'Défenseur', number: 5, photo_url: 'https://randomuser.me/api/portraits/men/75.jpg', email: null, is_active: true, created_at: '2026-01-25T10:00:00Z' },
  { id: 'demo-p-f02-03', club_id: CLUB_LYON_ID, user_id: null, name: 'Florent Garnier',  team_id: 'Équipe 1', position: 'Milieu',   number: 6, photo_url: 'https://randomuser.me/api/portraits/men/76.jpg', email: null, is_active: true, created_at: '2026-01-25T10:00:00Z' },
  { id: 'demo-p-f02-04', club_id: CLUB_LYON_ID, user_id: null, name: 'Enzo Bartolini',   team_id: 'Équipe 1', position: 'Attaquant', number: 10, photo_url: 'https://randomuser.me/api/portraits/men/77.jpg', email: null, is_active: true, created_at: '2026-01-25T10:00:00Z' },
];

const eventsLyon = [
  { id: 'demo-evt-f02-01', club_id: CLUB_LYON_ID, user_id: 'demo-mgr-f02', title: 'Lyon Olympique vs US Vénissieux', sport: 'Football', date: future(5, 15), lat: 45.7480, lng: 4.8392, city: 'Lyon', venue: 'Stade André-Chanal', level: 'Régional 1', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'US Vénissieux', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(4) },
  { id: 'demo-evt-f02-02', club_id: CLUB_LYON_ID, user_id: 'demo-mgr-f02', title: 'Lyon OC @ FC Villeurbanne', sport: 'Football', date: future(12, 14), lat: 45.7648, lng: 4.8796, city: 'Villeurbanne', venue: 'Stade des Brosses', level: 'Régional 1', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'FC Villeurbanne', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
  { id: 'demo-evt-f02-03', club_id: CLUB_LYON_ID, user_id: 'demo-mgr-f02', title: 'Résultat — Lyon OC 1-1 AS Bron', sport: 'Football', date: past(6, 15), lat: 45.7480, lng: 4.8392, city: 'Lyon', venue: 'Stade André-Chanal', level: 'Régional 1', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'AS Bron', home_or_away: 'home', score: '1-1', source: 'user', is_archived: false, created_at: past(9) },
];

const annLyon = [
  { id: 'demo-ann-f02-01', club_id: CLUB_LYON_ID, club_name: 'Lyon Olympique Club', author_id: 'demo-mgr-f02', author_name: 'Sébastien Morel', type: 'result', title: '⚖️ Nul 1-1 contre AS Bron — on aurait mérité plus', message: 'Match équilibré, égalisation à la 87e. On continue à travailler pour la prochaine journée.', target_teams: [], scheduled_for: null, created_at: past(6, 18) },
  { id: 'demo-ann-f02-02', club_id: CLUB_LYON_ID, club_name: 'Lyon Olympique Club', author_id: 'demo-mgr-f02', author_name: 'Sébastien Morel', type: 'event', title: '🏃 Stage de préparation — 5-6 juillet à Annecy', message: 'Stage optionnel pour renforcer la cohésion avant la reprise. Inscription avant le 1er juillet.', target_teams: ['Équipe 1'], scheduled_for: null, created_at: past(3, 11) },
];

// ─── CLUB F03 — Marseille Athletic FC (Football, Marseille) ───────────────────

const CLUB_MRS_ID = 'demo-club-f03';
const clubMarseille = {
  id: CLUB_MRS_ID, user_id: 'demo-mgr-f03',
  name: 'Marseille Athletic FC', sport: 'Football', city: 'Marseille',
  description: 'Club du 13e arrondissement, 5 équipes séniors, évolution en DH Méditerranée. 280 licenciés.',
  logo_url: null, website: null, phone: '04 91 34 57 82', email: 'contact@marseille-afc.fr',
  categories: [
    { id: 'cat_mrs_sen', name: 'Seniors', teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'DH Méditerranée' }] },
    { id: 'cat_mrs_fem', name: 'Féminines', teams: [{ id: 'Féminines', name: 'Féminines', level: 'R2 F' }] },
  ],
  status: 'verified', verified_at: '2026-02-01T09:00:00Z', verification_note: null,
  sigle: 'MAFC', slogan: 'Le foot du soleil', founding_year: 1973,
  primary_color: '#1d4ed8', banner_url: null,
  venue: 'Stade de la Soude', address: '42 Bd de la Soude', postal_code: '13009',
  region: "Provence-Alpes-Côte d'Azur", lat: 43.2516, lng: 5.4162,
  manager_name: 'Omar Fayed', manager_function: 'Président', manager_phone: '06 13 45 67 89',
  member_count: 280, level: 'DH Méditerranée',
  facebook: 'marseilleathleticfc', instagram: 'marseille_afc', tiktok: '',
  created_at: '2026-02-01T10:00:00Z',
};

const playersMarseille = [
  { id: 'demo-p-f03-01', club_id: CLUB_MRS_ID, user_id: null, name: 'Sofiane Benali',    team_id: 'Équipe 1', position: 'Gardien',  number: 1, photo_url: 'https://randomuser.me/api/portraits/men/78.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-p-f03-02', club_id: CLUB_MRS_ID, user_id: null, name: 'Dylan Rocha',       team_id: 'Équipe 1', position: 'Défenseur', number: 3, photo_url: 'https://randomuser.me/api/portraits/men/79.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-p-f03-03', club_id: CLUB_MRS_ID, user_id: null, name: 'Amine Cherif',      team_id: 'Équipe 1', position: 'Milieu',   number: 7, photo_url: 'https://randomuser.me/api/portraits/men/80.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-p-f03-04', club_id: CLUB_MRS_ID, user_id: null, name: 'Kévin Almeida',     team_id: 'Équipe 1', position: 'Attaquant', number: 11, photo_url: 'https://randomuser.me/api/portraits/men/81.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
];

const eventsMarseille = [
  { id: 'demo-evt-f03-01', club_id: CLUB_MRS_ID, user_id: 'demo-mgr-f03', title: 'Marseille AFC vs Toulon Olympique', sport: 'Football', date: future(4, 16), lat: 43.2516, lng: 5.4162, city: 'Marseille', venue: 'Stade de la Soude', level: 'DH Méditerranée', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'Toulon Olympique', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f03-02', club_id: CLUB_MRS_ID, user_id: 'demo-mgr-f03', title: 'Marseille AFC @ OGC Nice Réserve', sport: 'Football', date: future(11, 14), lat: 43.7102, lng: 7.2620, city: 'Nice', venue: 'Stade de Nice Réserve', level: 'DH Méditerranée', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'OGC Nice Réserve', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
  { id: 'demo-evt-f03-03', club_id: CLUB_MRS_ID, user_id: 'demo-mgr-f03', title: 'Marseille AFC vs SC Aix-en-Provence', sport: 'Football', date: future(18, 15), lat: 43.2516, lng: 5.4162, city: 'Marseille', venue: 'Stade de la Soude', level: 'DH Méditerranée', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'SC Aix-en-Provence', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(0) },
];

const annMarseille = [
  { id: 'demo-ann-f03-01', club_id: CLUB_MRS_ID, club_name: 'Marseille Athletic FC', author_id: 'demo-mgr-f03', author_name: 'Omar Fayed', type: 'urgent', title: '⚠️ Match avancé samedi — heure modifiée : 16h', message: 'Suite à une demande de la commission, le coup de sifflet sera à 16h et non 15h. Merci de prévenir vos proches.', target_teams: [], scheduled_for: null, created_at: past(1, 14) },
  { id: 'demo-ann-f03-02', club_id: CLUB_MRS_ID, club_name: 'Marseille Athletic FC', author_id: 'demo-mgr-f03', author_name: 'Omar Fayed', type: 'info', title: '👕 Maillots saison 2026-27 en commande', message: 'La commande collective des maillots est ouverte. Répondez au formulaire avant vendredi.', target_teams: [], scheduled_for: null, created_at: past(4, 9) },
];

// ─── CLUB F04 — Bordeaux Étudiants Club Rugby (Rugby, Bordeaux) ───────────────

const CLUB_BDX_ID = 'demo-club-f04';
const clubBordeaux = {
  id: CLUB_BDX_ID, user_id: 'demo-mgr-f04',
  name: 'Bordeaux Étudiants Club', sport: 'Rugby', city: 'Bordeaux',
  description: 'BEC, fondé en 1899 — un des plus anciens clubs de rugby du Sud-Ouest. Fédérale 2.',
  logo_url: null, website: null, phone: '05 56 43 21 67', email: 'contact@bec-rugby.fr',
  categories: [
    { id: 'cat_bdx_sen', name: 'Seniors', teams: [{ id: 'XV', name: 'XV', level: 'Fédérale 2' }, { id: 'B XV', name: 'B XV', level: 'Régional' }] },
    { id: 'cat_bdx_u20', name: 'Jeunes', teams: [{ id: 'U20', name: 'U20', level: 'Nationale' }, { id: 'U18', name: 'U18', level: 'Régional' }] },
  ],
  status: 'verified', verified_at: '2026-01-15T09:00:00Z', verification_note: null,
  sigle: 'BEC', slogan: 'Rugby, tradition et excellence', founding_year: 1899,
  primary_color: '#7c3aed', banner_url: null,
  venue: 'Stade André-Moga', address: '22 Cours Pasteur', postal_code: '33000',
  region: 'Nouvelle-Aquitaine', lat: 44.8350, lng: -0.5765,
  manager_name: 'Pierre-Henri Dubroca', manager_function: 'Président', manager_phone: '06 45 67 89 01',
  member_count: 520, level: 'Fédérale 2',
  facebook: 'bec.rugby', instagram: 'bec_rugby_bordeaux', tiktok: '',
  created_at: '2026-01-15T10:00:00Z',
};

const playersBordeaux = [
  { id: 'demo-p-f04-01', club_id: CLUB_BDX_ID, user_id: null, name: 'Hugo Duplantier',   team_id: 'XV', position: 'Talonneur',     number: 2, photo_url: 'https://randomuser.me/api/portraits/men/82.jpg', email: null, is_active: true, created_at: '2026-01-15T10:00:00Z' },
  { id: 'demo-p-f04-02', club_id: CLUB_BDX_ID, user_id: null, name: 'Rémi Castaing',     team_id: 'XV', position: 'Pilier',        number: 1, photo_url: 'https://randomuser.me/api/portraits/men/83.jpg', email: null, is_active: true, created_at: '2026-01-15T10:00:00Z' },
  { id: 'demo-p-f04-03', club_id: CLUB_BDX_ID, user_id: null, name: 'Mathieu Serin',     team_id: 'XV', position: 'Demi de mêlée', number: 9, photo_url: 'https://randomuser.me/api/portraits/men/84.jpg', email: null, is_active: true, created_at: '2026-01-15T10:00:00Z' },
  { id: 'demo-p-f04-04', club_id: CLUB_BDX_ID, user_id: null, name: 'Lucas Méret',       team_id: 'XV', position: 'Ailier',        number: 11, photo_url: 'https://randomuser.me/api/portraits/men/85.jpg', email: null, is_active: true, created_at: '2026-01-15T10:00:00Z' },
];

const eventsBordeaux = [
  { id: 'demo-evt-f04-01', club_id: CLUB_BDX_ID, user_id: 'demo-mgr-f04', title: 'BEC Bordeaux vs RC Périgueux', sport: 'Rugby', date: future(6, 15), lat: 44.8350, lng: -0.5765, city: 'Bordeaux', venue: 'Stade André-Moga', level: 'Fédérale 2', event_type: 'championship', team_name: 'XV', adversaire: 'RC Périgueux', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(5) },
  { id: 'demo-evt-f04-02', club_id: CLUB_BDX_ID, user_id: 'demo-mgr-f04', title: 'BEC @ US Dax', sport: 'Rugby', date: future(13, 14, 30), lat: 43.7124, lng: -1.0558, city: 'Dax', venue: 'Stade Alouettes', level: 'Fédérale 2', event_type: 'championship', team_name: 'XV', adversaire: 'US Dax', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f04-03', club_id: CLUB_BDX_ID, user_id: 'demo-mgr-f04', title: 'Tournoi U20 Bordeaux — 8 clubs', sport: 'Rugby', date: future(20, 9), lat: 44.8350, lng: -0.5765, city: 'Bordeaux', venue: 'Stade André-Moga', level: 'Jeunes', event_type: 'tournament', team_name: 'U20', adversaire: '7 clubs', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(1) },
  { id: 'demo-evt-f04-04', club_id: CLUB_BDX_ID, user_id: 'demo-mgr-f04', title: 'BEC 28-10 CA Brive', sport: 'Rugby', date: past(8, 15), lat: 44.8350, lng: -0.5765, city: 'Bordeaux', venue: 'Stade André-Moga', level: 'Fédérale 2', event_type: 'championship', team_name: 'XV', adversaire: 'CA Brive', home_or_away: 'home', score: '28-10', source: 'user', is_archived: false, created_at: past(11) },
];

const annBordeaux = [
  { id: 'demo-ann-f04-01', club_id: CLUB_BDX_ID, club_name: 'Bordeaux Étudiants Club', author_id: 'demo-mgr-f04', author_name: 'Pierre-Henri Dubroca', type: 'result', title: '🏉 Victoire 28-10 face à CA Brive !', message: 'Grande maîtrise des avants en première période. Le BEC confirme sa 3e place au classement.', target_teams: [], scheduled_for: null, created_at: past(8, 18) },
  { id: 'demo-ann-f04-02', club_id: CLUB_BDX_ID, club_name: 'Bordeaux Étudiants Club', author_id: 'demo-mgr-f04', author_name: 'Pierre-Henri Dubroca', type: 'event', title: '🎉 Banquet annuel BEC — 30 juin 2026', message: 'Le traditionnel banquet de fin de saison aura lieu au Château du Bouscat. 50€/pers, inscriptions ouvertes.', target_teams: [], scheduled_for: null, created_at: past(5, 10) },
];

// ─── CLUB F05 — Nantes Métropole Handball (Handball, Nantes) ─────────────────

const CLUB_NTE_ID = 'demo-club-f05';
const clubNantes = {
  id: CLUB_NTE_ID, user_id: 'demo-mgr-f05',
  name: 'Nantes Métropole Handball', sport: 'Handball', city: 'Nantes',
  description: 'Club de handball de l\'agglomération nantaise, évoluant en Nationale 3. 210 licenciés.',
  logo_url: null, website: null, phone: '02 40 47 23 56', email: 'contact@nantes-handball.fr',
  categories: [
    { id: 'cat_nte_sen', name: 'Seniors', teams: [{ id: 'Seniors M', name: 'Seniors M', level: 'Nationale 3' }, { id: 'Seniors F', name: 'Seniors F', level: 'Régionale 1' }] },
  ],
  status: 'verified', verified_at: '2026-02-05T09:00:00Z', verification_note: null,
  sigle: 'NMH', slogan: 'Ensemble on va plus loin', founding_year: 1981,
  primary_color: '#0ea5e9', banner_url: null,
  venue: 'Salle de la Trocardière', address: '1 Bd des Martyrs Nantais', postal_code: '44400',
  region: 'Pays de la Loire', lat: 47.2173, lng: -1.5534,
  manager_name: 'Nathalie Lecuyer', manager_function: 'Présidente', manager_phone: '06 56 78 90 12',
  member_count: 210, level: 'Nationale 3',
  facebook: 'nantesmetropolehandball', instagram: 'nmh_nantes', tiktok: '',
  created_at: '2026-02-05T10:00:00Z',
};

const playersNantes = [
  { id: 'demo-p-f05-01', club_id: CLUB_NTE_ID, user_id: null, name: 'Alexis Doré',       team_id: 'Seniors M', position: 'Gardien',  number: 1, photo_url: 'https://randomuser.me/api/portraits/men/86.jpg', email: null, is_active: true, created_at: '2026-02-05T10:00:00Z' },
  { id: 'demo-p-f05-02', club_id: CLUB_NTE_ID, user_id: null, name: 'Julien Carre',       team_id: 'Seniors M', position: 'Ailier droit', number: 7, photo_url: 'https://randomuser.me/api/portraits/men/87.jpg', email: null, is_active: true, created_at: '2026-02-05T10:00:00Z' },
  { id: 'demo-p-f05-03', club_id: CLUB_NTE_ID, user_id: null, name: 'Camille Tessier',   team_id: 'Seniors F', position: 'Pivot',    number: 14, photo_url: 'https://randomuser.me/api/portraits/women/42.jpg', email: null, is_active: true, created_at: '2026-02-05T10:00:00Z' },
];

const eventsNantes = [
  { id: 'demo-evt-f05-01', club_id: CLUB_NTE_ID, user_id: 'demo-mgr-f05', title: 'NMH vs Cholet Handball', sport: 'Handball', date: future(2, 20), lat: 47.2173, lng: -1.5534, city: 'Nantes', venue: 'Salle de la Trocardière', level: 'Nationale 3', event_type: 'championship', team_name: 'Seniors M', adversaire: 'Cholet Handball', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(4) },
  { id: 'demo-evt-f05-02', club_id: CLUB_NTE_ID, user_id: 'demo-mgr-f05', title: 'NMH @ HBC La Roche', sport: 'Handball', date: future(9, 19), lat: 46.6706, lng: -1.4275, city: 'La Roche-sur-Yon', venue: 'Palais des Sports', level: 'Nationale 3', event_type: 'championship', team_name: 'Seniors M', adversaire: 'HBC La Roche', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
  { id: 'demo-evt-f05-03', club_id: CLUB_NTE_ID, user_id: 'demo-mgr-f05', title: 'Résultat — NMH 28-22 Angers HBC', sport: 'Handball', date: past(5, 20), lat: 47.2173, lng: -1.5534, city: 'Nantes', venue: 'Salle de la Trocardière', level: 'Nationale 3', event_type: 'championship', team_name: 'Seniors M', adversaire: 'Angers HBC', home_or_away: 'home', score: '28-22', source: 'user', is_archived: false, created_at: past(8) },
];

const annNantes = [
  { id: 'demo-ann-f05-01', club_id: CLUB_NTE_ID, club_name: 'Nantes Métropole Handball', author_id: 'demo-mgr-f05', author_name: 'Nathalie Lecuyer', type: 'result', title: '🤾 Victoire 28-22 face à Angers — top 3 confirmé !', message: 'Superbe seconde période avec un 10-3. Merci au public pour l\'ambiance. Prochaine étape : Cholet !', target_teams: [], scheduled_for: null, created_at: past(5, 21) },
];

// ─── CLUB F06 — Toulouse RC (Rugby, Toulouse) ─────────────────────────────────

const CLUB_TLS_ID = 'demo-club-f06';
const clubToulouse = {
  id: CLUB_TLS_ID, user_id: 'demo-mgr-f06',
  name: 'Toulouse Rugby Colombes', sport: 'Rugby', city: 'Toulouse',
  description: 'Club de rugby toulousain en Fédérale 3. 340 licenciés répartis sur 6 équipes.',
  logo_url: null, website: null, phone: '05 61 47 23 89', email: 'contact@trc-rugby.fr',
  categories: [
    { id: 'cat_tls_sen', name: 'Seniors', teams: [{ id: 'XV', name: 'XV', level: 'Fédérale 3' }] },
  ],
  status: 'verified', verified_at: '2026-02-12T09:00:00Z', verification_note: null,
  sigle: 'TRC', slogan: 'Fier du Sud-Ouest', founding_year: 1936,
  primary_color: '#dc2626', banner_url: null,
  venue: 'Stade des Ponts-Jumeaux', address: '3 Allée des Sports', postal_code: '31000',
  region: 'Occitanie', lat: 43.6165, lng: 1.4283,
  manager_name: 'Jean-Marc Puech', manager_function: 'Président', manager_phone: '06 67 89 01 23',
  member_count: 340, level: 'Fédérale 3',
  facebook: 'trcoulouserc', instagram: 'toulouse_rc', tiktok: '',
  created_at: '2026-02-12T10:00:00Z',
};

const playersToulouse = [
  { id: 'demo-p-f06-01', club_id: CLUB_TLS_ID, user_id: null, name: 'Thomas Dupont',     team_id: 'XV', position: 'Demi d\'ouverture', number: 10, photo_url: 'https://randomuser.me/api/portraits/men/88.jpg', email: null, is_active: true, created_at: '2026-02-12T10:00:00Z' },
  { id: 'demo-p-f06-02', club_id: CLUB_TLS_ID, user_id: null, name: 'Baptiste Lacombe',  team_id: 'XV', position: 'Deuxième ligne',   number: 5, photo_url: 'https://randomuser.me/api/portraits/men/89.jpg', email: null, is_active: true, created_at: '2026-02-12T10:00:00Z' },
  { id: 'demo-p-f06-03', club_id: CLUB_TLS_ID, user_id: null, name: 'Maxime Portoleau',  team_id: 'XV', position: 'Centre',           number: 12, photo_url: 'https://randomuser.me/api/portraits/men/90.jpg', email: null, is_active: true, created_at: '2026-02-12T10:00:00Z' },
];

const eventsToulouse = [
  { id: 'demo-evt-f06-01', club_id: CLUB_TLS_ID, user_id: 'demo-mgr-f06', title: 'Toulouse RC vs SC Albi', sport: 'Rugby', date: future(8, 15), lat: 43.6165, lng: 1.4283, city: 'Toulouse', venue: 'Stade des Ponts-Jumeaux', level: 'Fédérale 3', event_type: 'championship', team_name: 'XV', adversaire: 'SC Albi', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(4) },
  { id: 'demo-evt-f06-02', club_id: CLUB_TLS_ID, user_id: 'demo-mgr-f06', title: 'TRC @ US Colomiers', sport: 'Rugby', date: future(15, 14), lat: 43.6078, lng: 1.3335, city: 'Colomiers', venue: 'Stade Yves-du-Manoir', level: 'Fédérale 3', event_type: 'championship', team_name: 'XV', adversaire: 'US Colomiers B', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
  { id: 'demo-evt-f06-03', club_id: CLUB_TLS_ID, user_id: 'demo-mgr-f06', title: 'TRC 24-12 RC Auch', sport: 'Rugby', date: past(9, 15), lat: 43.6165, lng: 1.4283, city: 'Toulouse', venue: 'Stade des Ponts-Jumeaux', level: 'Fédérale 3', event_type: 'championship', team_name: 'XV', adversaire: 'RC Auch', home_or_away: 'home', score: '24-12', source: 'user', is_archived: false, created_at: past(12) },
];

const annToulouse = [
  { id: 'demo-ann-f06-01', club_id: CLUB_TLS_ID, club_name: 'Toulouse Rugby Colombes', author_id: 'demo-mgr-f06', author_name: 'Jean-Marc Puech', type: 'result', title: '🏉 24-12 contre RC Auch — belle victoire !', message: '2e victoire consécutive à domicile. L\'équipe confirme sa montée en puissance. Bravo à tous !', target_teams: [], scheduled_for: null, created_at: past(9, 18) },
];

// ─── CLUB F07 — Lille Métropole Basket (Basketball, Lille) ────────────────────

const CLUB_LIL_ID = 'demo-club-f07';
const clubLille = {
  id: CLUB_LIL_ID, user_id: 'demo-mgr-f07',
  name: 'Lille Métropole Basket', sport: 'Basketball', city: 'Lille',
  description: 'Club phare du basket nordiste, évoluant en Nationale 3 masculine. 380 licenciés.',
  logo_url: null, website: null, phone: '03 20 54 78 23', email: 'contact@lillebasket.fr',
  categories: [
    { id: 'cat_lil_senm', name: 'Seniors H', teams: [{ id: 'Seniors M', name: 'Seniors M', level: 'Nationale 3' }] },
    { id: 'cat_lil_senf', name: 'Seniors F', teams: [{ id: 'Seniors F', name: 'Seniors F', level: 'Régionale 1' }] },
    { id: 'cat_lil_u18',  name: 'Jeunes',    teams: [{ id: 'U18', name: 'U18', level: 'Interrégional' }] },
  ],
  status: 'verified', verified_at: '2026-01-30T09:00:00Z', verification_note: null,
  sigle: 'LMB', slogan: 'Le basket au Nord, c\'est sérieux', founding_year: 1957,
  primary_color: '#dc2626', banner_url: null,
  venue: 'Palais des Sports de Lille Métropole', address: '1 Bd des Cités Unies', postal_code: '59650',
  region: 'Hauts-de-France', lat: 50.6196, lng: 3.0694,
  manager_name: 'Christophe Vandermaesen', manager_function: 'Président', manager_phone: '06 78 90 12 34',
  member_count: 380, level: 'Nationale 3',
  facebook: 'lillemétropolebasket', instagram: 'lille_basket', tiktok: '',
  created_at: '2026-01-30T10:00:00Z',
};

const playersLille = [
  { id: 'demo-p-f07-01', club_id: CLUB_LIL_ID, user_id: null, name: 'Julien Vandenberghe', team_id: 'Seniors M', position: 'Meneur',       number: 5,  photo_url: 'https://randomuser.me/api/portraits/men/91.jpg', email: null, is_active: true, created_at: '2026-01-30T10:00:00Z' },
  { id: 'demo-p-f07-02', club_id: CLUB_LIL_ID, user_id: null, name: 'Mamadou Diarra',       team_id: 'Seniors M', position: 'Pivot',        number: 15, photo_url: 'https://randomuser.me/api/portraits/men/92.jpg', email: null, is_active: true, created_at: '2026-01-30T10:00:00Z' },
  { id: 'demo-p-f07-03', club_id: CLUB_LIL_ID, user_id: null, name: 'Sarah Leclercq',       team_id: 'Seniors F', position: 'Ailière',      number: 8,  photo_url: 'https://randomuser.me/api/portraits/women/43.jpg', email: null, is_active: true, created_at: '2026-01-30T10:00:00Z' },
];

const eventsLille = [
  { id: 'demo-evt-f07-01', club_id: CLUB_LIL_ID, user_id: 'demo-mgr-f07', title: 'LMB vs Dunkerque Basket', sport: 'Basketball', date: future(3, 20), lat: 50.6196, lng: 3.0694, city: 'Lille', venue: 'Palais des Sports', level: 'Nationale 3', event_type: 'championship', team_name: 'Seniors M', adversaire: 'Dunkerque Basket', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f07-02', club_id: CLUB_LIL_ID, user_id: 'demo-mgr-f07', title: 'LMB @ Roubaix BC', sport: 'Basketball', date: future(10, 19, 30), lat: 50.6942, lng: 3.1746, city: 'Roubaix', venue: 'Gymnase de Roubaix', level: 'Nationale 3', event_type: 'championship', team_name: 'Seniors M', adversaire: 'Roubaix BC', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
  { id: 'demo-evt-f07-03', club_id: CLUB_LIL_ID, user_id: 'demo-mgr-f07', title: 'LMB 78-65 Amiens BC', sport: 'Basketball', date: past(4, 20), lat: 50.6196, lng: 3.0694, city: 'Lille', venue: 'Palais des Sports', level: 'Nationale 3', event_type: 'championship', team_name: 'Seniors M', adversaire: 'Amiens BC', home_or_away: 'home', score: '78-65', source: 'user', is_archived: false, created_at: past(7) },
];

const annLille = [
  { id: 'demo-ann-f07-01', club_id: CLUB_LIL_ID, club_name: 'Lille Métropole Basket', author_id: 'demo-mgr-f07', author_name: 'Christophe Vandermaesen', type: 'result', title: '🏀 78-65 face à Amiens — belle réaction !', message: 'Après deux défaites de suite, le LMB répond présent avec une victoire convaincante. Top 4 !', target_teams: [], scheduled_for: null, created_at: past(4, 21) },
];

// ─── CLUB F08 — Strasbourg Basket Club (Basketball, Strasbourg) ───────────────

const CLUB_STR_ID = 'demo-club-f08';
const clubStrasbourg = {
  id: CLUB_STR_ID, user_id: 'demo-mgr-f08',
  name: 'Strasbourg Basket Club', sport: 'Basketball', city: 'Strasbourg',
  description: 'Le SBC en Pro B. Club professionnel strasbourgeois, 1 500 membres toutes catégories.',
  logo_url: null, website: null, phone: '03 88 23 56 78', email: 'contact@sbc-strasbourg.fr',
  categories: [
    { id: 'cat_str_pro', name: 'Pros', teams: [{ id: 'Pro B', name: 'Pro B', level: 'Pro B' }] },
    { id: 'cat_str_u21', name: 'Espoirs', teams: [{ id: 'Espoirs', name: 'Espoirs', level: 'Nationale' }] },
  ],
  status: 'verified', verified_at: '2026-01-10T09:00:00Z', verification_note: null,
  sigle: 'SBC', slogan: 'Le basket alsacien au sommet', founding_year: 1952,
  primary_color: '#0284c7', banner_url: null,
  venue: 'Rhénus Sport', address: '1 Place de la Bourse', postal_code: '67000',
  region: 'Grand Est', lat: 48.5826, lng: 7.7477,
  manager_name: 'Patrick Kessler', manager_function: 'Directeur général', manager_phone: '06 89 01 23 45',
  member_count: 1500, level: 'Pro B',
  facebook: 'strasbourgbasketclub', instagram: 'sbc_strasbourg', tiktok: 'sbc_stras',
  created_at: '2026-01-10T10:00:00Z',
};

const playersStrasbourg = [
  { id: 'demo-p-f08-01', club_id: CLUB_STR_ID, user_id: null, name: 'Axel Bouteille',    team_id: 'Pro B', position: 'Arrière',  number: 7,  photo_url: 'https://randomuser.me/api/portraits/men/93.jpg', email: null, is_active: true, created_at: '2026-01-10T10:00:00Z' },
  { id: 'demo-p-f08-02', club_id: CLUB_STR_ID, user_id: null, name: 'JR Rodriguez',      team_id: 'Pro B', position: 'Meneur',   number: 1,  photo_url: 'https://randomuser.me/api/portraits/men/94.jpg', email: null, is_active: true, created_at: '2026-01-10T10:00:00Z' },
  { id: 'demo-p-f08-03', club_id: CLUB_STR_ID, user_id: null, name: 'Marcus Howard',     team_id: 'Pro B', position: 'Ailier',   number: 3,  photo_url: 'https://randomuser.me/api/portraits/men/95.jpg', email: null, is_active: true, created_at: '2026-01-10T10:00:00Z' },
];

const eventsStrasbourg = [
  { id: 'demo-evt-f08-01', club_id: CLUB_STR_ID, user_id: 'demo-mgr-f08', title: 'SBC Strasbourg vs Saint-Chamond Basket', sport: 'Basketball', date: future(2, 20), lat: 48.5826, lng: 7.7477, city: 'Strasbourg', venue: 'Rhénus Sport', level: 'Pro B', event_type: 'championship', team_name: 'Pro B', adversaire: 'Saint-Chamond Basket', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(4) },
  { id: 'demo-evt-f08-02', club_id: CLUB_STR_ID, user_id: 'demo-mgr-f08', title: 'SBC @ Boulazac Basket Dordogne', sport: 'Basketball', date: future(9, 18), lat: 45.1859, lng: 0.7203, city: 'Périgueux', venue: 'Le Palio', level: 'Pro B', event_type: 'championship', team_name: 'Pro B', adversaire: 'Boulazac Basket', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f08-03', club_id: CLUB_STR_ID, user_id: 'demo-mgr-f08', title: 'SBC 83-71 Paris Basketball', sport: 'Basketball', date: past(6, 20), lat: 48.5826, lng: 7.7477, city: 'Strasbourg', venue: 'Rhénus Sport', level: 'Pro B', event_type: 'championship', team_name: 'Pro B', adversaire: 'Paris Basketball', home_or_away: 'home', score: '83-71', source: 'user', is_archived: false, created_at: past(9) },
];

const annStrasbourg = [
  { id: 'demo-ann-f08-01', club_id: CLUB_STR_ID, club_name: 'Strasbourg Basket Club', author_id: 'demo-mgr-f08', author_name: 'Patrick Kessler', type: 'result', title: '🏀 83-71 contre Paris Basketball — incroyable soirée au Rhénus !', message: '10 000 spectateurs, ambiance extraordinaire. Le SBC reste dans le top 4 de Pro B. On y croit !', target_teams: [], scheduled_for: null, created_at: past(6, 22) },
];

// ─── CLUB F09 — Grenoble Handball (Handball, Grenoble) ────────────────────────

const CLUB_GRE_ID = 'demo-club-f09';
const clubGrenoble = {
  id: CLUB_GRE_ID, user_id: 'demo-mgr-f09',
  name: 'Grenoble Isère Handball', sport: 'Handball', city: 'Grenoble',
  description: 'Club de handball en N2 masculine, basé à Grenoble. 290 licenciés sur les deux genres.',
  logo_url: null, website: null, phone: '04 76 22 45 67', email: 'contact@grenoble-handball.fr',
  categories: [
    { id: 'cat_gre_senm', name: 'Seniors H', teams: [{ id: 'N2 M', name: 'N2 M', level: 'Nationale 2' }] },
    { id: 'cat_gre_senf', name: 'Seniors F', teams: [{ id: 'N3 F', name: 'N3 F', level: 'Nationale 3' }] },
  ],
  status: 'verified', verified_at: '2026-02-15T09:00:00Z', verification_note: null,
  sigle: 'GIH', slogan: 'Les Alpes jouent au handball', founding_year: 1969,
  primary_color: '#059669', banner_url: null,
  venue: 'Salle Pôle Sud', address: '1 Esplanade de Bonne', postal_code: '38000',
  region: 'Auvergne-Rhône-Alpes', lat: 45.1870, lng: 5.7217,
  manager_name: 'Claire Bertrand', manager_function: 'Présidente', manager_phone: '06 90 12 34 56',
  member_count: 290, level: 'Nationale 2',
  facebook: 'grenobleihandball', instagram: 'gih_grenoble', tiktok: '',
  created_at: '2026-02-15T10:00:00Z',
};

const playersGrenoble = [
  { id: 'demo-p-f09-01', club_id: CLUB_GRE_ID, user_id: null, name: 'Adrien Blanc',       team_id: 'N2 M', position: 'Gardien',       number: 1, photo_url: 'https://randomuser.me/api/portraits/men/96.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-p-f09-02', club_id: CLUB_GRE_ID, user_id: null, name: 'Kevin Fabre',         team_id: 'N2 M', position: 'Demi-centre',    number: 5, photo_url: 'https://randomuser.me/api/portraits/men/97.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-p-f09-03', club_id: CLUB_GRE_ID, user_id: null, name: 'Lucie Paturel',       team_id: 'N3 F', position: 'Arrière gauche', number: 10, photo_url: 'https://randomuser.me/api/portraits/women/44.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
];

const eventsGrenoble = [
  { id: 'demo-evt-f09-01', club_id: CLUB_GRE_ID, user_id: 'demo-mgr-f09', title: 'GIH vs Valence Handball', sport: 'Handball', date: future(4, 19), lat: 45.1870, lng: 5.7217, city: 'Grenoble', venue: 'Salle Pôle Sud', level: 'Nationale 2', event_type: 'championship', team_name: 'N2 M', adversaire: 'Valence Handball', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f09-02', club_id: CLUB_GRE_ID, user_id: 'demo-mgr-f09', title: 'GIH @ Chambéry Savoie HB', sport: 'Handball', date: future(11, 18, 30), lat: 45.5682, lng: 5.9226, city: 'Chambéry', venue: 'Stade des Alpes', level: 'Nationale 2', event_type: 'championship', team_name: 'N2 M', adversaire: 'Chambéry Savoie HB', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
  { id: 'demo-evt-f09-03', club_id: CLUB_GRE_ID, user_id: 'demo-mgr-f09', title: 'GIH 32-28 Lyon Handball', sport: 'Handball', date: past(7, 19), lat: 45.1870, lng: 5.7217, city: 'Grenoble', venue: 'Salle Pôle Sud', level: 'Nationale 2', event_type: 'championship', team_name: 'N2 M', adversaire: 'Lyon Handball', home_or_away: 'home', score: '32-28', source: 'user', is_archived: false, created_at: past(10) },
];

const annGrenoble = [
  { id: 'demo-ann-f09-01', club_id: CLUB_GRE_ID, club_name: 'Grenoble Isère Handball', author_id: 'demo-mgr-f09', author_name: 'Claire Bertrand', type: 'result', title: '🤾 32-28 face à Lyon Handball — une belle bataille !', message: 'Match très accroché jusqu\'à la 55e minute. Notre solidarité défensive a fait la différence. Bravo équipe !', target_teams: [], scheduled_for: null, created_at: past(7, 20) },
];

// ─── CLUB F10 — Caen Normandie FC (Football, Caen) ────────────────────────────

const CLUB_CAE_ID = 'demo-club-f10';
const clubCaen = {
  id: CLUB_CAE_ID, user_id: 'demo-mgr-f10',
  name: 'Caen Normandie FC', sport: 'Football', city: 'Caen',
  description: 'Club normand évoluant en DH Normandie, le plus haut niveau amateur de la région. 260 licenciés.',
  logo_url: null, website: null, phone: '02 31 56 78 23', email: 'contact@caennfc.fr',
  categories: [
    { id: 'cat_cae_sen', name: 'Seniors', teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'DH Normandie' }] },
  ],
  status: 'verified', verified_at: '2026-02-20T09:00:00Z', verification_note: null,
  sigle: 'CNFC', slogan: 'La Normandie foot', founding_year: 1944,
  primary_color: '#0ea5e9', banner_url: null,
  venue: 'Stade de la Prairie', address: '14 Avenue Albert-Sorel', postal_code: '14000',
  region: 'Normandie', lat: 49.1828, lng: -0.3626,
  manager_name: 'Alain Hébert', manager_function: 'Président', manager_phone: '06 01 23 45 67',
  member_count: 260, level: 'DH Normandie',
  facebook: 'caennormandiefc', instagram: 'cnfc_caen', tiktok: '',
  created_at: '2026-02-20T10:00:00Z',
};

const playersCaen = [
  { id: 'demo-p-f10-01', club_id: CLUB_CAE_ID, user_id: null, name: 'Valentin Duprey',   team_id: 'Équipe 1', position: 'Gardien',  number: 1, photo_url: 'https://randomuser.me/api/portraits/men/98.jpg', email: null, is_active: true, created_at: '2026-02-20T10:00:00Z' },
  { id: 'demo-p-f10-02', club_id: CLUB_CAE_ID, user_id: null, name: 'Thomas Lecoq',      team_id: 'Équipe 1', position: 'Milieu',   number: 6, photo_url: 'https://randomuser.me/api/portraits/men/99.jpg', email: null, is_active: true, created_at: '2026-02-20T10:00:00Z' },
  { id: 'demo-p-f10-03', club_id: CLUB_CAE_ID, user_id: null, name: 'Hugo Fontaine',     team_id: 'Équipe 1', position: 'Attaquant', number: 9, photo_url: 'https://randomuser.me/api/portraits/men/10.jpg', email: null, is_active: true, created_at: '2026-02-20T10:00:00Z' },
];

const eventsCaen = [
  { id: 'demo-evt-f10-01', club_id: CLUB_CAE_ID, user_id: 'demo-mgr-f10', title: 'Caen NFC vs US Granville', sport: 'Football', date: future(6, 15), lat: 49.1828, lng: -0.3626, city: 'Caen', venue: 'Stade de la Prairie', level: 'DH Normandie', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'US Granville', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f10-02', club_id: CLUB_CAE_ID, user_id: 'demo-mgr-f10', title: 'Caen NFC @ FC Rouen', sport: 'Football', date: future(13, 14), lat: 49.4431, lng: 1.0993, city: 'Rouen', venue: 'Stade Robert-Diochon', level: 'DH Normandie', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'FC Rouen', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
  { id: 'demo-evt-f10-03', club_id: CLUB_CAE_ID, user_id: 'demo-mgr-f10', title: 'Caen NFC 1-0 AS Cherbourg', sport: 'Football', date: past(5, 15), lat: 49.1828, lng: -0.3626, city: 'Caen', venue: 'Stade de la Prairie', level: 'DH Normandie', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'AS Cherbourg', home_or_away: 'home', score: '1-0', source: 'user', is_archived: false, created_at: past(8) },
];

const annCaen = [
  { id: 'demo-ann-f10-01', club_id: CLUB_CAE_ID, club_name: 'Caen Normandie FC', author_id: 'demo-mgr-f10', author_name: 'Alain Hébert', type: 'result', title: '✅ 1-0 contre Cherbourg — victoire précieuse !', message: 'But de Hugo Fontaine à la 67e. On reste en course pour le titre. Prochain match face à Granville !', target_teams: [], scheduled_for: null, created_at: past(5, 17) },
];

// ─── CLUB F11 — Metz Football Club (Football, Metz) ──────────────────────────

const CLUB_MTZ_ID = 'demo-club-f11';
const clubMetz = {
  id: CLUB_MTZ_ID, user_id: 'demo-mgr-f11',
  name: 'FC Moselle Est', sport: 'Football', city: 'Metz',
  description: 'Club messin évoluant en Régional 1 Grand Est. 300 membres, basé au stade municipal.',
  logo_url: null, website: null, phone: '03 87 45 23 78', email: 'contact@fcmoselle.fr',
  categories: [
    { id: 'cat_mtz_sen', name: 'Seniors', teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'Régional 1' }] },
    { id: 'cat_mtz_u17', name: 'Jeunes', teams: [{ id: 'U17', name: 'U17', level: 'Régional' }] },
  ],
  status: 'verified', verified_at: '2026-02-18T09:00:00Z', verification_note: null,
  sigle: 'FCM', slogan: 'Les Mosellans à l\'attaque', founding_year: 1948,
  primary_color: '#dc2626', banner_url: null,
  venue: 'Stade Saint-Symphorien Annexe', address: '1 Rue Claude Bernard', postal_code: '57000',
  region: 'Grand Est', lat: 49.1201, lng: 6.1724,
  manager_name: 'François Müller', manager_function: 'Président', manager_phone: '06 12 34 56 78',
  member_count: 300, level: 'Régional 1',
  facebook: 'fcmoselle', instagram: 'fc_moselle_est', tiktok: '',
  created_at: '2026-02-18T10:00:00Z',
};

const playersMetz = [
  { id: 'demo-p-f11-01', club_id: CLUB_MTZ_ID, user_id: null, name: 'Alexis Wagner',     team_id: 'Équipe 1', position: 'Gardien',  number: 1, photo_url: 'https://randomuser.me/api/portraits/men/20.jpg', email: null, is_active: true, created_at: '2026-02-18T10:00:00Z' },
  { id: 'demo-p-f11-02', club_id: CLUB_MTZ_ID, user_id: null, name: 'Baptiste Schmitt',  team_id: 'Équipe 1', position: 'Milieu',   number: 7, photo_url: 'https://randomuser.me/api/portraits/men/21.jpg', email: null, is_active: true, created_at: '2026-02-18T10:00:00Z' },
];

const eventsMetz = [
  { id: 'demo-evt-f11-01', club_id: CLUB_MTZ_ID, user_id: 'demo-mgr-f11', title: 'FC Moselle Est vs US Thionville', sport: 'Football', date: future(7, 15), lat: 49.1201, lng: 6.1724, city: 'Metz', venue: 'Stade Saint-Symphorien Annexe', level: 'Régional 1', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'US Thionville', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f11-02', club_id: CLUB_MTZ_ID, user_id: 'demo-mgr-f11', title: 'FC Moselle @ AS Nancy-Lorraine B', sport: 'Football', date: future(14, 14, 30), lat: 48.6839, lng: 6.1836, city: 'Nancy', venue: 'Terrain de Nancy B', level: 'Régional 1', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'AS Nancy B', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(1) },
];

const annMetz = [
  { id: 'demo-ann-f11-01', club_id: CLUB_MTZ_ID, club_name: 'FC Moselle Est', author_id: 'demo-mgr-f11', author_name: 'François Müller', type: 'info', title: '📢 Journée portes ouvertes — samedi 28 juin', message: 'Venez découvrir le club ! Essai gratuit pour les 14-25 ans. Inscription en ligne avant jeudi.', target_teams: [], scheduled_for: null, created_at: past(2, 10) },
];

// ─── CLUB F12 — Nice Côte d'Azur FC (Football, Nice) ─────────────────────────

const CLUB_NCE_ID = 'demo-club-f12';
const clubNice = {
  id: CLUB_NCE_ID, user_id: 'demo-mgr-f12',
  name: 'Nice Côte d\'Azur FC', sport: 'Football', city: 'Nice',
  description: 'Club niçois évoluant en DH PACA. Stade Arenas, 180 membres.',
  logo_url: null, website: null, phone: '04 93 26 45 78', email: 'contact@nca-fc.fr',
  categories: [
    { id: 'cat_nce_sen', name: 'Seniors', teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'DH PACA' }] },
    { id: 'cat_nce_fem', name: 'Féminines', teams: [{ id: 'Féminines', name: 'Féminines', level: 'R3 F' }] },
  ],
  status: 'verified', verified_at: '2026-02-22T09:00:00Z', verification_note: null,
  sigle: 'NCAFC', slogan: 'Foot et soleil', founding_year: 1965,
  primary_color: '#dc2626', banner_url: null,
  venue: 'Stade des Arenas', address: '2 Rue Aston Martin', postal_code: '06200',
  region: "Provence-Alpes-Côte d'Azur", lat: 43.6649, lng: 7.2122,
  manager_name: 'Marco Rossi', manager_function: 'Président', manager_phone: '06 23 45 67 89',
  member_count: 180, level: 'DH PACA',
  facebook: 'nicecotedazurfc', instagram: 'nca_fc_nice', tiktok: '',
  created_at: '2026-02-22T10:00:00Z',
};

const playersNice = [
  { id: 'demo-p-f12-01', club_id: CLUB_NCE_ID, user_id: null, name: 'Alessandro Bruno', team_id: 'Équipe 1', position: 'Gardien',  number: 1, photo_url: 'https://randomuser.me/api/portraits/men/22.jpg', email: null, is_active: true, created_at: '2026-02-22T10:00:00Z' },
  { id: 'demo-p-f12-02', club_id: CLUB_NCE_ID, user_id: null, name: 'Damien Giroux',    team_id: 'Équipe 1', position: 'Attaquant', number: 9, photo_url: 'https://randomuser.me/api/portraits/men/23.jpg', email: null, is_active: true, created_at: '2026-02-22T10:00:00Z' },
];

const eventsNice = [
  { id: 'demo-evt-f12-01', club_id: CLUB_NCE_ID, user_id: 'demo-mgr-f12', title: 'Nice CdA FC vs SC Grasse', sport: 'Football', date: future(5, 16), lat: 43.6649, lng: 7.2122, city: 'Nice', venue: 'Stade des Arenas', level: 'DH PACA', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'SC Grasse', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(4) },
  { id: 'demo-evt-f12-02', club_id: CLUB_NCE_ID, user_id: 'demo-mgr-f12', title: 'Nice CdA @ AC Antibes', sport: 'Football', date: future(12, 15), lat: 43.5807, lng: 7.1247, city: 'Antibes', venue: 'Stade de la Bourine', level: 'DH PACA', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'AC Antibes', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
];

const annNice = [
  { id: 'demo-ann-f12-01', club_id: CLUB_NCE_ID, club_name: 'Nice Côte d\'Azur FC', author_id: 'demo-mgr-f12', author_name: 'Marco Rossi', type: 'info', title: '☀️ Stage de pré-saison — 7-11 juillet à Vence', message: 'Stage optionnel pour l\'équipe 1. Hébergement au centre sportif, 3 séances/jour. Infos par mail.', target_teams: ['Équipe 1'], scheduled_for: null, created_at: past(3, 12) },
];

// ─── CLUB F13 — Dijon FC Bourguignon (Football, Dijon) ────────────────────────

const CLUB_DIJ_ID = 'demo-club-f13';
const clubDijon = {
  id: CLUB_DIJ_ID, user_id: 'demo-mgr-f13',
  name: 'FC Bourgogne Dijon', sport: 'Football', city: 'Dijon',
  description: 'Club dijonnais évoluant en Régional 2 BFC. 190 licenciés, 5 équipes senior.',
  logo_url: null, website: null, phone: '03 80 23 45 67', email: 'contact@fcbourgogne.fr',
  categories: [
    { id: 'cat_dij_sen', name: 'Seniors', teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'Régional 2' }] },
  ],
  status: 'verified', verified_at: '2026-03-01T09:00:00Z', verification_note: null,
  sigle: 'FCBD', slogan: 'Football et moutarde', founding_year: 1956,
  primary_color: '#d97706', banner_url: null,
  venue: 'Stade Gaston-Gérard Annexe', address: '1 Bd de Strasbourg', postal_code: '21000',
  region: 'Bourgogne-Franche-Comté', lat: 47.3219, lng: 5.0413,
  manager_name: 'Philippe Bourgeois', manager_function: 'Président', manager_phone: '06 34 56 78 90',
  member_count: 190, level: 'Régional 2',
  facebook: 'fcbourgognedijon', instagram: 'fc_bourgogne_dijon', tiktok: '',
  created_at: '2026-03-01T10:00:00Z',
};

const playersDijon = [
  { id: 'demo-p-f13-01', club_id: CLUB_DIJ_ID, user_id: null, name: 'Quentin Moreau',    team_id: 'Équipe 1', position: 'Milieu',   number: 8, photo_url: 'https://randomuser.me/api/portraits/men/24.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-p-f13-02', club_id: CLUB_DIJ_ID, user_id: null, name: 'Romain Picard',     team_id: 'Équipe 1', position: 'Attaquant', number: 11, photo_url: 'https://randomuser.me/api/portraits/men/25.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
];

const eventsDijon = [
  { id: 'demo-evt-f13-01', club_id: CLUB_DIJ_ID, user_id: 'demo-mgr-f13', title: 'FC Bourgogne vs SC Chalon', sport: 'Football', date: future(8, 15), lat: 47.3219, lng: 5.0413, city: 'Dijon', venue: 'Stade Gaston-Gérard Annexe', level: 'Régional 2', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'SC Chalon', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(4) },
  { id: 'demo-evt-f13-02', club_id: CLUB_DIJ_ID, user_id: 'demo-mgr-f13', title: 'FC Bourgogne @ AC Beaune', sport: 'Football', date: future(15, 14), lat: 47.0238, lng: 4.8397, city: 'Beaune', venue: 'Terrain de Beaune', level: 'Régional 2', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'AC Beaune', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
];

const annDijon = [
  { id: 'demo-ann-f13-01', club_id: CLUB_DIJ_ID, club_name: 'FC Bourgogne Dijon', author_id: 'demo-mgr-f13', author_name: 'Philippe Bourgeois', type: 'event', title: '🍷 Fête du club et kermesse — 5 juillet', message: 'Journée conviviale avec matchs amicaux, tirage au sort et repas bourguignon. Toute la famille est la bienvenue !', target_teams: [], scheduled_for: null, created_at: past(5, 11) },
];

// ─── CLUB F14 — Montpellier Rugby Union (Rugby, Montpellier) ──────────────────

const CLUB_MPL_ID = 'demo-club-f14';
const clubMontpellier = {
  id: CLUB_MPL_ID, user_id: 'demo-mgr-f14',
  name: 'Montpellier Rugby Union', sport: 'Rugby', city: 'Montpellier',
  description: 'Club de rugby du Languedoc, Fédérale 3. 310 licenciés, fort vivier de jeunes.',
  logo_url: null, website: null, phone: '04 67 23 45 89', email: 'contact@mru-rugby.fr',
  categories: [
    { id: 'cat_mpl_sen', name: 'Seniors', teams: [{ id: 'XV', name: 'XV', level: 'Fédérale 3' }] },
    { id: 'cat_mpl_u18', name: 'Jeunes', teams: [{ id: 'U18', name: 'U18', level: 'Régional' }] },
  ],
  status: 'verified', verified_at: '2026-02-28T09:00:00Z', verification_note: null,
  sigle: 'MRU', slogan: 'Le rugby du soleil', founding_year: 1923,
  primary_color: '#16a34a', banner_url: null,
  venue: 'Stade Yves-du-Manoir Annexe', address: '4 Rue des Sports', postal_code: '34000',
  region: 'Occitanie', lat: 43.6104, lng: 3.8743,
  manager_name: 'Sylvain Fabre', manager_function: 'Président', manager_phone: '06 45 67 89 01',
  member_count: 310, level: 'Fédérale 3',
  facebook: 'montpellierrugbyunion', instagram: 'mru_montpellier', tiktok: '',
  created_at: '2026-02-28T10:00:00Z',
};

const playersMontpellier = [
  { id: 'demo-p-f14-01', club_id: CLUB_MPL_ID, user_id: null, name: 'Clément Vidal',     team_id: 'XV', position: 'Pilier droit', number: 3, photo_url: 'https://randomuser.me/api/portraits/men/26.jpg', email: null, is_active: true, created_at: '2026-02-28T10:00:00Z' },
  { id: 'demo-p-f14-02', club_id: CLUB_MPL_ID, user_id: null, name: 'Romain Barthe',     team_id: 'XV', position: 'Flanker',      number: 7, photo_url: 'https://randomuser.me/api/portraits/men/27.jpg', email: null, is_active: true, created_at: '2026-02-28T10:00:00Z' },
];

const eventsMontpellier = [
  { id: 'demo-evt-f14-01', club_id: CLUB_MPL_ID, user_id: 'demo-mgr-f14', title: 'MRU vs RC Sète', sport: 'Rugby', date: future(9, 15), lat: 43.6104, lng: 3.8743, city: 'Montpellier', venue: 'Stade Yves-du-Manoir Annexe', level: 'Fédérale 3', event_type: 'championship', team_name: 'XV', adversaire: 'RC Sète', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(4) },
  { id: 'demo-evt-f14-02', club_id: CLUB_MPL_ID, user_id: 'demo-mgr-f14', title: 'MRU @ SC Nîmes Rugby', sport: 'Rugby', date: future(16, 14, 30), lat: 43.8342, lng: 4.3601, city: 'Nîmes', venue: 'Stade de Costières Annexe', level: 'Fédérale 3', event_type: 'championship', team_name: 'XV', adversaire: 'SC Nîmes Rugby', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(2) },
  { id: 'demo-evt-f14-03', club_id: CLUB_MPL_ID, user_id: 'demo-mgr-f14', title: 'MRU 19-17 RC Béziers B', sport: 'Rugby', date: past(10, 15), lat: 43.6104, lng: 3.8743, city: 'Montpellier', venue: 'Stade Yves-du-Manoir Annexe', level: 'Fédérale 3', event_type: 'championship', team_name: 'XV', adversaire: 'RC Béziers B', home_or_away: 'home', score: '19-17', source: 'user', is_archived: false, created_at: past(13) },
];

const annMontpellier = [
  { id: 'demo-ann-f14-01', club_id: CLUB_MPL_ID, club_name: 'Montpellier Rugby Union', author_id: 'demo-mgr-f14', author_name: 'Sylvain Fabre', type: 'result', title: '🏉 19-17 face à Béziers — victoire au couteau !', message: 'Essai de pénalité à la 78e qui nous donne la victoire. Incroyable résilience de l\'équipe.', target_teams: [], scheduled_for: null, created_at: past(10, 17) },
];

// ─── CLUB F15 — Rouen Athlétique Football (Football, Rouen) ──────────────────

const CLUB_RON_ID = 'demo-club-f15';
const clubRouen = {
  id: CLUB_RON_ID, user_id: 'demo-mgr-f15',
  name: 'Rouen Athlétique Football', sport: 'Football', city: 'Rouen',
  description: 'Club de football normand en Régional 1. 230 licenciés, 4 équipes masculines.',
  logo_url: null, website: null, phone: '02 35 45 67 23', email: 'contact@raf-rouen.fr',
  categories: [
    { id: 'cat_ron_sen', name: 'Seniors', teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'Régional 1' }] },
  ],
  status: 'verified', verified_at: '2026-03-05T09:00:00Z', verification_note: null,
  sigle: 'RAF', slogan: 'La Normandie en or', founding_year: 1950,
  primary_color: '#b45309', banner_url: null,
  venue: 'Stade Robert-Diochon', address: '2 Rue du Stade', postal_code: '76300',
  region: 'Normandie', lat: 49.4431, lng: 1.0993,
  manager_name: 'David Lecomte', manager_function: 'Président', manager_phone: '06 56 78 90 12',
  member_count: 230, level: 'Régional 1',
  facebook: 'rouenaf', instagram: 'raf_rouen', tiktok: '',
  created_at: '2026-03-05T10:00:00Z',
};

const playersRouen = [
  { id: 'demo-p-f15-01', club_id: CLUB_RON_ID, user_id: null, name: 'Arnaud Letendre',   team_id: 'Équipe 1', position: 'Gardien',  number: 1, photo_url: 'https://randomuser.me/api/portraits/men/28.jpg', email: null, is_active: true, created_at: '2026-03-05T10:00:00Z' },
  { id: 'demo-p-f15-02', club_id: CLUB_RON_ID, user_id: null, name: 'Théo Bonnet',       team_id: 'Équipe 1', position: 'Attaquant', number: 9, photo_url: 'https://randomuser.me/api/portraits/men/29.jpg', email: null, is_active: true, created_at: '2026-03-05T10:00:00Z' },
];

const eventsRouen = [
  { id: 'demo-evt-f15-01', club_id: CLUB_RON_ID, user_id: 'demo-mgr-f15', title: 'RAF Rouen vs AS Saint-Étienne-du-Rouvray', sport: 'Football', date: future(4, 15), lat: 49.4431, lng: 1.0993, city: 'Rouen', venue: 'Stade Robert-Diochon', level: 'Régional 1', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'AS Saint-Étienne-du-Rouvray', home_or_away: 'home', score: null, source: 'user', is_archived: false, created_at: past(3) },
  { id: 'demo-evt-f15-02', club_id: CLUB_RON_ID, user_id: 'demo-mgr-f15', title: 'RAF @ US Gonfreville', sport: 'Football', date: future(11, 14), lat: 49.5003, lng: 0.2382, city: 'Le Havre', venue: 'Stade Gonfreville', level: 'Régional 1', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'US Gonfreville', home_or_away: 'away', score: null, source: 'user', is_archived: false, created_at: past(1) },
  { id: 'demo-evt-f15-03', club_id: CLUB_RON_ID, user_id: 'demo-mgr-f15', title: 'RAF 3-1 SC Sotteville', sport: 'Football', date: past(6, 15), lat: 49.4431, lng: 1.0993, city: 'Rouen', venue: 'Stade Robert-Diochon', level: 'Régional 1', event_type: 'championship', team_name: 'Équipe 1', adversaire: 'SC Sotteville', home_or_away: 'home', score: '3-1', source: 'user', is_archived: false, created_at: past(9) },
];

const annRouen = [
  { id: 'demo-ann-f15-01', club_id: CLUB_RON_ID, club_name: 'Rouen Athlétique Football', author_id: 'demo-mgr-f15', author_name: 'David Lecomte', type: 'result', title: '⚽ 3-1 contre Sotteville — hat-trick de Théo Bonnet !', message: 'Superbe prestation offensive. Théo en feu ce samedi. 2e position au classement maintenue !', target_teams: [], scheduled_for: null, created_at: past(6, 18) },
];

// ─── Exports groupés ──────────────────────────────────────────────────────────

export const franceClubs = [
  clubParis18, clubLyon, clubMarseille, clubBordeaux, clubNantes,
  clubToulouse, clubLille, clubStrasbourg, clubGrenoble, clubCaen,
  clubMetz, clubNice, clubDijon, clubMontpellier, clubRouen,
];

export const francePlayers = [
  ...playersParis18, ...playersLyon, ...playersMarseille, ...playersBordeaux, ...playersNantes,
  ...playersToulouse, ...playersLille, ...playersStrasbourg, ...playersGrenoble, ...playersCaen,
  ...playersMetz, ...playersNice, ...playersDijon, ...playersMontpellier, ...playersRouen,
];

export const franceEvents = [
  ...eventsParis18, ...eventsLyon, ...eventsMarseille, ...eventsBordeaux, ...eventsNantes,
  ...eventsToulouse, ...eventsLille, ...eventsStrasbourg, ...eventsGrenoble, ...eventsCaen,
  ...eventsMetz, ...eventsNice, ...eventsDijon, ...eventsMontpellier, ...eventsRouen,
];

export const franceAnnouncements = [
  ...annParis18, ...annLyon, ...annMarseille, ...annBordeaux, ...annNantes,
  ...annToulouse, ...annLille, ...annStrasbourg, ...annGrenoble, ...annCaen,
  ...annMetz, ...annNice, ...annDijon, ...annMontpellier, ...annRouen,
];
