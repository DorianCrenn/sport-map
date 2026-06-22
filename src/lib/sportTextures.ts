export interface SportPattern {
  backgroundImage: string;
  backgroundSize?: string;
}

const PATTERNS: Record<string, SportPattern> = {
  football: {
    backgroundImage:
      'repeating-linear-gradient(135deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 1px, transparent 1px, transparent 18px)',
  },
  basket: {
    backgroundImage: [
      'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 16px)',
      'repeating-linear-gradient(0deg,  rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 16px)',
    ].join(', '),
  },
  tennis: {
    backgroundImage:
      'radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)',
    backgroundSize: '9px 9px',
  },
  rugby: {
    backgroundImage:
      'repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 2px, transparent 2px, transparent 14px)',
  },
  natation: {
    backgroundImage:
      'repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 10px)',
  },
  cyclisme: {
    backgroundImage:
      'repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 8px)',
  },
  athletisme: {
    backgroundImage:
      'repeating-linear-gradient(120deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 22px)',
  },
  judo: {
    backgroundImage: [
      'repeating-linear-gradient(0deg,  rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 12px)',
      'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 12px)',
    ].join(', '),
  },
  volley: {
    backgroundImage:
      'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 14px)',
  },
  hand: {
    backgroundImage:
      'repeating-linear-gradient(60deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 16px)',
  },
};

// Lowercase fragment → pattern key
const SPORT_MAP: [string, keyof typeof PATTERNS][] = [
  ['football', 'football'],
  ['futsal',   'football'],
  ['foot',     'football'],
  ['soccer',   'football'],
  ['basket',   'basket'],
  ['tennis',   'tennis'],
  ['ping',     'tennis'],
  ['squash',   'tennis'],
  ['rugby',    'rugby'],
  ['natation', 'natation'],
  ['nage',     'natation'],
  ['water',    'natation'],
  ['cycl',     'cyclisme'],
  ['vélo',     'cyclisme'],
  ['velo',     'cyclisme'],
  ['athl',     'athletisme'],
  ['judo',     'judo'],
  ['karat',    'judo'],
  ['lutte',    'judo'],
  ['aïkido',   'judo'],
  ['aikido',   'judo'],
  ['jiu',      'judo'],
  ['volley',   'volley'],
  ['hand',     'hand'],
];

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function getSportPattern(sport: string | undefined | null): SportPattern | null {
  if (!sport) return null;
  const key = normalize(sport);
  for (const [fragment, patternKey] of SPORT_MAP) {
    if (key.includes(normalize(fragment))) return PATTERNS[patternKey] ?? null;
  }
  return null;
}
