export const DEMO_CLUB_ID  = 'demo-club-001';
export const DEMO_USER_ID  = 'demo-user-001';

// Données brutes DB (snake_case) — mapFromDB dans useClubs.js les convertit
export const demoClubRow = {
  id:                DEMO_CLUB_ID,
  user_id:           DEMO_USER_ID,
  name:              'FC SportLink Démo',
  sport:             'Football',
  city:              'Brest',
  description:       'Club de démonstration SportLink. Explorez toutes les fonctionnalités en toute liberté — aucune donnée n\'est enregistrée.',
  logo_url:          null,
  website:           'https://sportlink.app',
  phone:             '06 12 34 56 78',
  email:             'contact@fc-sportlink-demo.fr',
  categories: [
    { name: 'Seniors',   teams: [{ name: 'Équipe 1', level: 'R2' }, { name: 'Réserve', level: 'D1' }] },
    { name: 'Jeunes',    teams: [{ name: 'U17', level: 'R2 U17' }, { name: 'U15', level: 'D1 U15' }, { name: 'U13', level: 'D1 U13' }, { name: 'U11', level: 'D2 U11' }] },
    { name: 'Féminines', teams: [{ name: 'Équipe F', level: 'R1 F' }, { name: 'U15 F', level: 'D1 U15 F' }] },
  ],
  status:            'active',
  verification_note: null,
  verified_at:       '2026-01-20T09:00:00Z',
  // Identité enrichie
  sigle:             'FCSL',
  slogan:            'Passion, Engagement, Performance',
  founding_year:     2018,
  primary_color:     '#1d4ed8',
  banner_url:        null,
  // Localisation
  venue:             'Stade Francis-Le Blé',
  address:           '1 Rue du Stade',
  postal_code:       '29200',
  region:            'Bretagne',
  lat:               48.3904,
  lng:               -4.4861,
  // Contact
  manager_name:      'Alexandre Martin',
  manager_function:  'Président',
  manager_phone:     '06 12 34 56 78',
  // Effectif
  member_count:      120,
  level:             'Régional 2',
  // Réseaux
  facebook:          'fc.sportlink.demo',
  instagram:         'fc_sportlink_demo',
  tiktok:            '',
  created_at:        '2026-01-15T10:00:00Z',
};

export const demoBrandKit = {
  club_id:          DEMO_CLUB_ID,
  da_profile:       {
    colors: {
      dominant:   '#1d4ed8',
      secondary:  '#93c5fd',
      accent:     '#f59e0b',
      background: '#111827',
      text:       '#ffffff',
    },
    palette:            ['#1d4ed8', '#f59e0b', '#ffffff', '#93c5fd', '#1e3a8a'],
    style:              'classic',
    styleLabel:         'Classique · Pro',
    mood:               ['professionnel', 'sobre', 'officiel'],
    templateAffinities: ['editorial', 'magazine', 'simple'],
    typography:         { weight: 'black', tracking: 'tight' },
    elements:           { hasGradients: true, hasGlow: false, hasGold: false },
    analysedAt:         '2026-01-15T10:00:00Z',
    confidence:         0.85,
    mockMode:           true,
  },
  default_template_id: 'match-modern-01',
  admin_notif_prefs:   { match_j1: true, match_today: true, post_match_score: true },
};

export const demoClubPage = {
  club_id: DEMO_CLUB_ID,
  blocks: [
    { id: 'b1', type: 'title',           data: { text: 'Bienvenue au FC SportLink Démo' } },
    { id: 'b2', type: 'about',           data: { text: 'Club fondé en 2018, basé à Brest. Nous évoluons en Régional 2 avec plus de 120 licenciés répartis sur 8 équipes. Rejoignez-nous !' } },
    { id: 'b3', type: 'next-match',      data: {} },
    { id: 'b4', type: 'upcoming-events', data: { title: 'Prochains événements' } },
    { id: 'b5', type: 'roster',          data: { title: 'Notre effectif' } },
    { id: 'b6', type: 'training',        data: { title: 'Entraînements' } },
    { id: 'b7', type: 'sponsors',        data: { title: 'Nos partenaires' } },
  ],
  typography: { fontFamily: 'Inter', headingSize: 'lg' },
  theme:      { variant: 'light' },
};
