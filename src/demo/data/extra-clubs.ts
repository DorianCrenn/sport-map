// 4 clubs bretons supplémentaires — Rugby, Basket, Handball, Volleyball

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

// ─── CLUB 2 — Stade Rennais Rugby (Rugby, Rennes) ─────────────────────────────

export const CLUB_RUGBY_ID = 'demo-club-002';

export const clubRugby = {
  id: CLUB_RUGBY_ID,
  user_id: 'demo-mgr-002',
  name: 'Stade Rennais Rugby',
  sport: 'Rugby',
  city: 'Rennes',
  description: 'Club de rugby fondé en 1952, évoluant en Fédérale 3. Une histoire de passion et de collectif.',
  logo_url: null,
  website: null,
  phone: '02 99 45 67 89',
  email: 'contact@stade-rennais-rugby.fr',
  categories: [
    { id: 'cat_r_seniors', name: 'Seniors', teams: [{ id: 'XV', name: 'XV', level: 'Fédérale 3' }, { id: 'B XV', name: 'B XV', level: 'Régional' }] },
    { id: 'cat_r_jeunes',  name: 'Jeunes',  teams: [{ id: 'U18', name: 'U18', level: 'Régional' }, { id: 'U16', name: 'U16', level: 'Départemental' }] },
  ],
  status: 'verified',
  verified_at: '2026-02-01T09:00:00Z',
  verification_note: null,
  sigle: 'SRR',
  slogan: "Le rugby, une école de vie",
  founding_year: 1952,
  primary_color: '#b91c1c',
  banner_url: null,
  venue: 'Stade de la Route de Lorient',
  address: '15 Route de Lorient',
  postal_code: '35000',
  region: 'Bretagne',
  lat: 48.1173,
  lng: -1.6778,
  manager_name: 'Éric Bourdin',
  manager_function: 'Président',
  manager_phone: '06 23 45 67 89',
  member_count: 185,
  level: 'Fédérale 3',
  facebook: 'stade.rennais.rugby',
  instagram: 'stade_rennais_rugby',
  tiktok: '',
  created_at: '2026-02-01T10:00:00Z',
};

export const playersRugby = [
  { id: 'demo-player-r01', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Alexis Morin',    team_id: 'XV',   position: 'Pilier gauche',      number: 1,  photo_url: 'https://randomuser.me/api/portraits/men/40.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r02', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Kévin Guyot',     team_id: 'XV',   position: 'Talonneur',          number: 2,  photo_url: 'https://randomuser.me/api/portraits/men/41.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r03', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Pierre Labbé',    team_id: 'XV',   position: 'Pilier droit',       number: 3,  photo_url: 'https://randomuser.me/api/portraits/men/42.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r04', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Tom Chauvet',     team_id: 'XV',   position: '2ème ligne',         number: 4,  photo_url: 'https://randomuser.me/api/portraits/men/43.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r05', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Romain Collet',   team_id: 'XV',   position: '2ème ligne',         number: 5,  photo_url: 'https://randomuser.me/api/portraits/men/44.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r06', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Damien Ferry',    team_id: 'XV',   position: 'Flanker',            number: 6,  photo_url: 'https://randomuser.me/api/portraits/men/45.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r07', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Florian Masson',  team_id: 'XV',   position: 'Flanker',            number: 7,  photo_url: 'https://randomuser.me/api/portraits/men/46.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r08', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Hugo Simonnet',   team_id: 'XV',   position: 'Numéro 8',           number: 8,  photo_url: 'https://randomuser.me/api/portraits/men/47.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r09', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Baptiste Renard', team_id: 'XV',   position: 'Demi de mêlée',      number: 9,  photo_url: 'https://randomuser.me/api/portraits/men/48.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r10', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Théo Aubert',     team_id: 'XV',   position: "Demi d'ouverture",   number: 10, photo_url: 'https://randomuser.me/api/portraits/men/49.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r11', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Julien Perrier',  team_id: 'XV',   position: 'Ailier gauche',      number: 11, photo_url: 'https://randomuser.me/api/portraits/men/50.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r12', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Maxime Duprat',   team_id: 'XV',   position: 'Centre',             number: 12, photo_url: 'https://randomuser.me/api/portraits/men/51.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r13', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Antoine Sablé',   team_id: 'XV',   position: 'Centre',             number: 13, photo_url: 'https://randomuser.me/api/portraits/men/52.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r14', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Victor Cousin',   team_id: 'XV',   position: 'Ailier droit',       number: 14, photo_url: 'https://randomuser.me/api/portraits/men/53.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r15', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Loïc Chartier',   team_id: 'XV',   position: 'Arrière',            number: 15, photo_url: 'https://randomuser.me/api/portraits/men/54.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r16', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Samuel Garnier',  team_id: 'B XV', position: 'Pilier',             number: 1,  photo_url: 'https://randomuser.me/api/portraits/men/55.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r17', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Matthieu Noël',   team_id: 'B XV', position: 'Talonneur',          number: 2,  photo_url: 'https://randomuser.me/api/portraits/men/56.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r18', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Guillaume Barré', team_id: 'B XV', position: '2ème ligne',         number: 4,  photo_url: 'https://randomuser.me/api/portraits/men/57.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r19', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Clément Picard',  team_id: 'B XV', position: 'Flanker',            number: 7,  photo_url: 'https://randomuser.me/api/portraits/men/58.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
  { id: 'demo-player-r20', club_id: CLUB_RUGBY_ID, user_id: null, name: 'Rémi Voisin',     team_id: 'B XV', position: 'Demi de mêlée',      number: 9,  photo_url: 'https://randomuser.me/api/portraits/men/59.jpg', email: null, is_active: true, created_at: '2026-02-01T10:00:00Z' },
];

export const eventsRugby = [
  {
    id: 'demo-event-r01', title: 'Stade Rennais Rugby vs RC Laval',
    sport: 'Rugby', date: future(3, 15),
    lat: 48.1173, lng: -1.6778, city: 'Rennes', venue: 'Stade de la Route de Lorient',
    event_type: 'championship', team_name: 'XV', category: 'Seniors',
    home_or_away: 'home', adversaire: 'RC Laval', level: 'Fédérale 3',
    club_id: CLUB_RUGBY_ID, user_id: 'demo-mgr-002', source: 'user',
    is_archived: false, score: null, created_at: past(20),
  },
  {
    id: 'demo-event-r02', title: 'Stade Rennais Rugby @ US Saint-Malo',
    sport: 'Rugby', date: future(10, 14, 30),
    lat: 48.6490, lng: -2.0148, city: 'Saint-Malo', venue: 'Stade Guy Ollivier',
    event_type: 'championship', team_name: 'XV', category: 'Seniors',
    home_or_away: 'away', adversaire: 'US Saint-Malo', level: 'Fédérale 3',
    club_id: CLUB_RUGBY_ID, user_id: 'demo-mgr-002', source: 'user',
    is_archived: false, score: null, created_at: past(18),
  },
  {
    id: 'demo-event-r03', title: 'Tournoi U18 Printemps — Rennes',
    sport: 'Rugby', date: future(5, 9),
    lat: 48.1173, lng: -1.6778, city: 'Rennes', venue: 'Stade de la Route de Lorient',
    event_type: 'tournament', team_name: 'U18', category: 'Jeunes',
    tournament_name: 'Tournoi Printemps U18', tournament_type: 'groups_then_knockout',
    tournament_categories: 'U18', num_teams: 6, organizer: 'Stade Rennais Rugby',
    club_id: CLUB_RUGBY_ID, user_id: 'demo-mgr-002', source: 'user',
    is_archived: false, score: null, created_at: past(15),
  },
  {
    id: 'demo-event-r04', title: 'Stade Rennais Rugby vs RC Vitré (amical)',
    sport: 'Rugby', date: future(17, 10),
    lat: 48.1173, lng: -1.6778, city: 'Rennes', venue: 'Stade de la Route de Lorient',
    event_type: 'friendly', team_name: 'XV', category: 'Seniors',
    home_or_away: 'home', adversaire: 'RC Vitré',
    club_id: CLUB_RUGBY_ID, user_id: 'demo-mgr-002', source: 'user',
    is_archived: false, score: null, created_at: past(10),
  },
  {
    id: 'demo-event-r05', title: 'Stade Rennais Rugby vs RC Fougères',
    sport: 'Rugby', date: past(5, 15),
    lat: 48.1173, lng: -1.6778, city: 'Rennes', venue: 'Stade de la Route de Lorient',
    event_type: 'championship', team_name: 'XV', category: 'Seniors',
    home_or_away: 'home', adversaire: 'RC Fougères', level: 'Fédérale 3',
    club_id: CLUB_RUGBY_ID, user_id: 'demo-mgr-002', source: 'user',
    is_archived: false, score: '22-15', created_at: past(35),
  },
  {
    id: 'demo-event-r06', title: 'Coupe Bretagne Rugby — SRR @ Brest XV',
    sport: 'Rugby', date: future(22, 15),
    lat: 48.3904, lng: -4.4861, city: 'Brest', venue: 'Stade Francis-Le Blé',
    event_type: 'cup', team_name: 'XV', category: 'Seniors',
    home_or_away: 'away', adversaire: 'Brest XV',
    club_id: CLUB_RUGBY_ID, user_id: 'demo-mgr-002', source: 'user',
    is_archived: false, score: null, created_at: past(8),
  },
];

export const announcementsRugby = [
  {
    id: 'demo-ann-r01', club_id: CLUB_RUGBY_ID, club_name: 'Stade Rennais Rugby',
    author_id: 'demo-mgr-002', author_name: 'Éric Bourdin',
    type: 'result',
    title: '🏉 Victoire 22-15 face à RC Fougères !',
    message: "Superbe match de nos Seniors ! Victoire méritée au terme d'un match accroché. Prochain match à domicile dans 3 jours !",
    target_teams: [], scheduled_for: null, created_at: past(5),
  },
  {
    id: 'demo-ann-r02', club_id: CLUB_RUGBY_ID, club_name: 'Stade Rennais Rugby',
    author_id: 'demo-mgr-002', author_name: 'Éric Bourdin',
    type: 'info',
    title: '📋 Convocations U18 — Tournoi Printemps',
    message: "Les convocations pour le tournoi U18 sont disponibles. Rendez-vous samedi à 8h30 pour l'échauffement.",
    target_teams: ['U18'], scheduled_for: null, created_at: past(3),
  },
  {
    id: 'demo-ann-r03', club_id: CLUB_RUGBY_ID, club_name: 'Stade Rennais Rugby',
    author_id: 'demo-mgr-002', author_name: 'Éric Bourdin',
    type: 'event',
    title: '🎉 Repas de fin de saison — 28 juin',
    message: 'Le repas annuel de fin de saison aura lieu le 28 juin à 19h au Foyer du club. Inscription avant le 20 juin.',
    target_teams: [], scheduled_for: null, created_at: past(7),
  },
];


// ─── CLUB 3 — Lorient Atlantique Basket (Basketball, Lorient) ─────────────────

export const CLUB_BASKET_ID = 'demo-club-003';

export const clubBasket = {
  id: CLUB_BASKET_ID,
  user_id: 'demo-mgr-003',
  name: 'Lorient Atlantique Basket',
  sport: 'Basketball',
  city: 'Lorient',
  description: 'Club de basketball du pays de Lorient, des U9 aux Seniors. Rejoignez la famille LAB !',
  logo_url: null,
  website: null,
  phone: '02 97 21 34 56',
  email: 'contact@lorient-basket.fr',
  categories: [
    { id: 'cat_b_seniors',   name: 'Seniors',   teams: [{ id: 'Équipe A', name: 'Équipe A', level: 'Pré-Nationale' }, { id: 'Équipe B', name: 'Équipe B', level: 'Régionale 1' }] },
    { id: 'cat_b_jeunes',    name: 'Jeunes',    teams: [{ id: 'U17', name: 'U17', level: 'Régional' }, { id: 'U15', name: 'U15', level: 'Régional' }] },
    { id: 'cat_b_feminines', name: 'Féminines', teams: [{ id: 'Seniors F', name: 'Seniors F', level: 'Régionale 2 F' }] },
  ],
  status: 'verified',
  verified_at: '2026-02-15T09:00:00Z',
  verification_note: null,
  sigle: 'LAB',
  slogan: 'Haut les mains, haut les esprits',
  founding_year: 1978,
  primary_color: '#d97706',
  banner_url: null,
  venue: 'Salle Carnot',
  address: '5 Rue du Général Carnot',
  postal_code: '56100',
  region: 'Bretagne',
  lat: 47.7481,
  lng: -3.3700,
  manager_name: 'Céline Moreau',
  manager_function: 'Présidente',
  manager_phone: '06 87 65 43 21',
  member_count: 210,
  level: 'Pré-Nationale',
  facebook: 'lorient.atlantique.basket',
  instagram: 'lorient_basket',
  tiktok: '',
  created_at: '2026-02-15T10:00:00Z',
};

export const playersBasket = [
  { id: 'demo-player-b01', club_id: CLUB_BASKET_ID, user_id: null, name: 'Maxime Leroux',    team_id: 'Équipe A', position: 'Meneur',      number: 5,  photo_url: 'https://randomuser.me/api/portraits/men/60.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b02', club_id: CLUB_BASKET_ID, user_id: null, name: 'Jordan Koffi',     team_id: 'Équipe A', position: 'Arrière',     number: 3,  photo_url: 'https://randomuser.me/api/portraits/men/61.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b03', club_id: CLUB_BASKET_ID, user_id: null, name: 'Théo Plumereau',   team_id: 'Équipe A', position: 'Ailier',      number: 8,  photo_url: 'https://randomuser.me/api/portraits/men/62.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b04', club_id: CLUB_BASKET_ID, user_id: null, name: 'Cyril Bonneau',    team_id: 'Équipe A', position: 'Ailier fort', number: 7,  photo_url: 'https://randomuser.me/api/portraits/men/63.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b05', club_id: CLUB_BASKET_ID, user_id: null, name: 'Raphaël Gris',     team_id: 'Équipe A', position: 'Pivot',       number: 14, photo_url: 'https://randomuser.me/api/portraits/men/64.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b06', club_id: CLUB_BASKET_ID, user_id: null, name: 'Nathan Vidal',     team_id: 'Équipe A', position: 'Meneur',      number: 4,  photo_url: 'https://randomuser.me/api/portraits/men/65.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b07', club_id: CLUB_BASKET_ID, user_id: null, name: 'Thomas Guezou',    team_id: 'Équipe A', position: 'Arrière',     number: 2,  photo_url: 'https://randomuser.me/api/portraits/men/66.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b08', club_id: CLUB_BASKET_ID, user_id: null, name: 'Enzo Sorel',       team_id: 'Équipe A', position: 'Ailier fort', number: 11, photo_url: 'https://randomuser.me/api/portraits/men/67.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b09', club_id: CLUB_BASKET_ID, user_id: null, name: 'Lucas Briand',     team_id: 'Équipe A', position: 'Pivot',       number: 15, photo_url: 'https://randomuser.me/api/portraits/men/68.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b10', club_id: CLUB_BASKET_ID, user_id: null, name: 'Pierrick Autret',  team_id: 'Équipe A', position: 'Ailier',      number: 6,  photo_url: 'https://randomuser.me/api/portraits/men/69.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b11', club_id: CLUB_BASKET_ID, user_id: null, name: 'Amandine Koch',    team_id: 'Seniors F', position: 'Meneuse',    number: 5,  photo_url: 'https://randomuser.me/api/portraits/women/40.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b12', club_id: CLUB_BASKET_ID, user_id: null, name: 'Lucie Penven',     team_id: 'Seniors F', position: 'Arrière',    number: 8,  photo_url: 'https://randomuser.me/api/portraits/women/41.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b13', club_id: CLUB_BASKET_ID, user_id: null, name: 'Émilie Tanguy',    team_id: 'Seniors F', position: 'Ailière',    number: 10, photo_url: 'https://randomuser.me/api/portraits/women/42.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b14', club_id: CLUB_BASKET_ID, user_id: null, name: 'Camille Quéré',    team_id: 'Seniors F', position: 'Ailier fort', number: 4, photo_url: 'https://randomuser.me/api/portraits/women/43.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
  { id: 'demo-player-b15', club_id: CLUB_BASKET_ID, user_id: null, name: 'Sarah Hamon',      team_id: 'Seniors F', position: 'Pivot',      number: 13, photo_url: 'https://randomuser.me/api/portraits/women/44.jpg', email: null, is_active: true, created_at: '2026-02-15T10:00:00Z' },
];

export const eventsBasket = [
  {
    id: 'demo-event-b01', title: 'LAB Équipe A vs JSA Lorient',
    sport: 'Basketball', date: future(2, 20, 30),
    lat: 47.7481, lng: -3.3700, city: 'Lorient', venue: 'Salle Carnot',
    event_type: 'championship', team_name: 'Équipe A', category: 'Seniors',
    home_or_away: 'home', adversaire: 'JSA Lorient', level: 'Pré-Nationale',
    club_id: CLUB_BASKET_ID, user_id: 'demo-mgr-003', source: 'user',
    is_archived: false, score: null, created_at: past(15),
  },
  {
    id: 'demo-event-b02', title: 'LAB Seniors F vs BC Vannes F',
    sport: 'Basketball', date: future(5, 19),
    lat: 47.7481, lng: -3.3700, city: 'Lorient', venue: 'Salle Carnot',
    event_type: 'championship', team_name: 'Seniors F', category: 'Féminines',
    home_or_away: 'home', adversaire: 'BC Vannes F', level: 'Régionale 2 F',
    club_id: CLUB_BASKET_ID, user_id: 'demo-mgr-003', source: 'user',
    is_archived: false, score: null, created_at: past(12),
  },
  {
    id: 'demo-event-b03', title: 'LAB U17 vs Quimper BC U17',
    sport: 'Basketball', date: future(8, 14),
    lat: 47.7481, lng: -3.3700, city: 'Lorient', venue: 'Salle Carnot',
    event_type: 'championship', team_name: 'U17', category: 'Jeunes',
    home_or_away: 'home', adversaire: 'Quimper BC U17', level: 'Régional',
    club_id: CLUB_BASKET_ID, user_id: 'demo-mgr-003', source: 'user',
    is_archived: false, score: null, created_at: past(10),
  },
  {
    id: 'demo-event-b04', title: 'LAB Équipe A @ Rennes Basket',
    sport: 'Basketball', date: future(15, 20),
    lat: 48.1173, lng: -1.6778, city: 'Rennes', venue: 'Gymnase de Villejean',
    event_type: 'championship', team_name: 'Équipe A', category: 'Seniors',
    home_or_away: 'away', adversaire: 'Rennes Basket', level: 'Pré-Nationale',
    club_id: CLUB_BASKET_ID, user_id: 'demo-mgr-003', source: 'user',
    is_archived: false, score: null, created_at: past(8),
  },
  {
    id: 'demo-event-b05', title: 'Tournoi 3×3 Lorient Beach Basketball',
    sport: 'Basketball', date: future(20, 10),
    lat: 47.7400, lng: -3.3620, city: 'Lorient', venue: 'Front de mer de Lorient',
    event_type: 'tournament', team_name: 'Équipe A', category: 'Seniors',
    tournament_name: 'Lorient Beach Basketball', tournament_type: 'round_robin',
    tournament_categories: 'Open', num_teams: 12, organizer: 'Lorient Atlantique Basket',
    club_id: CLUB_BASKET_ID, user_id: 'demo-mgr-003', source: 'user',
    is_archived: false, score: null, created_at: past(5),
  },
  {
    id: 'demo-event-b06', title: 'LAB Équipe A vs AS Brest Basket',
    sport: 'Basketball', date: past(4, 20, 30),
    lat: 47.7481, lng: -3.3700, city: 'Lorient', venue: 'Salle Carnot',
    event_type: 'championship', team_name: 'Équipe A', category: 'Seniors',
    home_or_away: 'home', adversaire: 'AS Brest Basket', level: 'Pré-Nationale',
    club_id: CLUB_BASKET_ID, user_id: 'demo-mgr-003', source: 'user',
    is_archived: false, score: '78-65', created_at: past(30),
  },
];

export const announcementsBasket = [
  {
    id: 'demo-ann-b01', club_id: CLUB_BASKET_ID, club_name: 'Lorient Atlantique Basket',
    author_id: 'demo-mgr-003', author_name: 'Céline Moreau',
    type: 'result',
    title: '🏀 Victoire 78-65 face à AS Brest Basket !',
    message: "Belle prestation collective de l'Équipe A ! On continue sur cette lancée pour le prochain match à domicile.",
    target_teams: ['Équipe A'], scheduled_for: null, created_at: past(4),
  },
  {
    id: 'demo-ann-b02', club_id: CLUB_BASKET_ID, club_name: 'Lorient Atlantique Basket',
    author_id: 'demo-mgr-003', author_name: 'Céline Moreau',
    type: 'event',
    title: '🏖️ Tournoi 3×3 Beach Basketball — Inscrivez-vous !',
    message: 'Le tournoi 3×3 en front de mer approche ! Inscriptions ouvertes pour tous les niveaux.',
    target_teams: [], scheduled_for: null, created_at: past(5),
  },
];


// ─── CLUB 4 — Quimper Handball Club (Handball, Quimper) ───────────────────────

export const CLUB_HANDBALL_ID = 'demo-club-004';

export const clubHandball = {
  id: CLUB_HANDBALL_ID,
  user_id: 'demo-mgr-004',
  name: 'Quimper Handball Club',
  sport: 'Handball',
  city: 'Quimper',
  description: "Le handball dans toute son intensité au cœur de la Cornouaille. Club fondé en 1985, fort de 250 licenciés.",
  logo_url: null,
  website: null,
  phone: '02 98 64 23 45',
  email: 'contact@quimper-handball.fr',
  categories: [
    { id: 'cat_h_seniors',   name: 'Seniors',   teams: [{ id: 'Équipe 1', name: 'Équipe 1', level: 'N3' }, { id: 'Équipe 2', name: 'Équipe 2', level: 'Régionale 1' }] },
    { id: 'cat_h_jeunes',    name: 'Jeunes',    teams: [{ id: '-18 ans', name: '-18 ans', level: 'Régional' }, { id: '-16 ans', name: '-16 ans', level: 'Régional' }] },
    { id: 'cat_h_feminines', name: 'Féminines', teams: [{ id: 'Seniors F', name: 'Seniors F', level: 'Régionale 1 F' }] },
  ],
  status: 'verified',
  verified_at: '2026-01-20T09:00:00Z',
  verification_note: null,
  sigle: 'QHC',
  slogan: 'Ensemble, plus forts',
  founding_year: 1985,
  primary_color: '#065f46',
  banner_url: null,
  venue: 'Palais des Sports de Cornouaille',
  address: '2 Allée des Sports',
  postal_code: '29000',
  region: 'Bretagne',
  lat: 47.9960,
  lng: -4.1002,
  manager_name: 'Nathalie Cario',
  manager_function: 'Présidente',
  manager_phone: '06 34 56 78 90',
  member_count: 250,
  level: 'Nationale 3',
  facebook: 'quimper.handball.club',
  instagram: 'quimper_handball',
  tiktok: '',
  created_at: '2026-01-20T10:00:00Z',
};

export const playersHandball = [
  { id: 'demo-player-h01', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Arthur Fily',       team_id: 'Équipe 1', position: 'Gardien',        number: 1,  photo_url: 'https://randomuser.me/api/portraits/men/70.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h02', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Pierre-Yves Coat',  team_id: 'Équipe 1', position: 'Ailier gauche',  number: 11, photo_url: 'https://randomuser.me/api/portraits/men/71.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h03', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Mathieu Quéméner',  team_id: 'Équipe 1', position: 'Arrière gauche', number: 6,  photo_url: 'https://randomuser.me/api/portraits/men/72.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h04', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Gaël Le Roux',      team_id: 'Équipe 1', position: 'Pivot',          number: 9,  photo_url: 'https://randomuser.me/api/portraits/men/73.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h05', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Simon Kerboul',     team_id: 'Équipe 1', position: 'Demi-centre',    number: 7,  photo_url: 'https://randomuser.me/api/portraits/men/74.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h06', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Yann Lajarrige',    team_id: 'Équipe 1', position: 'Arrière droit',  number: 8,  photo_url: 'https://randomuser.me/api/portraits/men/75.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h07', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Enzo Coatrieux',    team_id: 'Équipe 1', position: 'Ailier droit',   number: 14, photo_url: 'https://randomuser.me/api/portraits/men/76.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h08', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Florian Moalic',    team_id: 'Équipe 1', position: 'Gardien',        number: 16, photo_url: 'https://randomuser.me/api/portraits/men/77.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h09', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Nicolas Péron',     team_id: 'Équipe 1', position: 'Demi-centre',    number: 5,  photo_url: 'https://randomuser.me/api/portraits/men/78.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h10', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Tanguy Kervella',   team_id: 'Équipe 1', position: 'Pivot',          number: 13, photo_url: 'https://randomuser.me/api/portraits/men/79.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h11', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Maëlis Gueguen',    team_id: 'Seniors F', position: 'Gardienne',     number: 1,  photo_url: 'https://randomuser.me/api/portraits/women/50.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h12', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Léa Gonidec',       team_id: 'Seniors F', position: 'Ailière gauche', number: 11, photo_url: 'https://randomuser.me/api/portraits/women/51.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h13', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Pauline Keromen',   team_id: 'Seniors F', position: 'Demi-centre',   number: 7,  photo_url: 'https://randomuser.me/api/portraits/women/52.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h14', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Julie Faou',        team_id: 'Seniors F', position: 'Arrière droit', number: 8,  photo_url: 'https://randomuser.me/api/portraits/women/53.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
  { id: 'demo-player-h15', club_id: CLUB_HANDBALL_ID, user_id: null, name: 'Anaïs Squividan',   team_id: 'Seniors F', position: 'Pivot',         number: 9,  photo_url: 'https://randomuser.me/api/portraits/women/54.jpg', email: null, is_active: true, created_at: '2026-01-20T10:00:00Z' },
];

export const eventsHandball = [
  {
    id: 'demo-event-h01', title: 'QHC Équipe 1 vs UB Brest Handball',
    sport: 'Handball', date: future(4, 20),
    lat: 47.9960, lng: -4.1002, city: 'Quimper', venue: 'Palais des Sports de Cornouaille',
    event_type: 'championship', team_name: 'Équipe 1', category: 'Seniors',
    home_or_away: 'home', adversaire: 'UB Brest Handball', level: 'N3',
    club_id: CLUB_HANDBALL_ID, user_id: 'demo-mgr-004', source: 'user',
    is_archived: false, score: null, created_at: past(20),
  },
  {
    id: 'demo-event-h02', title: 'QHC Seniors F @ HBC Lorient F',
    sport: 'Handball', date: future(7, 19, 30),
    lat: 47.7481, lng: -3.3700, city: 'Lorient', venue: 'Palais des Sports de Merville',
    event_type: 'championship', team_name: 'Seniors F', category: 'Féminines',
    home_or_away: 'away', adversaire: 'HBC Lorient F', level: 'Régionale 1 F',
    club_id: CLUB_HANDBALL_ID, user_id: 'demo-mgr-004', source: 'user',
    is_archived: false, score: null, created_at: past(15),
  },
  {
    id: 'demo-event-h03', title: 'QHC -18 ans vs Douarnenez HB -18',
    sport: 'Handball', date: future(9, 14),
    lat: 47.9960, lng: -4.1002, city: 'Quimper', venue: 'Gymnase du Moulin Vert',
    event_type: 'championship', team_name: '-18 ans', category: 'Jeunes',
    home_or_away: 'home', adversaire: 'Douarnenez HB', level: 'Régional',
    club_id: CLUB_HANDBALL_ID, user_id: 'demo-mgr-004', source: 'user',
    is_archived: false, score: null, created_at: past(10),
  },
  {
    id: 'demo-event-h04', title: 'QHC Équipe 1 @ HBC Rennes',
    sport: 'Handball', date: future(14, 20),
    lat: 48.1173, lng: -1.6778, city: 'Rennes', venue: 'Arena Loire',
    event_type: 'championship', team_name: 'Équipe 1', category: 'Seniors',
    home_or_away: 'away', adversaire: 'HBC Rennes', level: 'N3',
    club_id: CLUB_HANDBALL_ID, user_id: 'demo-mgr-004', source: 'user',
    is_archived: false, score: null, created_at: past(8),
  },
  {
    id: 'demo-event-h05', title: 'Tournoi Jeunes Cornouaille — Quimper HB',
    sport: 'Handball', date: future(12, 9),
    lat: 47.9960, lng: -4.1002, city: 'Quimper', venue: 'Palais des Sports de Cornouaille',
    event_type: 'tournament', team_name: '-16 ans', category: 'Jeunes',
    tournament_name: 'Tournoi Jeunes Cornouaille', tournament_type: 'groups_then_knockout',
    tournament_categories: '-16 ans', num_teams: 8, organizer: 'Quimper Handball Club',
    club_id: CLUB_HANDBALL_ID, user_id: 'demo-mgr-004', source: 'user',
    is_archived: false, score: null, created_at: past(7),
  },
  {
    id: 'demo-event-h06', title: 'QHC Équipe 1 vs Vannes HB (amical)',
    sport: 'Handball', date: past(6, 20),
    lat: 47.9960, lng: -4.1002, city: 'Quimper', venue: 'Palais des Sports de Cornouaille',
    event_type: 'friendly', team_name: 'Équipe 1', category: 'Seniors',
    home_or_away: 'home', adversaire: 'Vannes HB',
    club_id: CLUB_HANDBALL_ID, user_id: 'demo-mgr-004', source: 'user',
    is_archived: false, score: '31-28', created_at: past(30),
  },
];

export const announcementsHandball = [
  {
    id: 'demo-ann-h01', club_id: CLUB_HANDBALL_ID, club_name: 'Quimper Handball Club',
    author_id: 'demo-mgr-004', author_name: 'Nathalie Cario',
    type: 'result',
    title: '🤾 31-28 contre Vannes HB ! Belle victoire en amical',
    message: 'Très bon test pour nos Seniors avant la reprise du championnat. On monte en puissance !',
    target_teams: ['Équipe 1'], scheduled_for: null, created_at: past(6),
  },
  {
    id: 'demo-ann-h02', club_id: CLUB_HANDBALL_ID, club_name: 'Quimper Handball Club',
    author_id: 'demo-mgr-004', author_name: 'Nathalie Cario',
    type: 'event',
    title: '🏆 Tournoi Cornouaille — Bénévoles recherchés',
    message: "Nous cherchons des bénévoles pour l'organisation du Tournoi Jeunes Cornouaille. Contactez-nous !",
    target_teams: [], scheduled_for: null, created_at: past(7),
  },
];


// ─── CLUB 5 — Saint-Brieuc Volley Ball (Volleyball, Saint-Brieuc) ─────────────

export const CLUB_VOLLEY_ID = 'demo-club-005';

export const clubVolley = {
  id: CLUB_VOLLEY_ID,
  user_id: 'demo-mgr-005',
  name: 'Saint-Brieuc Volley Ball',
  sport: 'Volleyball',
  city: 'Saint-Brieuc',
  description: "Club de volleyball des Côtes-d'Armor, actif depuis 1967. Ambiance familiale et sportivité au programme.",
  logo_url: null,
  website: null,
  phone: '02 96 33 12 34',
  email: 'contact@sbvb.fr',
  categories: [
    { id: 'cat_v_seniors', name: 'Seniors', teams: [{ id: 'Équipe M', name: 'Équipe M', level: 'Régionale 2' }, { id: 'Équipe F', name: 'Équipe F', level: 'Régionale 1 F' }] },
    { id: 'cat_v_jeunes',  name: 'Jeunes',  teams: [{ id: 'U18 M', name: 'U18 M', level: 'Régional' }, { id: 'U18 F', name: 'U18 F', level: 'Régional' }] },
  ],
  status: 'verified',
  verified_at: '2026-03-01T09:00:00Z',
  verification_note: null,
  sigle: 'SBVB',
  slogan: 'Servez fort, smashez juste',
  founding_year: 1967,
  primary_color: '#7c3aed',
  banner_url: null,
  venue: 'Salle du Plateau',
  address: "10 Rue de l'Argoat",
  postal_code: '22000',
  region: 'Bretagne',
  lat: 48.5140,
  lng: -2.7659,
  manager_name: 'Jacques Gourmelon',
  manager_function: 'Président',
  manager_phone: '06 56 78 90 12',
  member_count: 140,
  level: 'Régionale 1 F / Régionale 2 M',
  facebook: 'stbrieuc.volley',
  instagram: 'sbvb_officiel',
  tiktok: '',
  created_at: '2026-03-01T10:00:00Z',
};

export const playersVolley = [
  { id: 'demo-player-v01', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Loïc Mahé',         team_id: 'Équipe M', position: 'Central',          number: 3,  photo_url: 'https://randomuser.me/api/portraits/men/80.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v02', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Rémi Briens',        team_id: 'Équipe M', position: 'Attaquant',         number: 7,  photo_url: 'https://randomuser.me/api/portraits/men/81.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v03', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Thomas Guillemot',   team_id: 'Équipe M', position: 'Passeur',           number: 1,  photo_url: 'https://randomuser.me/api/portraits/men/82.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v04', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Baptiste Cotten',    team_id: 'Équipe M', position: 'Libéro',            number: 12, photo_url: 'https://randomuser.me/api/portraits/men/83.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v05', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Kévin Le Noach',    team_id: 'Équipe M', position: 'Pointu',            number: 5,  photo_url: 'https://randomuser.me/api/portraits/men/84.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v06', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Julien Penloup',     team_id: 'Équipe M', position: 'Réceptionneur',     number: 9,  photo_url: 'https://randomuser.me/api/portraits/men/85.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v07', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Mélanie Josse',      team_id: 'Équipe F', position: 'Passeuse',          number: 4,  photo_url: 'https://randomuser.me/api/portraits/women/60.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v08', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Clémence Botrel',    team_id: 'Équipe F', position: 'Centrale',          number: 6,  photo_url: 'https://randomuser.me/api/portraits/women/61.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v09', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Lucie Fercoq',       team_id: 'Équipe F', position: 'Attaquante',        number: 10, photo_url: 'https://randomuser.me/api/portraits/women/62.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v10', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Inès Gaultier',      team_id: 'Équipe F', position: 'Libéro',            number: 11, photo_url: 'https://randomuser.me/api/portraits/women/63.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v11', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Chloé Varet',        team_id: 'Équipe F', position: 'Pointue',           number: 7,  photo_url: 'https://randomuser.me/api/portraits/women/64.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
  { id: 'demo-player-v12', club_id: CLUB_VOLLEY_ID, user_id: null, name: 'Audrey Burel',       team_id: 'Équipe F', position: 'Réceptionneuse',    number: 8,  photo_url: 'https://randomuser.me/api/portraits/women/65.jpg', email: null, is_active: true, created_at: '2026-03-01T10:00:00Z' },
];

export const eventsVolley = [
  {
    id: 'demo-event-v01', title: 'SBVB Équipe F vs UVSQ Rennes F',
    sport: 'Volleyball', date: future(3, 20),
    lat: 48.5140, lng: -2.7659, city: 'Saint-Brieuc', venue: 'Salle du Plateau',
    event_type: 'championship', team_name: 'Équipe F', category: 'Féminines',
    home_or_away: 'home', adversaire: 'UVSQ Rennes F', level: 'Régionale 1 F',
    club_id: CLUB_VOLLEY_ID, user_id: 'demo-mgr-005', source: 'user',
    is_archived: false, score: null, created_at: past(14),
  },
  {
    id: 'demo-event-v02', title: 'SBVB Équipe M vs VC Dinan',
    sport: 'Volleyball', date: future(6, 19, 30),
    lat: 48.5140, lng: -2.7659, city: 'Saint-Brieuc', venue: 'Salle du Plateau',
    event_type: 'championship', team_name: 'Équipe M', category: 'Seniors',
    home_or_away: 'home', adversaire: 'VC Dinan', level: 'Régionale 2',
    club_id: CLUB_VOLLEY_ID, user_id: 'demo-mgr-005', source: 'user',
    is_archived: false, score: null, created_at: past(12),
  },
  {
    id: 'demo-event-v03', title: 'SBVB U18 F @ Lannion Volley F',
    sport: 'Volleyball', date: future(10, 14),
    lat: 48.7325, lng: -3.4598, city: 'Lannion', venue: 'Gymnase Stade Brélévénez',
    event_type: 'championship', team_name: 'U18 F', category: 'Jeunes',
    home_or_away: 'away', adversaire: 'Lannion Volley U18',
    club_id: CLUB_VOLLEY_ID, user_id: 'demo-mgr-005', source: 'user',
    is_archived: false, score: null, created_at: past(9),
  },
  {
    id: 'demo-event-v04', title: "Tournoi Côtes-d'Armor Volley — Saint-Brieuc",
    sport: 'Volleyball', date: future(16, 9),
    lat: 48.5140, lng: -2.7659, city: 'Saint-Brieuc', venue: 'Salle du Plateau',
    event_type: 'tournament', team_name: 'Équipe F', category: 'Féminines',
    tournament_name: "Tournoi Côtes-d'Armor Volley", tournament_type: 'round_robin',
    tournament_categories: 'Féminines Régional', num_teams: 6, organizer: 'Saint-Brieuc Volley Ball',
    club_id: CLUB_VOLLEY_ID, user_id: 'demo-mgr-005', source: 'user',
    is_archived: false, score: null, created_at: past(6),
  },
  {
    id: 'demo-event-v05', title: 'SBVB Équipe F vs VC Nantes F',
    sport: 'Volleyball', date: past(8, 20),
    lat: 48.5140, lng: -2.7659, city: 'Saint-Brieuc', venue: 'Salle du Plateau',
    event_type: 'championship', team_name: 'Équipe F', category: 'Féminines',
    home_or_away: 'home', adversaire: 'VC Nantes F', level: 'Régionale 1 F',
    club_id: CLUB_VOLLEY_ID, user_id: 'demo-mgr-005', source: 'user',
    is_archived: false, score: '3-1', created_at: past(25),
  },
];

export const announcementsVolley = [
  {
    id: 'demo-ann-v01', club_id: CLUB_VOLLEY_ID, club_name: 'Saint-Brieuc Volley Ball',
    author_id: 'demo-mgr-005', author_name: 'Jacques Gourmelon',
    type: 'result',
    title: '🏐 3-1 victoire face à VC Nantes F !',
    message: "Excellent match de nos filles ! Toutes les équipes ont su se battre set après set. Bravo !",
    target_teams: ['Équipe F'], scheduled_for: null, created_at: past(8),
  },
  {
    id: 'demo-ann-v02', club_id: CLUB_VOLLEY_ID, club_name: 'Saint-Brieuc Volley Ball',
    author_id: 'demo-mgr-005', author_name: 'Jacques Gourmelon',
    type: 'info',
    title: '📅 Planning des matchs de juin — mis à jour',
    message: "Le planning des rencontres de juin est disponible. N'oubliez pas de confirmer votre présence !",
    target_teams: [], scheduled_for: null, created_at: past(3),
  },
];


// ─── Exports groupés ──────────────────────────────────────────────────────────

export const extraClubs = [clubRugby, clubBasket, clubHandball, clubVolley];

export const extraPlayers = [
  ...playersRugby,
  ...playersBasket,
  ...playersHandball,
  ...playersVolley,
];

export const extraEvents = [
  ...eventsRugby,
  ...eventsBasket,
  ...eventsHandball,
  ...eventsVolley,
];

export const extraAnnouncements = [
  ...announcementsRugby,
  ...announcementsBasket,
  ...announcementsHandball,
  ...announcementsVolley,
];
