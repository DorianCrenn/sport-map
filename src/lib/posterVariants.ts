import type { PosterState } from '../types/sportlink.js';
import type { SupabaseClient } from '@supabase/supabase-js';

const STYLE_TO_PRESETS: Record<string, string[]> = {
  premium:    ['gold-rush', 'trophy-room', 'noir-luxe', 'golden-hour'],
  bold:       ['power-surge', 'raw-power', 'voltage', 'abstract-force'],
  cinematic:  ['smoke-lights', 'light-streams', 'stadium-night', 'noir-luxe'],
  minimalist: ['frosted-arena', 'blue-steel', 'chrome-rush', ''],
  street:     ['concrete-jungle', 'ignite', 'raw-power', 'abstract-force'],
  esport:     ['cyber-grid', 'neon-pulse', 'voltage', 'prism'],
  classic:    ['stadium-night', 'blue-steel', 'carbon-fiber', 'chrome-rush'],
};

const STYLE_TO_OVERLAYS: Record<string, string[][]> = {
  premium:    [['stars', 'sparks'], ['stars'], ['sparks'], []],
  bold:       [['lightning', 'fire'], ['shards', 'speed'], ['lightning'], ['fire']],
  cinematic:  [['smoke'], ['smoke', 'tear'], ['tear'], []],
  minimalist: [[], [], ['stars'], []],
  street:     [['shards', 'speed'], ['cracks', 'shards'], ['speed'], ['cracks']],
  esport:     [['lightning', 'sparks'], ['shards', 'lightning'], ['smoke', 'lightning'], ['sparks']],
  classic:    [[], ['stars'], ['ball-foot'], []],
};

function seededRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface PosterTemplate {
  id: string;
  label: string;
  color?: string;
  [key: string]: unknown;
}

export interface DAProfile {
  style?: string;
  mood?: string[];
  templateAffinities?: string[];
  palette?: string[];
  colors?: { accent?: string };
  [key: string]: unknown;
}

export interface PosterVariant {
  variantId: string;
  label: string;
  templateId: string;
  accentColor: string;
  tplColor?: string;
  state: Partial<PosterState>;
}

export function generateVariants(
  daProfile: DAProfile | null | undefined,
  baseState: Partial<PosterState>,
  templateList: PosterTemplate[],
  count = 8,
  seed = 0,
): PosterVariant[] {
  if (!daProfile || !templateList?.length) return [];

  const rng = seededRng(seed + 1);
  const style = daProfile.style || 'classic';

  const affinities = daProfile.templateAffinities ?? [];
  let candidates = affinities.length
    ? templateList.filter(t => affinities.some(a => t.id.includes(a)))
    : [];
  if (candidates.length < 3) candidates = [...templateList];
  if (!candidates.length) return [];
  candidates = seededShuffle(candidates, rng);

  const palette = daProfile.palette?.length ? daProfile.palette : [daProfile.colors?.accent || '#8b5cf6'];
  const shuffledColors = seededShuffle(palette, rng);
  const bgPresets = seededShuffle(STYLE_TO_PRESETS[style] ?? STYLE_TO_PRESETS.classic, rng);
  const overlayCombos = seededShuffle(STYLE_TO_OVERLAYS[style] ?? [[]], rng);

  const variants: PosterVariant[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = candidates[i % candidates.length];
    const accent = shuffledColors[i % shuffledColors.length];
    const bgPreset = bgPresets[i % bgPresets.length] ?? '';
    const overlayTypes = overlayCombos[i % overlayCombos.length] ?? [];

    const overlayElements = overlayTypes.map((type, idx) => ({
      uid: `var-${i}-${idx}`,
      type,
      color: accent,
      opacity: 0.65,
      above: idx % 2 === 0,
    }));

    variants.push({
      variantId:   `v-${seed}-${i}`,
      label:       tpl.label,
      templateId:  tpl.id,
      accentColor: accent,
      tplColor:    tpl.color,
      state: { ...baseState, templateId: tpl.id, accentColor: accent, bgPreset, overlayElements: overlayElements as any[] },
    });
  }
  return variants;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 90_000);
    const img = new Image();
    img.onload  = () => { clearTimeout(timer); resolve(); };
    img.onerror = () => { clearTimeout(timer); resolve(); };
    img.src = url;
  });
}

export const BG_PROMPT_SUGGESTIONS: string[] = [
  'Stade plein sous les projecteurs',
  'Terrain de football la nuit',
  'Vestiaires dramatiques',
  'Fumée et lumières colorées',
  'Ville vue du ciel au crépuscule',
  'Abstrait énergie sportive',
];

interface GenerateResult {
  imageUrl: string | null;
  prompt: string;
  provider?: string;
  error?: boolean;
}

export async function generateCustomBackground(userPrompt: string): Promise<GenerateResult> {
  const fullPrompt = `vertical portrait composition, tall format, ${userPrompt}, sports poster background, high quality 4k photography, no text, no people, no logos`;
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=576&height=1024&model=flux&nologo=true&seed=${seed}`;
  try {
    await preloadImage(url);
    return { imageUrl: url, prompt: fullPrompt, provider: 'pollinations' };
  } catch {
    return { imageUrl: null, prompt: fullPrompt, provider: 'pollinations', error: true };
  }
}

export const POSTER_STYLE_SUGGESTIONS: string[] = [
  'Sombre et dramatique', 'Chaud et festif', 'Minimaliste épuré',
  'Cinématique intense', 'Style vintage', 'Néon futuriste',
  'Photo sportive', 'Abstrait coloré',
];

interface MatchPosterInput {
  sport?: string;
  homeTeam?: string;
  awayTeam?: string;
  championship?: string;
  venue?: string;
  isTournament?: boolean;
  title?: string;
}

export async function generateMatchPoster(
  { sport, homeTeam, awayTeam, championship, venue, isTournament, title }: MatchPosterInput,
  userHint?: string,
): Promise<GenerateResult> {
  const sportLabel = sport || 'sport';
  const home = homeTeam || '';
  const away = awayTeam || '';

  const matchPart = isTournament
    ? `${title || championship || sportLabel} tournament event`
    : `${sportLabel} match${home && away ? ` ${home} vs ${away}` : home ? ` with ${home}` : ''}`;

  const contextParts = [
    championship && !isTournament ? `competition: ${championship}` : null,
    venue ? `venue: ${venue}` : null,
  ].filter(Boolean).join(', ');

  const style = userHint?.trim() || 'dramatic sports atmosphere, dynamic, professional';

  const prompt = [
    `Professional sports poster for a ${matchPart}.`,
    contextParts ? `Context: ${contextParts}.` : '',
    `Visual style: ${style}.`,
    `Photographic quality, dramatic lighting, cinematic composition.`,
    `No text, no letters, no numbers, no words anywhere in the image.`,
    `Vertical 9:16 portrait format, full bleed.`,
  ].filter(Boolean).join(' ');

  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=576&height=1024&model=flux&nologo=true&seed=${seed}`;
  try {
    await preloadImage(url);
    return { imageUrl: url, prompt };
  } catch {
    return { imageUrl: null, prompt, error: true };
  }
}

export const ELEMENT_PROMPT_SUGGESTIONS: string[] = [
  'Confettis colorés', 'Éclairs électriques', 'Fumée dramatique',
  'Pluie de lumières', "Feu d'artifice", 'Particules dorées',
  'Étincelles', 'Néons flottants',
];

export async function generateCustomElement(userPrompt: string, accentColor?: string): Promise<GenerateResult> {
  const fullPrompt = `vertical portrait orientation, ${userPrompt}, isolated on pure black background, dramatic, vibrant, high contrast, centered composition, no people, no text, no logos, photorealistic`;
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=576&height=1024&model=flux&nologo=true&seed=${seed}`;
  try {
    await preloadImage(url);
    return { imageUrl: url, prompt: fullPrompt };
  } catch {
    return { imageUrl: null, prompt: fullPrompt, error: true };
  }
}

interface AIBackgroundResult {
  imageUrl: string | null;
  prompt: string;
  apiMode: boolean;
  provider?: string | null;
}

export async function generateAIBackground(
  daProfile: DAProfile,
  sport: string | null | undefined,
  supabaseClient: SupabaseClient,
  clubId: string | null = null,
): Promise<AIBackgroundResult> {
  try {
    const { data, error } = await supabaseClient.functions.invoke('generate-variant-bg', {
      body: {
        style:       daProfile.style,
        mood:        daProfile.mood ?? [],
        sport:       sport ?? '',
        accentColor: daProfile.colors?.accent ?? null,
        clubId:      clubId ?? undefined,
      },
    });
    const d = data as { mockFallback?: boolean; imageUrl?: string; prompt?: string; provider?: string } | null;
    if (error || d?.mockFallback || !d?.imageUrl) {
      return { imageUrl: null, prompt: '', apiMode: false, provider: null };
    }
    if (!d.imageUrl.startsWith('data:')) await preloadImage(d.imageUrl);
    return { imageUrl: d.imageUrl, prompt: d.prompt ?? '', apiMode: true, provider: d.provider ?? 'fal' };
  } catch {
    return { imageUrl: null, prompt: '', apiMode: false };
  }
}
