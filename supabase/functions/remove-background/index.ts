/**
 * Edge Function : remove-background  (PS-API-001/002)
 * Removes the background from a player photo.
 *
 * Priority:
 *   1. Remove.bg API  (REMOVE_BG_API_KEY secret)
 *   2. Fal.ai BRIA RMBG 2.0 (FAL_API_KEY secret) — PS-API-002 fallback
 *   3. mockFallback: true  → client falls back to canvas mock
 *
 * POST /functions/v1/remove-background
 * Body: { imageBase64: string }   — full data-URL or raw base64
 * Returns: { resultBase64: string } — PNG with transparent background
 *          { error: string, mockFallback: true } — if all APIs unavailable
 */

import { corsHeaders, handleOptions } from '../_shared/cors.ts';

// ── Fal.ai BRIA RMBG fallback ─────────────────────────────────────────────────

async function removeViaFalAI(base64Data: string): Promise<string | null> {
  const FAL_KEY = Deno.env.get('FAL_API_KEY');
  if (!FAL_KEY) return null;

  try {
    // 1. Upload image to Fal.ai storage to get a URL
    const binary = Uint8Array.from(atob(base64Data), (c: string) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, 'player.jpg');

    const uploadRes = await fetch('https://fal.run/files/upload', {
      method: 'POST',
      headers: { Authorization: `Key ${FAL_KEY}` },
      body: formData,
    });
    if (!uploadRes.ok) return null;
    const { url: imageUrl } = await uploadRes.json() as { url: string };

    // 2. Call BRIA RMBG 2.0
    const rmbgRes = await fetch('https://fal.run/fal-ai/bria-rmbg', {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!rmbgRes.ok) return null;
    const { image } = await rmbgRes.json() as { image: { url: string } };
    if (!image?.url) return null;

    // 3. Download result and convert to base64
    const imgRes = await fetch(image.url);
    if (!imgRes.ok) return null;
    const buf = await imgRes.arrayBuffer();
    const resultBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `data:image/png;base64,${resultBase64}`;
  } catch {
    return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const prelight = handleOptions(req); if (prelight) return prelight;
  const ch = corsHeaders(req);

  try {
    const { imageBase64 } = await req.json();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const REMOVE_BG_KEY = Deno.env.get('REMOVE_BG_API_KEY');

    // ── 1. Try Remove.bg ──────────────────────────────────────────────────────
    if (REMOVE_BG_KEY) {
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

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const resultBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return new Response(
          JSON.stringify({ resultBase64: `data:image/png;base64,${resultBase64}` }),
          { headers: { ...ch, 'Content-Type': 'application/json' } },
        );
      }
      // Non-OK (quota exceeded, etc.) → fall through to Fal.ai
    }

    // ── 2. Try Fal.ai BRIA RMBG 2.0 ──────────────────────────────────────────
    const falResult = await removeViaFalAI(base64Data);
    if (falResult) {
      return new Response(
        JSON.stringify({ resultBase64: falResult }),
        { headers: { ...ch, 'Content-Type': 'application/json' } },
      );
    }

    // ── 3. Both unavailable — client falls back to canvas mock ────────────────
    return new Response(
      JSON.stringify({ error: 'No background removal API configured', mockFallback: true }),
      { status: 503, headers: { ...ch, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...ch, 'Content-Type': 'application/json' } },
    );
  }
});
