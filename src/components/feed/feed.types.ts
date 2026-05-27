// ── Filtre d'affichage du feed ────────────────────────────────────────────────
export type FeedFilter = 'all' | 'match' | 'carpool' | 'flash';

// ── Badge couleur pour les Flash Info ────────────────────────────────────────
export type FlashBadge = 'info' | 'success' | 'alert';

// ── Base commune à tous les éléments ─────────────────────────────────────────
interface BaseFeedItem {
  id: string;
  created_at: string; // ISO 8601
  club_id: string;
}

// ── Carte Jour de Match ───────────────────────────────────────────────────────
// Source : table events + posters (PosterStudio)
export interface MatchFeedItem extends BaseFeedItem {
  type: 'match';
  event_id: string;
  home_team: string;
  away_team: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM
  venue: string;
  city: string;
  sport: string;
  poster_url?: string;  // URL de l'affiche générée (null = affichage générique)
  attendee_count: number;
  user_is_attending: boolean;
}

// ── Carte Covoiturage Logistique ──────────────────────────────────────────────
// Source : table rides
export interface CarpoolFeedItem extends BaseFeedItem {
  type: 'carpool';
  ride_id: string;
  driver_name: string;
  driver_avatar?: string;
  destination: string;
  departure_location: string;
  departure_time: string;  // ISO 8601
  total_seats: number;
  available_seats: number;
  event_id: string;
}

// ── Carte Flash Info / Résultat ───────────────────────────────────────────────
// Source : table club_announcements
export interface FlashFeedItem extends BaseFeedItem {
  type: 'flash';
  announcement_id: string;
  title?: string;
  message: string;
  badge: FlashBadge;
  author_name?: string;
}

// ── Carte Sponsor Local ───────────────────────────────────────────────────────
// Source : table sponsors (à créer) — injectée toutes les N cartes
export interface SponsorFeedItem extends BaseFeedItem {
  type: 'sponsor';
  sponsor_id: string;
  sponsor_name: string;
  logo_url?: string;
  bg_color?: string;   // couleur de fond de la carte
  tagline: string;
  cta_label?: string;
  cta_url?: string;
}

// ── Union discriminante ───────────────────────────────────────────────────────
export type FeedItem =
  | MatchFeedItem
  | CarpoolFeedItem
  | FlashFeedItem
  | SponsorFeedItem;
