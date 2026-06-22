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

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkClubAIPlan } from '../_shared/checkClubAIPlan.ts';
import { corsHeaders, handleOptions, checkCsrfOrigin } from '../_shared/cors.ts';

async function checkRateLimit(
  client: SupabaseClient,
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const key       = `${endpoint}:${userId}`;
  const windowAgo = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count, error } = await client
    .from('api_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowAgo);
  if (error) return false;
  if ((count ?? 0) >= maxRequests) return true;
  await client.from('api_rate_limits').insert({ key, endpoint });
  return false;
}

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
  const prelight = handleOptions(req); if (prelight) return prelight;
  const ch = corsHeaders(req);

  try {
    // ── Auth + rate limiting ──────────────────────────────────────────────────
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let userId = 'anonymous';
    if (token) {
      const anonClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
      const { data: { user } } = await anonClient.auth.getUser(token);
      if (user) userId = user.id;
    }

    // 10 generations per hour per user
    const limited = await checkRateLimit(serviceClient, userId, 'generate-variant-bg', 10, 3600);
    if (limited) {
      return new Response(JSON.stringify({ error: 'Trop de générations. Réessayez dans une heure.' }), {
        status: 429, headers: { ...ch, 'Content-Type': 'application/json' },
      });
    }

    const { style, mood, sport, accentColor, clubId } = await req.json();

    // ── Vérification plan club (POSTER_AI_BACKGROUND = Elite requis) ─────────
    // clubId est optionnel pour la rétro-compat — si absent, résolution via profil user
    const resolvedUserId = userId !== 'anonymous' ? userId : null;
    const planCheck = await checkClubAIPlan(serviceClient, clubId ?? null, resolvedUserId);
    if (!planCheck.allowed) {
      return new Response(
        JSON.stringify({ error: planCheck.reason, plan: planCheck.plan }),
        { status: 403, headers: { ...ch, 'Content-Type': 'application/json' } },
      );
    }

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
          { status: response.status, headers: { ...ch, 'Content-Type': 'application/json' } },
        );
      }

      // ── AI-COST-001d: Monthly cost monitoring ─────────────────────────────
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      // @ts-ignore — Deno global available at runtime in Edge Functions
      const FAL_MONTHLY_LIMIT = parseInt(Deno.env.get('FAL_MONTHLY_LIMIT') ?? '200', 10);
      const { count: monthlyCount } = await serviceClient
        .from('api_rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('endpoint', 'generate-variant-bg')
        .gte('created_at', monthStart);
      const usagePct = ((monthlyCount ?? 0) / FAL_MONTHLY_LIMIT) * 100;
      if (usagePct >= 80) {
        console.warn(`[AI-COST-001d] Fal.ai usage at ${Math.round(usagePct)}% of monthly limit (${monthlyCount}/${FAL_MONTHLY_LIMIT})`);
      }

      const result = await response.json();
      const imageUrl = result.images?.[0]?.url ?? null;
      return new Response(
        JSON.stringify({ imageUrl, prompt, provider: 'fal', monthlyUsage: monthlyCount ?? 0, monthlyLimit: FAL_MONTHLY_LIMIT }),
        { headers: { ...ch, 'Content-Type': 'application/json' } },
      );
    }

    // ── Pollinations.ai (free fallback — no key required) ────────────────────
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;

    return new Response(
      JSON.stringify({ imageUrl, prompt, provider: 'pollinations' }),
      { headers: { ...ch, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...ch, 'Content-Type': 'application/json' } },
    );
  }
});
