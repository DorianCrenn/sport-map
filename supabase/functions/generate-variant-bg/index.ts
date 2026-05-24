/**
 * Edge Function : generate-variant-bg  (PS-VAR-004)
 * Generates a sports poster background image using Fal.ai Flux-schnell.
 *
 * POST /functions/v1/generate-variant-bg
 * Body: { style: string, mood: string[], sport?: string, accentColor?: string }
 * Returns: { imageUrl: string, prompt: string }
 *          { error: string, mockFallback: true } — if FAL_API_KEY not configured
 *
 * Secrets required:
 *   FAL_API_KEY — from https://fal.ai/dashboard/keys
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_PROMPTS: Record<string, string> = {
  premium:    'luxury sports stadium, gold bokeh lighting, elegant dark atmosphere, cinematic depth of field, professional sports photography, award ceremony ambiance',
  bold:       'dynamic explosive sports action background, dramatic lighting, bold saturated colors, high energy, motion blur trails, powerful atmosphere',
  cinematic:  'dark moody stadium atmosphere, volumetric fog and smoke, dramatic spotlights, film noir sports venue, cinematic widescreen',
  minimalist: 'clean minimal sports background, soft white gradients, subtle geometric lines, modern editorial photography, airy open space',
  street:     'urban street sports background, graffiti wall texture, concrete city environment, vibrant street art colors, raw energy',
  esport:     'cyberpunk esports arena, neon light rings, holographic HUD elements, electric blue and purple glow, futuristic gaming stadium',
  classic:    'classic sports stadium at golden hour, natural grass field, traditional athletic environment, warm ambient lighting',
};

const SPORT_CONTEXT: Record<string, string> = {
  football:   'football pitch, green grass, goal posts visible in background',
  basket:     'basketball court hardwood floor, three-point arc, overhead arena lights',
  tennis:     'tennis court clay or grass surface, net in background',
  handball:   'indoor handball court, synthetic floor, arena overhead lights',
  volleyball:  'volleyball court net, arena sports hall',
  rugby:      'rugby pitch, H-shaped goalposts, grass field',
  padel:      'padel court glass walls, indoor arena',
  badminton:  'badminton court, net, indoor sports hall',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { style, mood, sport, accentColor } = await req.json();
    const FAL_KEY = Deno.env.get('FAL_API_KEY');

    const stylePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.classic;
    const sportCtx = SPORT_CONTEXT[(sport ?? '').toLowerCase()] ?? 'sports arena venue';
    const moodStr = Array.isArray(mood) && mood.length > 0 ? mood.join(', ') : '';
    const colorCtx = accentColor ? `dominant color palette: ${accentColor} tones` : '';

    const prompt = [stylePrompt, sportCtx, moodStr, colorCtx,
      'high quality 4k photography, sports poster background, no text, no people, no logos',
    ].filter(Boolean).join(', ');

    // ── Fal.ai Flux (production) ──────────────────────────────────────────────
    if (FAL_KEY) {
      const response = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, image_size: 'portrait_4_3', num_images: 1, num_inference_steps: 4, enable_safety_checker: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({ error: `Fal.ai: ${errorText}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const result = await response.json();
      const imageUrl = result.images?.[0]?.url ?? null;
      return new Response(
        JSON.stringify({ imageUrl, prompt, provider: 'fal' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Pollinations.ai (free fallback — no key required) ────────────────────
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;

    return new Response(
      JSON.stringify({ imageUrl, prompt, provider: 'pollinations' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
