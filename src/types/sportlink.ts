// ─────────────────────────────────────────────────────────────────────────────
// sportlink.ts — Types TypeScript centraux (source de vérité unique)
// ─────────────────────────────────────────────────────────────────────────────

// ── Utilitaires ───────────────────────────────────────────────────────────────

export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;

// ── Plans ─────────────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'elite';
export type UserRole = 'user' | 'club_admin' | 'admin' | 'superadmin';

// ── User / Profile ────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: string;
  email: string | undefined;
  name: string;
  role: UserRole;
  avatar: Nullable<string>;
  favoriteSports: string[];
  followedClubs: string[];
  clubId: Nullable<string>;
  onboardingDone: boolean | null;
  digestOptIn: boolean;
  authProvider: Nullable<string>;
  badges: string[];
  plan: PlanId;
  xp: number;
  jobRole: Nullable<string>;
  homeCity: Nullable<CitySelection>;
  createdAt: string;
}

export interface FollowNotifPrefs {
  match: boolean;
  news: boolean;
}

export interface ClubFollow {
  clubId: string;
  teams: 'all' | string[];
  notif: FollowNotifPrefs;
}

// ── Event ─────────────────────────────────────────────────────────────────────

export type EventType = 'friendly' | 'championship' | 'cup' | 'tournament' | 'training';
export type HomeOrAway = 'home' | 'away';
export type EventSource = 'user' | 'import' | 'system';

export interface EventScore {
  home: number | null;
  away: number | null;
}

export interface EventStandings {
  rank?: number;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  points?: number;
}

export interface SportLinkEvent {
  id: string;
  title: string;
  sport: string;
  date: string;           // YYYY-MM-DD
  lat: number | null;
  lng: number | null;
  city: string;
  venue: string;
  description: string;
  eventType: EventType;
  teamName: string;
  category: string;
  level: string;
  cupType: string;
  homeOrAway: HomeOrAway;
  adversaire: string;
  standings: EventStandings | null;
  score: EventScore | null;
  manOfMatch: string;
  clubId: Nullable<string>;
  userId: string;
  seriesId: Nullable<string>;
  source: EventSource;
  updatedAt: Nullable<string>;
  // Tournament-specific
  tournamentName: string;
  tournamentType: string;
  numTeams: number | null;
  tournamentFormat: string;
  tournamentCategories: string;
  prize: string;
  organizer: string;
  // UI helpers
  homeTeam?: string;
  awayTeam?: string;
  time?: string;
  _temp?: boolean;
}

// ── Club ──────────────────────────────────────────────────────────────────────

export type ClubStatus =
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  | 'suspended';

// Une équipe au sein d'une catégorie (ex. « Équipe 1 » niveau « R2 »).
export interface ClubTeam {
  id: string;
  name: string;
  level: string;
}

// Une catégorie du club regroupant des équipes (ex. « Seniors », « Jeunes »).
export interface ClubCategory {
  id: string;
  name: string;
  teams: ClubTeam[];
}

export interface SportLinkClub {
  id: string;
  name: string;
  sport: string;
  city: string;
  description: string;
  logoUrl: Nullable<string>;
  logo: Nullable<string>;
  website: string;
  phone: string;
  email: string;
  categories: ClubCategory[];
  userId: string;
  status: ClubStatus;
  verificationNote: Nullable<string>;
  verifiedAt: Nullable<string>;
  // Enriched identity
  sigle: string;
  slogan: string;
  foundingYear: number | null;
  primaryColor: string;
  bannerUrl: Nullable<string>;
  // Location
  venue: string;
  address: string;
  postalCode: string;
  region: string;
  lat: number | null;
  lng: number | null;
  // Contact
  managerName: string;
  managerFunction: string;
  managerPhone: string;
  // Sport & membership
  memberCount: number | null;
  level: string;
  // Social
  facebook: string;
  instagram: string;
  tiktok: string;
  isUserCreated?: boolean;
}

// ── Poster ────────────────────────────────────────────────────────────────────

export type PosterFormat = 'story' | 'square' | 'landscape';

export interface PosterTransform {
  dx?: number;
  dy?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  hidden?: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export interface PosterOverlayElement {
  uid: string;
  imageUrl: string;
  prompt?: string;
  dx: number;
  dy: number;
  scale: number;
  rotation: number;
  opacity: number;
  above?: boolean;
}

export interface PosterPlayerLayer {
  uid: string;
  imageUrl: string;
  dx: number;
  dy: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface PosterState {
  format: PosterFormat;
  templateId: string;
  accentColor: string;
  homeLogo: string | null;
  awayLogo: string | null;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  championship: string;
  tagline: string;
  bgPreset: string;
  bgImage: string | null;
  overlayElements: PosterOverlayElement[];
  aiOverlayElements: PosterOverlayElement[];
  playerLayers: PosterPlayerLayer[];
  transforms: Record<string, PosterTransform>;
  effects: Record<string, unknown>;
  scoreHome?: number;
  scoreAway?: number;
}

// ── Référence à une équipe dans le contexte d'une affiche ─────────────────────

export interface PosterTeam {
  name: string;
  logo?: string;
}

export interface PosterData {
  event: {
    date: string;
    sport: string;
    venue?: string;
    city?: string;
    homeOrAway?: HomeOrAway;
  };
  homeTeam: PosterTeam;
  awayTeam: PosterTeam;
  championship?: string;
  tagline?: string;
  accentColor?: string;
}

// ── Match week-end résolu (WeekendPosters) ────────────────────────────────────

export interface WeekendMatch {
  id: string;
  clubId: string;
  category: string;
  homeTeam: PosterTeam;
  awayTeam: PosterTeam;
  date: Date;
  time?: string;
  venue?: string;
  competition: string;
  sport: string;
  templateId: string;
  bgPresetId?: string;
  posterData: PosterData;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

// ── Feedback ──────────────────────────────────────────────────────────────────

export type FeedbackType = 'bug' | 'idea' | 'question';
export type FeedbackStatus =
  | 'new'
  | 'analyzing'
  | 'planned'
  | 'in_dev'
  | 'resolved'
  | 'closed';

export interface AppFeedback {
  id: string;
  userId: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  voteCount: number;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackNotification {
  id: string;
  userId: string;
  feedbackId: string;
  oldStatus: FeedbackStatus;
  newStatus: FeedbackStatus;
  read: boolean;
  createdAt: string;
}

// ── Export ────────────────────────────────────────────────────────────────────

export type ExportAction = 'download' | 'share';

// ── Géographie ────────────────────────────────────────────────────────────────

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface Commune {
  nom: string;
  code: string;
  departement?: string;
}

// Ville sélectionnée via CityAutocomplete (geo.api.gouv.fr) — persistée dans
// profiles.home_city et relue par la carte pour centrer la vue.
export interface CitySelection {
  nom: string;
  lat: number;
  lng: number;
  codesPostaux: string[];
  codeRegion: string;
  codeDepartement: string;
}

// ── Sport ─────────────────────────────────────────────────────────────────────

export interface Sport {
  id: string;
  name: string;
  icon?: string;
  category?: string;
}

// ── Convocation ───────────────────────────────────────────────────────────────

export type ConvocationStatus = 'pending' | 'accepted' | 'declined' | 'unavailable';
