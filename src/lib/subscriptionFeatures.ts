// ─────────────────────────────────────────────────────────────────────────────
// subscriptionFeatures.ts — Source de vérité unique des plans SportLink
//
// RÈGLE D'OR : Ce fichier ne contient que des données. Jamais de logique
// conditionnelle. Pour ajouter une feature : 1) ajouter la FeatureKey,
// 2) la placer dans FEATURE_GATES, 3) documenter dans SUBSCRIPTIONS_PLAN.md.
// ─────────────────────────────────────────────────────────────────────────────

// ── Tiers ────────────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'elite';

export const PLAN_RANK: Record<PlanId, number> = {
  free:    0,
  starter: 1,
  pro:     2,
  elite:   3,
};

export const PLAN_ORDER: readonly PlanId[] = ['free', 'starter', 'pro', 'elite'];

export const PLAN_META: Record<PlanId, {
  name:  string;
  price: number;
  color: string;
  badge: string;
}> = {
  free:    { name: 'Gratuit',  price: 0,  color: 'var(--sl-t3)', badge: '⚪' },
  starter: { name: 'Starter',  price: 9,  color: '#3b82f6',      badge: '🔵' },
  pro:     { name: 'Club Pro', price: 29, color: '#8b5cf6',      badge: '🟣' },
  elite:   { name: 'Elite',    price: 59, color: '#f59e0b',      badge: '👑' },
};

// ── Feature keys ──────────────────────────────────────────────────────────────

export type FeatureKey =
  // PosterStudio
  | 'POSTER_SIMPLE'
  | 'POSTER_EXPERT'
  | 'POSTER_WATERMARK_REMOVE'
  | 'POSTER_AI_BACKGROUND'
  | 'POSTER_AI_ELEMENTS'
  | 'POSTER_AI_BRANDING'
  | 'POSTER_TEMPLATES_ADVANCED'
  | 'POSTER_SPONSORS_LOGOS'
  // Covoiturage
  | 'CARPOOLING'
  | 'CARPOOLING_ALL_TEAMS'
  | 'CARPOOLING_AUTO_REMINDERS'
  // Compositions & Effectif
  | 'TEAM_LINEUPS'
  | 'ADVANCED_LINEUPS'
  | 'LINEUP_GENERATOR'
  // Statistiques
  | 'PLAYER_STATS'
  | 'TEAM_STATS'
  | 'ADVANCED_STATS'
  // Communication & Feed
  | 'FEATURED_EVENTS'
  | 'SPONSORS_FEED_CARDS'
  | 'SPONSORS_ON_POSTERS'
  | 'PUSH_NOTIFICATIONS'
  // Avancé
  | 'TOURNAMENTS'
  | 'CO2_REPORTS'
  | 'AUTOMATIONS'
  | 'ADVANCED_ANALYTICS'
  | 'AI_BRANDING'
  | 'ADVANCED_AI'
  | 'CLUB_DASHBOARD'
  // Future — déjà typées pour éviter les typos à l'implémentation
  | 'MARKETPLACE'
  | 'TICKETING'
  | 'BOUTIQUE_CLUB'
  | 'SUPPORTER_SUBSCRIPTIONS'
  | 'LOCAL_ADS'
  | 'CRM_CLUB'
  | 'CLUB_MESSAGING'
  | 'ORGANIZER_OFFERS'
  | 'PREMIUM_NOTIFICATIONS';

// ── Gates — plan minimum par feature ─────────────────────────────────────────
//
// Règle : un plan P peut utiliser une feature F si
//   PLAN_RANK[P] >= PLAN_RANK[FEATURE_GATES[F]]

export const FEATURE_GATES: Record<FeatureKey, PlanId> = {
  // PosterStudio
  POSTER_SIMPLE:             'free',
  POSTER_EXPERT:             'starter',
  POSTER_WATERMARK_REMOVE:   'starter',
  POSTER_TEMPLATES_ADVANCED: 'starter',
  POSTER_AI_BACKGROUND:      'elite',   // IA Pollinations fonds = Elite
  POSTER_AI_ELEMENTS:        'elite',   // IA Pollinations éléments = Elite
  POSTER_AI_BRANDING:        'elite',   // Claude Vision ADN visuel = Elite
  POSTER_SPONSORS_LOGOS:     'pro',     // Sponsors sur affiches = Pro

  // Covoiturage
  CARPOOLING:                'starter', // 1 équipe max (carpool_allowed_team_id)
  CARPOOLING_ALL_TEAMS:      'pro',     // toutes équipes
  CARPOOLING_AUTO_REMINDERS: 'elite',   // relances automatiques

  // Compositions & Effectif
  TEAM_LINEUPS:              'pro',
  ADVANCED_LINEUPS:          'pro',
  LINEUP_GENERATOR:          'pro',

  // Statistiques
  PLAYER_STATS:              'pro',
  TEAM_STATS:                'pro',
  ADVANCED_STATS:            'elite',

  // Communication & Feed
  FEATURED_EVENTS:           'pro',     // 5/mois Pro, 15/mois Elite
  SPONSORS_FEED_CARDS:       'pro',
  SPONSORS_ON_POSTERS:       'pro',
  PUSH_NOTIFICATIONS:        'free',    // Notifications standard = gratuit

  // Avancé
  TOURNAMENTS:               'pro',
  CO2_REPORTS:               'pro',
  AUTOMATIONS:               'elite',
  ADVANCED_ANALYTICS:        'elite',
  AI_BRANDING:               'elite',
  ADVANCED_AI:               'elite',
  CLUB_DASHBOARD:            'free',    // Gestion club de base = gratuit

  // Future
  MARKETPLACE:               'elite',
  TICKETING:                 'pro',
  BOUTIQUE_CLUB:             'pro',
  SUPPORTER_SUBSCRIPTIONS:   'pro',
  LOCAL_ADS:                 'pro',
  CRM_CLUB:                  'elite',
  CLUB_MESSAGING:            'elite',
  ORGANIZER_OFFERS:          'elite',
  PREMIUM_NOTIFICATIONS:     'elite',
};

// ── Quotas ────────────────────────────────────────────────────────────────────

export interface PlanQuotas {
  postersPerMonth:     number | null;  // null = illimité
  featuredEventsMax:   number;         // 0 = fonctionnalité non disponible
  featuredEventsDays:  number;
  aiGeneratesPerMonth: number | null;  // null = illimité, 0 = verrouillé
  aiImportsPerMonth:   number | null;
  carpoolingTeamsMax:  number | null;  // null = toutes équipes, 0 = verrouillé
}

export const PLAN_QUOTAS: Record<PlanId, PlanQuotas> = {
  free: {
    postersPerMonth:     3,
    featuredEventsMax:   0,
    featuredEventsDays:  0,
    aiGeneratesPerMonth: 0,
    aiImportsPerMonth:   0,
    carpoolingTeamsMax:  0,
  },
  starter: {
    postersPerMonth:     null,
    featuredEventsMax:   0,
    featuredEventsDays:  0,
    aiGeneratesPerMonth: 10,
    aiImportsPerMonth:   10,
    carpoolingTeamsMax:  1,
  },
  pro: {
    postersPerMonth:     null,
    featuredEventsMax:   5,
    featuredEventsDays:  30,
    aiGeneratesPerMonth: 0,    // IA réservée Elite
    aiImportsPerMonth:   0,
    carpoolingTeamsMax:  null,
  },
  elite: {
    postersPerMonth:     null,
    featuredEventsMax:   15,
    featuredEventsDays:  60,
    aiGeneratesPerMonth: null,
    aiImportsPerMonth:   null,
    carpoolingTeamsMax:  null,
  },
};
