import type { FeedItem, SponsorFeedItem } from './feed.types';

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
