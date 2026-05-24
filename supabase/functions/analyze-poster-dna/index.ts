/**
 * Edge Function : analyze-poster-dna  (PS-DNA-001→005)
 * Analyzes a sports poster using Claude Vision to extract the club's visual identity.
 *
 * POST /functions/v1/analyze-poster-dna
 * Body: { imageBase64: string, clubId?: string }
 * Returns: DA profile JSON (colors, palette, style, mood, templateAffinities…)
 *          { error: string, mockFallback: true } — if ANTHROPIC_API_KEY not configured
 *
 * Secrets required:
 *   ANTHROPIC_API_KEY          — from https://console.anthropic.com
 *   SUPABASE_URL               (auto-injected)
 *   SUPABASE_SERVICE_ROLE_KEY  (auto-injected)
 */

import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  · premium = tons chauds/or/élégant/luxe
  · bold = très contrasté/dynamique/puissant
  · cinematic = sombre/dramatique/film noir
  · minimalist = épuré/beaucoup de blanc/très peu d'éléments
  · street = urbain/graffiti/énergie brute
  · esport = néon/tech/gaming/futuriste
  · classic = sobre/professionnel/traditionnel
- styleLabel: 2-3 mots descriptifs séparés par "·"
- mood: 2-4 mots EN FRANÇAIS en minuscules
- templateAffinities: 3-5 IDs parmi: simple, light, color, editorial, impact, luxe, blanc, elegant, magazine, neon, fluo, cinema, retro, vivid, bento, prestige, pulse, strike, glass, aurora
- confidence: entre 0.70 et 0.97`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageBase64, clubId } = await req.json();
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured', mockFallback: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const base64Data = imageBase64.replace(/^data:image\/[\w+]+;base64,/, '');
    const mediaType: 'image/jpeg' | 'image/png' | 'image/webp' =
      imageBase64.startsWith('data:image/png') ? 'image/png' :
      imageBase64.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';

    const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

    // PS-DNA-001/002 — Claude Haiku Vision call
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: DNA_PROMPT },
        ],
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const profile: Record<string, unknown> = JSON.parse(cleaned);

    // PS-DNA-003 — enrich with computed metrics
    const accentHex = profile.colors && typeof (profile.colors as Record<string,string>).accent === 'string'
      ? (profile.colors as Record<string,string>).accent : '#8b5cf6';
    const r = parseInt(accentHex.slice(1, 3), 16);
    const g = parseInt(accentHex.slice(3, 5), 16);
    const b = parseInt(accentHex.slice(5, 7), 16);
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const colorTemp = (r - b) / 255;

    const result = {
      ...profile,
      computed: { luminosity: Math.round(luminosity * 100) / 100, colorTemp: Math.round(colorTemp * 100) / 100 },
      analysedAt: new Date().toISOString(),
      confidence: typeof profile.confidence === 'number' ? profile.confidence : 0.85,
      mockMode: false,
    };

    // PS-DNA-004/005 — upsert + log (best-effort, never block the response)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      // Extract user_id from JWT (Authorization header)
      const authHeader = req.headers.get('Authorization') ?? '';
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      const userId = user?.id ?? null;

      if (clubId && userId) {
        await supabase.from('club_brand_kits').upsert(
          { club_id: clubId, da_profile: result },
          { onConflict: 'club_id' },
        );
      }
      if (userId) {
        await supabase.from('ai_jobs').insert({
          type: 'dna',
          user_id: userId,
          club_id: clubId ?? null,
          status: 'done',
          priority: 5,
          output_data: { style: profile.style, confidence: result.confidence },
        });
      }
    } catch (_logErr) {
      // Logging failure must not break the response
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
