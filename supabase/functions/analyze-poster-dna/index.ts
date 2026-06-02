/**
 * Edge Function : analyze-poster-dna  (PS-DNA-001→005)
 * Analyzes a sports poster using Claude Vision to extract the club's visual identity.
 * Uses Anthropic API directly via fetch (no SDK dependency).
 *
 * POST /functions/v1/analyze-poster-dna
 * Body: { imageBase64: string, clubId?: string }
 *
 * Secrets required:
 *   ANTHROPIC_API_KEY  — from https://console.anthropic.com
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkClubAIPlan } from '../_shared/checkClubAIPlan.ts';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DNA_PROMPT = `Analyse cette affiche sportive et retourne UNIQUEMENT un objet JSON (sans markdown, sans texte avant ou après) avec cette structure exacte:
{
  "colors": {
    "dominant": "#rrggbb",
    "secondary": "#rrggbb",
    "accent": "#rrggbb",
    "background": "#rrggbb",
    "text": "#rrggbb"
  },
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "style": "premium",
  "styleLabel": "Premium · Or",
  "mood": ["elegant", "officiel"],
  "templateAffinities": ["luxe", "prestige", "editorial"],
  "typography": { "weight": "bold", "tracking": "tight" },
  "elements": { "hasGradients": true, "hasGlow": false, "hasGold": true },
  "confidence": 0.88
}

Règles strictes:
- palette: exactement 5 couleurs hex dominantes, de la plus fréquente à la moins fréquente
- style: UN SEUL parmi: premium | bold | cinematic | minimalist | street | esport | classic
- styleLabel: 2-3 mots descriptifs séparés par "·"
- mood: 2-4 mots EN FRANÇAIS en minuscules
- templateAffinities: 3-5 IDs parmi: simple, light, color, editorial, impact, luxe, blanc, elegant, magazine, neon, fluo, cinema, retro, vivid, bento, prestige, pulse, strike, glass, aurora
- confidence: entre 0.70 et 0.97`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── Auth check — requis (coût Claude Vision ~$0.003/image) ───────────────
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Rate limit : 5 analyses DNA / heure / utilisateur ────────────────────
    const limited = await checkRateLimit(serviceClient, user.id, 'analyze-poster-dna', 5, 3600);
    if (limited) {
      return new Response(
        JSON.stringify({ error: 'Trop d\'analyses. Réessayez dans une heure. (max 5/h)' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { imageBase64, clubId } = await req.json();

    // ── Vérification plan club (POSTER_AI_BRANDING = Elite requis) ───────────
    const planCheck = await checkClubAIPlan(serviceClient, clubId, user.id);
    if (!planCheck.allowed) {
      return new Response(
        JSON.stringify({ error: planCheck.reason, plan: planCheck.plan }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured', mockFallback: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const base64Data = imageBase64.replace(/^data:image\/[\w+]+;base64,/, '');
    const mediaType = imageBase64.startsWith('data:image/png') ? 'image/png'
      : imageBase64.startsWith('data:image/webp') ? 'image/webp'
      : 'image/jpeg';

    // Call Anthropic API directly via fetch — no SDK needed
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
            { type: 'text', text: DNA_PROMPT },
          ],
        }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API: ${errText}` }),
        { status: anthropicRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const anthropicData = await anthropicRes.json();
    const text: string = anthropicData.content?.[0]?.text?.trim() ?? '';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const profile = JSON.parse(cleaned);

    // Enrich with computed metrics
    const accentHex: string = profile?.colors?.accent ?? '#8b5cf6';
    const r = parseInt(accentHex.slice(1, 3), 16);
    const g = parseInt(accentHex.slice(3, 5), 16);
    const b = parseInt(accentHex.slice(5, 7), 16);
    const luminosity = Math.round(((0.299 * r + 0.587 * g + 0.114 * b) / 255) * 100) / 100;
    const colorTemp  = Math.round(((r - b) / 255) * 100) / 100;

    const result = {
      ...profile,
      computed: { luminosity, colorTemp },
      analysedAt: new Date().toISOString(),
      confidence: typeof profile.confidence === 'number' ? profile.confidence : 0.85,
      mockMode: false,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
