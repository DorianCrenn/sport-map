// PS-VAR-001→006 — Parametric + AI variant generation from DA profile
// Parametric: local (template + color + bg preset + overlays)
// AI backgrounds: Fal.ai Flux via generate-variant-bg Edge Function (PS-VAR-004)

// ── PS-VAR-002 — Style → BG presets ───────────────────────────────────────────

const STYLE_TO_PRESETS = {
  premium:    ['gold-rush', 'trophy-room', 'noir-luxe', 'golden-hour'],
  bold:       ['power-surge', 'raw-power', 'voltage', 'abstract-force'],
  cinematic:  ['smoke-lights', 'light-streams', 'stadium-night', 'noir-luxe'],
  minimalist: ['frosted-arena', 'blue-steel', 'chrome-rush', ''],
  street:     ['concrete-jungle', 'ignite', 'raw-power', 'abstract-force'],
  esport:     ['cyber-grid', 'neon-pulse', 'voltage', 'prism'],
  classic:    ['stadium-night', 'blue-steel', 'carbon-fiber', 'chrome-rush'],
};

// ── PS-VAR-003 — Style → overlay combinations ─────────────────────────────────

const STYLE_TO_OVERLAYS = {
  premium:    [['stars', 'sparks'], ['stars'], ['sparks'], []],
  bold:       [['lightning', 'fire'], ['shards', 'speed'], ['lightning'], ['fire']],
  cinematic:  [['smoke'], ['smoke', 'tear'], ['tear'], []],
  minimalist: [[], [], ['stars'], []],
  street:     [['shards', 'speed'], ['cracks', 'shards'], ['speed'], ['cracks']],
  esport:     [['lightning', 'sparks'], ['shards', 'lightning'], ['smoke', 'lightning'], ['sparks']],
  classic:    [[], ['stars'], ['ball-foot'], []],
};

// ── Seeded pseudo-random ───────────────────────────────────────────────────────

function seededRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── PS-VAR-001 — Main variant generator ───────────────────────────────────────

/**
 * @param {object} daProfile  - from useClubDNA
 * @param {object} baseState  - current poster state (spread as base)
 * @param {Array}  templateList - POSTER_TEMPLATES array from PosterRenderer
 * @param {number} count       - how many variants to produce (default 8)
 * @param {number} seed        - random seed (increment to "reroll")
 * @returns {Array<{variantId, label, templateId, accentColor, state}>}
 */
export function generateVariants(daProfile, baseState, templateList, count = 8, seed = 0) {
  if (!daProfile || !templateList?.length) return [];

  const rng = seededRng(seed + 1);
  const style = daProfile.style || 'classic';

  // 1. Filter templates to affinities — templateList is already pre-filtered by caller
  const affinities = daProfile.templateAffinities || [];
  let candidates = affinities.length
    ? templateList.filter(t => affinities.some(a => t.id.includes(a)))
    : [];
  if (candidates.length < 3) candidates = [...templateList];
  if (!candidates.length) return [];
  candidates = seededShuffle(candidates, rng);

  // 2. Color sequence from palette (cycle through)
  const palette = (daProfile.palette?.length ? daProfile.palette : [daProfile.colors?.accent || '#8b5cf6']);
  const shuffledColors = seededShuffle(palette, rng);

  // 3. BG presets for this style
  const bgPresets = seededShuffle(STYLE_TO_PRESETS[style] || STYLE_TO_PRESETS.classic, rng);

  // 4. Overlay combos
  const overlayCombos = seededShuffle(STYLE_TO_OVERLAYS[style] || [[]], rng);

  const variants = [];
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
      variantId: `v-${seed}-${i}`,
      label: tpl.label,
      templateId: tpl.id,
      accentColor: accent,
      tplColor: tpl.color,
      state: {
        ...baseState,
        templateId: tpl.id,
        accentColor: accent,
        bgPreset,
        overlayElements,
      },
    });
  }

  return variants;
}

// ── Image preload helper (90s timeout) ───────────────────────────────────────

function preloadImage(url) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 90_000);
    const img = new Image();
    img.onload  = () => { clearTimeout(timer); resolve(); };
    img.onerror = () => { clearTimeout(timer); resolve(); };
    img.src = url;
  });
}

// ── PS-VAR-007 — Custom prompt → Pollinations.ai (direct, no edge fn) ────────

export const BG_PROMPT_SUGGESTIONS = [
  'Stade plein sous les projecteurs',
  'Terrain de football la nuit',
  'Vestiaires dramatiques',
  'Fumée et lumières colorées',
  'Ville vue du ciel au crépuscule',
  'Abstrait énergie sportive',
];

export async function generateCustomBackground(userPrompt) {
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

// ── PS-VAR-009 — Full match poster from match data + style hint ───────────────

export const POSTER_STYLE_SUGGESTIONS = [
  'Sombre et dramatique',
  'Chaud et festif',
  'Minimaliste épuré',
  'Cinématique intense',
  'Style vintage',
  'Néon futuriste',
  'Photo sportive',
  'Abstrait coloré',
];

export async function generateMatchPoster({ sport, homeTeam, awayTeam, championship, venue, isTournament, title }, userHint) {
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

// ── PS-VAR-008 — Custom element prompt → Pollinations.ai (screen blend) ──────

export const ELEMENT_PROMPT_SUGGESTIONS = [
  'Confettis colorés',
  'Éclairs électriques',
  'Fumée dramatique',
  'Pluie de lumières',
  'Feu d\'artifice',
  'Particules dorées',
  'Étincelles',
  'Néons flottants',
];

export async function generateCustomElement(userPrompt) {
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

// ── PS-VAR-004/005 — AI background generation via Fal.ai Flux ────────────────

/**
 * Generates 1 AI background image for a variant using the Fal.ai Flux Edge Function.
 * Falls back gracefully if FAL_API_KEY is not configured (returns null imageUrl).
 *
 * @param {object} daProfile  — from useClubDNA
 * @param {string} sport      — event sport string
 * @param {import('../lib/supabase.js').supabase} supabaseClient
 * @returns {Promise<{imageUrl: string|null, prompt: string, apiMode: boolean}>}
 */
export async function generateAIBackground(daProfile, sport, supabaseClient, clubId = null) {
  try {
    const { data, error } = await supabaseClient.functions.invoke('generate-variant-bg', {
      body: {
        style: daProfile.style,
        mood: daProfile.mood ?? [],
        sport: sport ?? '',
        accentColor: daProfile.colors?.accent ?? null,
        clubId: clubId ?? undefined,
      },
    });
    if (error || data?.mockFallback || !data?.imageUrl) {
      return { imageUrl: null, prompt: '', apiMode: false, provider: null };
    }
    // Pre-load image so CSS background-image has it in cache when applied
    if (!data.imageUrl.startsWith('data:')) {
      await preloadImage(data.imageUrl);
    }
    return { imageUrl: data.imageUrl, prompt: data.prompt ?? '', apiMode: true, provider: data.provider ?? 'fal' };
  } catch {
    return { imageUrl: null, prompt: '', apiMode: false };
  }
}
