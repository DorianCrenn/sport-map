const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
// Incrémenter quand les prompts changent pour invalider le cache existant
const CACHE_VERSION = 2;

export function normalizeSport(sport: string | null | undefined): string {
  const s = (sport ?? '').toLowerCase();
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

export const SPORT_BG_PROMPTS: Record<string, string> = {
  football:   'soccer football pitch close-up lush green grass, white painted yard lines and center circle, round ball, stadium floodlights bokeh, electric atmosphere',
  basket:     'basketball court gleaming hardwood parquet floor, orange basketball hoop net close-up, arena neon spotlights, dynamic vibrant colors',
  handball:   'indoor handball gymnasium arena, small rectangular goals on polished parquet, ceiling floodlights, blue and orange court markings, dramatic sports hall atmosphere',
  volleyball: 'beach volleyball golden sand court close-up, net and volleyball, sunset orange sky, vibrant summer energy',
  tennis:     'clay tennis court deep orange-red texture, white court lines, Roland Garros atmosphere, dramatic shadows',
  rugby:      'rugby H-shaped goal posts on muddy green pitch, oval rugby ball close-up on wet grass, dramatic storm sky, scrum player silhouettes, intense atmosphere',
  padel:      'padel court glass walls and artificial turf, modern arena neon lighting, racket and ball detail, vibrant colors',
  squash:     'squash court orange walls glass back wall, dramatic arena spotlight, vibrant colors',
  badminton:  'badminton court bright gymnasium, shuttlecock in motion, colorful court lines, sports hall lighting',
  default:    'sports arena dramatic colorful lighting, vibrant energy, athletic stadium atmosphere at night',
};

export function getBgCache(sport: string): string | null {
  try {
    const raw = localStorage.getItem(`sl-sport-bg-v${CACHE_VERSION}-${sport}`);
    if (!raw) return null;
    const { imageUrl, ts } = JSON.parse(raw) as { imageUrl: string; ts: number };
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(`sl-sport-bg-v${CACHE_VERSION}-${sport}`);
      return null;
    }
    return imageUrl || null;
  } catch {
    return null;
  }
}

export function setBgCache(sport: string, imageUrl: string): void {
  try {
    localStorage.setItem(`sl-sport-bg-v${CACHE_VERSION}-${sport}`, JSON.stringify({ imageUrl, ts: Date.now() }));
  } catch {
    // localStorage full — silent
  }
}

export async function getOrGenerateBg(
  sport: string,
  generateFn: (prompt: string) => Promise<{ imageUrl: string | null }>,
): Promise<string | null> {
  const key = normalizeSport(sport);
  const cached = getBgCache(key);
  if (cached) return cached;
  const prompt = SPORT_BG_PROMPTS[key] ?? SPORT_BG_PROMPTS.default;
  try {
    const { imageUrl } = await generateFn(prompt);
    if (imageUrl) setBgCache(key, imageUrl);
    return imageUrl ?? null;
  } catch {
    return null;
  }
}
