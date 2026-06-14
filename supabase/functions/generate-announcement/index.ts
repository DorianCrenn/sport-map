/**
 * Edge Function : generate-announcement
 * Génère 3 suggestions de message d'annonce via Claude Haiku.
 *
 * POST /functions/v1/generate-announcement
 * Body: { clubName: string, type: string, context?: string }
 * Returns: { suggestions: string[] }
 *
 * Secrets required:
 *   ANTHROPIC_API_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TYPE_LABELS: Record<string, string> = {
  urgent: 'annonce urgente (annulation, changement)',
  info: 'information pratique',
  result: 'résultat de match',
  event: 'événement à venir',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── Auth guard : doit être un utilisateur authentifié avec rôle club_admin ou admin ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentification requise' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey    = Deno.env.get('SUPABASE_ANON_KEY')!;
    const caller     = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await caller.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Vérifier que l'utilisateur a un rôle autorisé
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['club_admin', 'admin', 'superadmin'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Accès réservé aux gestionnaires de club' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json() as {
      clubName?: string;
      type?: string;
      context?: string;
    };

    // Sanitise inputs — strip control chars, limit length to prevent prompt injection
    function sanitize(s: unknown, maxLen: number): string {
      if (typeof s !== 'string') return '';
      return s.replace(/[\x00-\x1F\x7F]/g, ' ').trim().slice(0, maxLen);
    }
    const clubName = sanitize(rawBody.clubName, 100);
    const context  = sanitize(rawBody.context,  500);
    // type must be a known key
    const type = typeof rawBody.type === 'string' && rawBody.type in TYPE_LABELS
      ? rawBody.type
      : 'info';

    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const typeLabel = TYPE_LABELS[type] ?? 'information';
    const contextLine = context ? `\nContexte supplémentaire : ${context}` : '';

    const safeName = clubName || 'Mon Club';
    const prompt = `Tu es l'assistant d'un club sportif français. Génère exactement 3 messages d'annonce de type "${typeLabel}" pour le club "${safeName}". Les messages doivent être :
- Courts (1 à 3 phrases max, environ 50-100 mots)
- En français, ton convivial et direct
- Variés (un formel, un chaleureux, un dynamique)
- Prêts à être envoyés tels quels${contextLine}

Retourne UNIQUEMENT un tableau JSON de 3 strings, sans markdown ni texte autour. Exemple: ["message1","message2","message3"]`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${errText}` }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await res.json() as { content: { text: string }[] };
    const raw = data.content?.[0]?.text?.trim() ?? '[]';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let suggestions: string[];
    try {
      const parsed = JSON.parse(cleaned);
      suggestions = Array.isArray(parsed)
        ? parsed.filter((s): s is string => typeof s === 'string').slice(0, 3)
        : [];
    } catch {
      suggestions = [];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
