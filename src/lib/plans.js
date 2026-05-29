// Stripe plan preparation — no payment integration, just feature gates

export const PLAN_TIERS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    color: 'var(--sl-t3)',
    badge: '⚪',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 4.99,
    color: '#3b82f6',
    badge: '🔵',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    color: '#8b5cf6',
    badge: '🟣',
  },
  federation: {
    id: 'federation',
    name: 'Fédération',
    price: 29.99,
    color: '#f59e0b',
    badge: '🟡',
  },
};

export const PLAN_FEATURES = {
  // Club management
  create_club:          ['starter', 'pro', 'federation'],
  multiple_clubs:       ['pro', 'federation'],
  club_analytics:       ['pro', 'federation'],
  export_members:       ['federation'],
  // Events
  unlimited_events:     ['pro', 'federation'],
  event_push_notif:     ['starter', 'pro', 'federation'],
  // PosterStudio AI
  poster_ai_generate:   ['pro', 'federation'],
  poster_templates:     ['starter', 'pro', 'federation'],
  // Profile
  remove_ads:           ['starter', 'pro', 'federation'],
  priority_support:     ['pro', 'federation'],
};

const PLAN_ORDER = ['free', 'starter', 'pro', 'federation'];

export function canUse(feature, plan = 'free') {
  const allowed = PLAN_FEATURES[feature];
  if (!allowed) {
    if (import.meta.env.DEV) console.warn(`[Plans] Feature inconnue : "${feature}" — accès refusé par défaut`);
    return false;
  }
  return allowed.includes(plan);
}

export function isUpgradeable(plan = 'free') {
  return plan !== 'federation';
}

export function nextPlan(plan = 'free') {
  const idx = PLAN_ORDER.indexOf(plan);
  return idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null;
}
