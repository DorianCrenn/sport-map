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
  categories: string[];
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

// ── Announcement ──────────────────────────────────────────────────────────────

export type AnnouncementType = 'urgent' | 'info' | 'result' | 'event';

export interface ClubAnnouncement {
  id: string;
  clubId: string;
  type: AnnouncementType;
  title?: string;
  message: string;
  targetTeams: string[];
  createdAt: string;
  clubName?: string;
  clubLogo?: string;
  isRead?: boolean;
}

// ── Rides / Covoiturage ───────────────────────────────────────────────────────

export type RideStatus = 'open' | 'full' | 'cancelled';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Ride {
  id: string;
  eventId: string;
  driverId: string;
  driverName?: string;
  driverAvatar?: string;
  seats: number;
  departure: string;
  departureTime?: string;
  status: RideStatus;
  createdAt: string;
  requests?: RideRequest[];
  availableSeats?: number;
}

export interface RideRequest {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName?: string;
  status: RequestStatus;
  message?: string;
  createdAt: string;
}

export interface RideNotification {
  id: string;
  userId: string;
  rideId: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// ── Badges / XP ───────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

// ── Club Page ─────────────────────────────────────────────────────────────────

export type ClubPageBlockType =
  | 'text'
  | 'matches'
  | 'trainings'
  | 'members'
  | 'gallery'
  | 'sponsors'
  | 'social'
  | 'nextmatch'
  | 'lineup'
  | 'stats';

export interface ClubPageBlock {
  id: string;
  type: ClubPageBlockType;
  data: Record<string, unknown>;
}

export interface ClubPage {
  clubId: string;
  blocks: ClubPageBlock[];
  theme?: string;
}

// ── Media ─────────────────────────────────────────────────────────────────────

export interface ClubMediaAsset {
  id: string;
  clubId: string;
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

// ── Poster ────────────────────────────────────────────────────────────────────

export type PosterFormat = 'story' | 'square' | 'landscape';
export type PosterStatus = 'draft' | 'saved' | 'exported';

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

// ── Match données brutes (calendrier importé) ─────────────────────────────────

export interface RawMatch {
  id: string;
  date: string;
  isHome?: boolean;
  opponent?: string;
  time?: string;
  venue?: string;
  competition?: string;
  teamName?: string;
  category?: string;
  scoreHome?: number | null;
  scoreAway?: number | null;
  publishedOnMap?: boolean;
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

// ── Push notifications ────────────────────────────────────────────────────────

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'user_login'
  | 'page_view'
  | 'event_created'
  | 'poster_opened'
  | 'club_created'
  | 'poster_exported'
  | 'ride_created'
  | 'announcement_sent'
  | 'training_created'
  | 'convocation_sent'
  | 'convocation_responded';

export interface AnalyticsEvent {
  id: string;
  userId: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  properties: Record<string, unknown>;
  createdAt: string;
}

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
export type ExportStatus = 'idle' | 'generating' | 'done' | 'error';

// ── Supabase helpers ──────────────────────────────────────────────────────────

export interface SupabaseResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

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

// ── Sport ─────────────────────────────────────────────────────────────────────

export interface Sport {
  id: string;
  name: string;
  icon?: string;
  category?: string;
}

// ── Entraînement ─────────────────────────────────────────────────────────────

export type WeekDay = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';

export interface ClubTraining {
  id: string;
  clubId: string;
  teamName?: string;
  day: WeekDay;
  time: string;
  location: string;
  duration?: number;
  notes?: string;
}

// ── Club Manager ──────────────────────────────────────────────────────────────

export type ManagerRole = 'manager' | 'coach' | 'president' | 'secretary';
export type ManagerStatus = 'pending' | 'active';

export interface ClubManager {
  id: string;
  clubId: string;
  email: string;
  role: ManagerRole;
  status: ManagerStatus;
  name?: string;
}

// ── Convocation ───────────────────────────────────────────────────────────────

export type ConvocationStatus = 'pending' | 'accepted' | 'declined' | 'maybe';

export interface Convocation {
  id: string;
  eventId: string;
  playerId: string;
  playerName?: string;
  status: ConvocationStatus;
  message?: string;
  createdAt: string;
}

// ── Player ────────────────────────────────────────────────────────────────────

export interface ClubPlayer {
  id: string;
  clubId: string;
  name: string;
  email?: string;
  userId?: string;
  number?: number;
  position?: string;
  category?: string;
  isActive: boolean;
}

// ── Sponsor ───────────────────────────────────────────────────────────────────

export interface ClubSponsor {
  id: string;
  clubId: string;
  name: string;
  logoUrl?: string;
  logoWhiteUrl?: string;
  bgColor?: string;
  tagline: string;
  ctaLabel?: string;
  ctaUrl?: string;
  isActive: boolean;
}

// ── Featured Event ────────────────────────────────────────────────────────────

export type FeaturedPlan = 'pro' | 'elite';

export interface FeaturedEvent {
  id: string;
  eventId: string;
  clubId: string;
  plan: FeaturedPlan;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

// ── Brand Kit ─────────────────────────────────────────────────────────────────

export interface ClubBrandKit {
  clubId: string;
  primaryColor?: string;
  secondaryColor?: string;
  defaultTemplateId?: string;
  daProfile?: Record<string, unknown>;
  adminNotifPrefs?: Record<string, boolean>;
}
