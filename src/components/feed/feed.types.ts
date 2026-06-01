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
  club_name?:     string;
  club_logo_url?: string;
  event_type?:    string;  // 'match' | 'tournament' | null
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

// ── Carte Flash Info ──────────────────────────────────────────────────────────
// Source : table club_announcements (type urgent/info/event)
export interface FlashFeedItem extends BaseFeedItem {
  type: 'flash';
  announcement_id: string;
  title?: string;
  message: string;
  badge: FlashBadge;
  author_name?: string;
}

// ── Carte Résultat de match ───────────────────────────────────────────────────
// Source : table events (score non-null)
export interface ResultFeedItem extends BaseFeedItem {
  type: 'result';
  event_id: string;
  home_team: string;
  away_team: string;
  score_home: number;
  score_away: number;
  sport: string;
  date: string;           // ISO 8601
  club_name?: string;
  club_logo_url?: string;
}

// ── Carte Sponsor Local ───────────────────────────────────────────────────────
// Source : table sponsors (à créer) — injectée toutes les N cartes
export interface SponsorFeedItem extends BaseFeedItem {
  type: 'sponsor';
  sponsor_id: string;
  sponsor_name: string;
  logo_url?: string;
  logo_white_url?: string;  // version blanche/monochrome pour fonds sombres
  bg_color?: string;
  tagline: string;
  cta_label?: string;
  cta_url?: string;
}

// ── Plan d'abonnement "À la Une" ──────────────────────────────────────────────
export type FeaturedPlan = 'starter' | 'pro' | 'elite';

/** Config visuelle + limites métier par plan */
export const PLAN_CONFIG: Record<FeaturedPlan, {
  label: string;
  /** Nb max d'événements mis en avant simultanément par ce club */
  maxFeatured: number;
  /** Durée max d'une mise en avant en jours */
  durationDays: number;
  /** Couleur d'accent (badge, bouton, glow) */
  accent: string;
  /** Fond semi-transparent de la carte */
  bg: string;
  /** Couleur de bordure */
  border: string;
  /** Halo CSS */
  glow: string;
}> = {
  starter: {
    label:        'Starter',
    maxFeatured:  1,
    durationDays: 7,
    accent:       '#94a3b8',
    bg:           'rgba(148,163,184,0.06)',
    border:       'rgba(148,163,184,0.2)',
    glow:         'rgba(148,163,184,0.08)',
  },
  pro: {
    label:        'Club Pro',
    maxFeatured:  3,
    durationDays: 30,
    accent:       '#f59e0b',
    bg:           'rgba(245,158,11,0.07)',
    border:       'rgba(245,158,11,0.3)',
    glow:         'rgba(245,158,11,0.12)',
  },
  elite: {
    label:        'Élite',
    maxFeatured:  5,
    durationDays: 60,
    accent:       '#a855f7',
    bg:           'rgba(168,85,247,0.08)',
    border:       'rgba(168,85,247,0.35)',
    glow:         'rgba(168,85,247,0.18)',
  },
};

// ── Événement "À la Une" ──────────────────────────────────────────────────────
// Source : table featured_events (JOIN events + clubs)
export interface FeaturedFeedItem extends BaseFeedItem {
  type:        'featured';
  featured_id: string;
  event_id:    string;
  club_name:   string;
  plan:        FeaturedPlan;
  title:       string;
  date:        string;         // YYYY-MM-DD
  time:        string;         // HH:MM
  sport:       string;
  venue?:      string;
  city?:       string;
  poster_url?: string;
  home_team?:  string;
  away_team?:  string;
}

// ── Union discriminante ───────────────────────────────────────────────────────
export type FeedItem =
  | MatchFeedItem
  | CarpoolFeedItem
  | FlashFeedItem
  | ResultFeedItem
  | SponsorFeedItem
  | FeaturedFeedItem;
