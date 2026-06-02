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
    const { clubName, type, context } = await req.json() as {
      clubName?: string;
      type?: string;
      context?: string;
    };

    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const typeLabel = TYPE_LABELS[type ?? 'info'] ?? 'information';
    const contextLine = context?.trim() ? `\nContexte supplémentaire : ${context.trim()}` : '';

    const prompt = `Tu es l'assistant d'un club sportif français nommé "${clubName || 'Mon Club'}". Génère exactement 3 messages d'annonce de type "${typeLabel}" pour les membres du club. Les messages doivent être :
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
    const suggestions: string[] = JSON.parse(cleaned);

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
