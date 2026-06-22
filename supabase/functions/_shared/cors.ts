// CORS + CSRF protection for Supabase Edge Functions
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
    "Vary": "Origin",
  };
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }
  return null;
}

/**
 * Vérifie que la requête provient d'une origine autorisée.
 * Protège contre les attaques CSRF en validant Origin puis Referer en fallback.
 * À appeler APRÈS handleOptions() et auth JWT.
 *
 * @returns null si OK, sinon une Response 403 prête à retourner
 */
export function checkCsrfOrigin(req: Request): Response | null {
  // Stripe webhook — appelé directement par Stripe, pas depuis le browser
  // → ne pas valider l'Origin pour ce cas (géré par signature HMAC)
  const userAgent = req.headers.get("user-agent") ?? "";
  if (userAgent.startsWith("Stripe/")) return null;

  // Requests sans Origin sont des appels serveur-à-serveur légitimes
  // (ex: Supabase cron, autres EFs) → on laisse passer
  const origin  = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!origin && !referer) return null;

  // Valider l'Origin si présent
  if (origin) {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      console.warn("[csrf] Origin rejetée:", origin);
      return new Response(JSON.stringify({ error: "CSRF: origine non autorisée" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return null;
  }

  // Fallback sur Referer si Origin absent (certains proxies/browsers l'omettent)
  if (referer) {
    const allowed = ALLOWED_ORIGINS.some(o => referer.startsWith(o));
    if (!allowed) {
      console.warn("[csrf] Referer rejeté:", referer);
      return new Response(JSON.stringify({ error: "CSRF: referer non autorisé" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return null;
}
