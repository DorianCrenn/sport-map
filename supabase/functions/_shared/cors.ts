// CORS headers for Supabase Edge Functions
// Restrict origin to production + local dev only

const ALLOWED_ORIGINS = [
  "https://sportlink.fr",
  "https://www.sportlink.fr",
  "http://localhost:5173",
  "http://localhost:4173",
];

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin":  allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  return null;
}
