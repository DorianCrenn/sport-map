import type { FeedItem, SponsorFeedItem, FeaturedFeedItem } from './feed.types';

// ── Helpers temporels ─────────────────────────────────────────────────────────
const N = Date.now();
const ago = (h: number) => new Date(N - h * 3_600_000).toISOString();
const inDays = (d: number) => new Date(N + d * 86_400_000).toISOString();
const dateOnly = (d: number) => inDays(d).slice(0, 10);

const CID = 'club-ag-plouvorn';

// ── Sponsors du club (Finistère fictif) ───────────────────────────────────────
export const MOCK_SPONSORS: SponsorFeedItem[] = [
  {
    id: 'spo-1',
    type: 'sponsor',
    club_id: CID,
    created_at: ago(0),
    sponsor_id: 'spo-1',
    sponsor_name: 'Boulangerie Coat',
    tagline: 'Artisan boulanger à Plouvorn depuis 1978. Ce match vous est présenté par la Boulangerie Coat.',
    bg_color: '#3b1a08',
    cta_label: 'Découvrir',
    cta_url: '#',
  },
  {
    id: 'spo-2',
    type: 'sponsor',
    club_id: CID,
    created_at: ago(0),
    sponsor_id: 'spo-2',
    sponsor_name: 'Garage Le Bihan Auto',
    tagline: 'Votre partenaire mobilité en Finistère. Toutes marques, toutes réparations, devis gratuit.',
    bg_color: '#0c1e3a',
    cta_label: 'Prendre RDV',
    cta_url: '#',
  },
  {
    id: 'spo-3',
    type: 'sponsor',
    club_id: CID,
    created_at: ago(0),
    sponsor_id: 'spo-3',
    sponsor_name: 'Thalasso Roscoff',
    tagline: 'Récupération & bien-être pour les sportifs. Forfait "Après-match" : soins marins + massage 60 min.',
    bg_color: '#041e2e',
    cta_label: 'Réserver',
    cta_url: '#',
  },
  {
    id: 'spo-4',
    type: 'sponsor',
    club_id: CID,
    created_at: ago(0),
    sponsor_id: 'spo-4',
    sponsor_name: "Intersport Brest",
    tagline: "Équipez-vous pour la saison ! -15 % sur les maillots personnalisés pour les clubs partenaires.",
    bg_color: '#1a0a2e',
    cta_label: 'Voir les offres',
    cta_url: '#',
  },
  {
    id: 'spo-5',
    type: 'sponsor',
    club_id: CID,
    created_at: ago(0),
    sponsor_id: 'spo-5',
    sponsor_name: 'Crêperie Ar Mor',
    tagline: "La crêperie officielle de l'AG Plouvorn. Menu supporter après chaque match à domicile : galette + cidre 12 €.",
    bg_color: '#1f1200',
    cta_label: 'Voir le menu',
    cta_url: '#',
  },
];

// ── Fil d'actualité fictif — AG Plouvorn (Football, Finistère) ────────────────
export const MOCK_FEED_ITEMS: FeedItem[] = [
  // 1 — Prochain match à domicile
  {
    id: 'match-1',
    type: 'match',
    club_id: CID,
    created_at: ago(1),
    event_id: 'evt-dom-1',
    home_team: 'AG Plouvorn',
    away_team: 'Entente Plouénan FC',
    date: dateOnly(5),
    time: '15:00',
    venue: 'Stade Municipal de Plouvorn',
    city: 'Plouvorn',
    sport: 'Football',
    attendee_count: 17,
    user_is_attending: false,
  },

  // 2 — Flash victoire récente
  {
    id: 'flash-1',
    type: 'flash',
    club_id: CID,
    created_at: ago(3),
    announcement_id: 'ann-1',
    badge: 'success',
    title: 'Victoire 3-2 des U18 !',
    message: 'Belle victoire hier soir à Plouénan. Buts de K. Morin (x2) et A. Tanguy. Bravo à tout le groupe, cap sur la prochaine ! 🏆',
    author_name: 'Stéphane Larvol · Entraîneur U18',
  },

  // 3 — Covoit déplacement proche
  {
    id: 'covoit-1',
    type: 'carpool',
    club_id: CID,
    created_at: ago(5),
    ride_id: 'ride-1',
    driver_name: 'Thomas Berton',
    destination: 'Landivisiau',
    departure_location: 'Place de la Mairie, Plouvorn',
    departure_time: inDays(3),
    total_seats: 4,
    available_seats: 2,
    event_id: 'evt-ext-1',
  },

  // 4 — Flash annulation entraînement
  {
    id: 'flash-2',
    type: 'flash',
    club_id: CID,
    created_at: ago(8),
    announcement_id: 'ann-2',
    badge: 'alert',
    message: 'Entraînement de mercredi soir annulé — terrain impraticable suite aux pluies. Reprise jeudi à 19h au complexe.',
    author_name: 'Jean-Yves Kernilis · Direction technique',
  },

  // 5 — Covoit dernière place
  {
    id: 'covoit-2',
    type: 'carpool',
    club_id: CID,
    created_at: ago(11),
    ride_id: 'ride-2',
    driver_name: 'Marie-Françoise Kernaleguen',
    destination: 'Morlaix',
    departure_location: 'Salle des fêtes, Plouvorn',
    departure_time: inDays(5),
    total_seats: 3,
    available_seats: 1,
    event_id: 'evt-dom-1',
  },

  // 6 — Match déplacement (semaine suivante)
  {
    id: 'match-2',
    type: 'match',
    club_id: CID,
    created_at: ago(26),
    event_id: 'evt-ext-2',
    home_team: 'RC Lesnevien',
    away_team: 'AG Plouvorn',
    date: dateOnly(12),
    time: '18:30',
    venue: 'Stade de la Libération',
    city: 'Lesneven',
    sport: 'Football',
    attendee_count: 8,
    user_is_attending: true,
  },

  // 7 — Flash info AG annuelle
  {
    id: 'flash-3',
    type: 'flash',
    club_id: CID,
    created_at: ago(38),
    announcement_id: 'ann-3',
    badge: 'info',
    title: 'Assemblée Générale du club',
    message: 'Rappel : AG du club le 15 juin à 19h à la Mairie de Plouvorn. La présence de tous les licenciés et parents est souhaitée.',
    author_name: 'Bureau AG Plouvorn',
  },

  // 8 — Covoit complet (cas d'usage zéro place)
  {
    id: 'covoit-3',
    type: 'carpool',
    club_id: CID,
    created_at: ago(48),
    ride_id: 'ride-3',
    driver_name: 'Yannick Le Gall',
    destination: 'Brest',
    departure_location: 'Parking de la salle omnisports',
    departure_time: inDays(12),
    total_seats: 3,
    available_seats: 0,
    event_id: 'evt-ext-2',
  },
];

// ── Événements "À la Une" — 3 plans différents pour visualiser les styles ─────
export const MOCK_FEATURED: FeaturedFeedItem[] = [
  {
    id:          'feat-1',
    type:        'featured',
    club_id:     'club-us-landivisiau',
    created_at:  ago(2),
    featured_id: 'feat-uuid-1',
    event_id:    'evt-feat-1',
    club_name:   'US Landivisiau',
    plan:        'elite',
    title:       'US Landivisiau vs Quimper FC — Finale de coupe',
    date:        dateOnly(4),
    time:        '15:00',
    sport:       'Football',
    venue:       'Stade de Keroual',
    city:        'Landivisiau',
    home_team:   'US Landivisiau',
    away_team:   'Quimper FC',
  },
  {
    id:          'feat-2',
    type:        'featured',
    club_id:     'club-brest-hb',
    created_at:  ago(5),
    featured_id: 'feat-uuid-2',
    event_id:    'evt-feat-2',
    club_name:   'Brest Handball',
    plan:        'pro',
    title:       'Tournoi Régional Bretagne — 12 équipes',
    date:        dateOnly(7),
    time:        '09:00',
    sport:       'Handball',
    venue:       'Palais des Sports',
    city:        'Brest',
    home_team:   undefined,
    away_team:   undefined,
  },
  {
    id:          'feat-3',
    type:        'featured',
    club_id:     'club-morlaix-basket',
    created_at:  ago(10),
    featured_id: 'feat-uuid-3',
    event_id:    'evt-feat-3',
    club_name:   'Morlaix Basket',
    plan:        'starter',
    title:       'Morlaix Basket vs Brest ABM',
    date:        dateOnly(3),
    time:        '20:30',
    sport:       'Basketball',
    city:        'Morlaix',
    home_team:   'Morlaix Basket',
    away_team:   'Brest ABM',
  },
];
