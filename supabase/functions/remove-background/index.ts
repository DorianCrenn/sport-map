/**
 * Edge Function : remove-background  (PS-API-001)
 * Removes the background from a player photo using the Remove.bg API.
 *
 * POST /functions/v1/remove-background
 * Body: { imageBase64: string }   — full data-URL or raw base64
 * Returns: { resultBase64: string } — PNG with transparent background
 *          { error: string, mockFallback: true } — if API key not configured
 *
 * Secrets required (Supabase Dashboard → Edge Functions → Secrets):
 *   REMOVE_BG_API_KEY  — from https://www.remove.bg/api
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    const REMOVE_BG_KEY = Deno.env.get('REMOVE_BG_API_KEY');

    if (!REMOVE_BG_KEY) {
      return new Response(
        JSON.stringify({ error: 'REMOVE_BG_API_KEY not configured', mockFallback: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binary = Uint8Array.from(atob(base64Data), (c: string) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image_file', blob, 'image.jpg');
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': REMOVE_BG_KEY },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Remove.bg: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const resultBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return new Response(
      JSON.stringify({ resultBase64: `data:image/png;base64,${resultBase64}` }),
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
