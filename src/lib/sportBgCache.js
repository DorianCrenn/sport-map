// ── Cache des fonds IA sport — localStorage, TTL 7 jours ─────────────────────
// Clés : sl-sport-bg-{sport}  |  Valeur : { imageUrl, ts }
// Utilisé par WeekendPosters, PosterStudio (et tout futur composant qui affiche
// une affiche liée à un sport).

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 jours

// ── Normalisation ─────────────────────────────────────────────────────────────

export function normalizeSport(sport) {
  const s = (sport || '').toLowerCase();
  if (s.includes('foot') || s.includes('soccer')) return 'football';
  if (s.includes('basket'))    return 'basket';
  if (s.includes('hand'))      return 'handball';
  if (s.includes('volley'))    return 'volleyball';
  if (s.includes('tennis'))    return 'tennis';
  if (s.includes('rugby'))     return 'rugby';
  if (s.includes('padel'))     return 'padel';
  if (s.includes('squash'))    return 'squash';
  if (s.includes('badminton')) return 'badminton';
  return 'default';
}

// ── Prompts Pollinations.ai (vertical portrait, sans personnes ni logos) ──────

export const SPORT_BG_PROMPTS = {
  football:   'vibrant green football grass close-up, stadium floodlights bokeh, electric match atmosphere, lush field texture',
  basket:     'basketball court hardwood parquet texture, arena neon spotlights, orange energy, dynamic vibrant colors',
  handball:   'handball parquet court blue lines detail, sports hall dramatic lighting, vibrant blue and orange',
  volleyball: 'beach volleyball golden sand court, sunset orange sky, ocean blues, summer vibrant energy',
  tennis:     'clay tennis court deep orange-red texture, Roland Garros atmosphere, vibrant court lines detail',
  rugby:      'green rugby field grass close-up, dramatic storm sky, vibrant stadium floodlights, intense atmosphere',
  padel:      'padel court glass walls blue artificial turf, modern neon arena lighting, vibrant colors',
  squash:     'squash court orange walls glass detail, dramatic arena lighting, vibrant colors',
  badminton:  'badminton court colorful lines, sports hall bright lighting, vibrant energy shuttlecock',
  default:    'sports arena dramatic colorful lighting, vibrant energy, athletic stadium atmosphere at night',
};

// ── Lecture / écriture cache ──────────────────────────────────────────────────

export function getBgCache(sport) {
  try {
    const raw = localStorage.getItem(`sl-sport-bg-${sport}`);
    if (!raw) return null;
    const { imageUrl, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(`sl-sport-bg-${sport}`);
      return null;
    }
    return imageUrl || null;
  } catch {
    return null;
  }
}

export function setBgCache(sport, imageUrl) {
  try {
    localStorage.setItem(`sl-sport-bg-${sport}`, JSON.stringify({ imageUrl, ts: Date.now() }));
  } catch {
    // localStorage plein — silencieux
  }
}

// ── Helper haut-niveau : retourne le cache ou génère + cache (async) ──────────

export async function getOrGenerateBg(sport, generateFn) {
  const key = normalizeSport(sport);
  const cached = getBgCache(key);
  if (cached) return cached;
  const prompt = SPORT_BG_PROMPTS[key] ?? SPORT_BG_PROMPTS.default;
  try {
    const { imageUrl } = await generateFn(prompt);
    if (imageUrl) setBgCache(key, imageUrl);
    return imageUrl || null;
  } catch {
    return null;
  }
}
