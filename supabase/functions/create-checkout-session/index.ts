import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { corsHeaders, handleOptions, checkCsrfOrigin } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

type PlanId = "starter" | "pro" | "elite";

// Plans Stripe — les Price IDs sont configurés dans les Supabase Secrets
// STRIPE_PRICE_STARTER_MONTHLY, STRIPE_PRICE_STARTER_YEARLY
// STRIPE_PRICE_PRO_MONTHLY,     STRIPE_PRICE_PRO_YEARLY
// STRIPE_PRICE_ELITE_MONTHLY,   STRIPE_PRICE_ELITE_YEARLY
const PRICE_IDS: Record<PlanId, Record<"monthly" | "yearly", string>> = {
  starter: {
    monthly: Deno.env.get("STRIPE_PRICE_STARTER_MONTHLY") ?? "",
    yearly:  Deno.env.get("STRIPE_PRICE_STARTER_YEARLY")  ?? "",
  },
  pro: {
    monthly: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "",
    yearly:  Deno.env.get("STRIPE_PRICE_PRO_YEARLY")  ?? "",
  },
  elite: {
    monthly: Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY") ?? "",
    yearly:  Deno.env.get("STRIPE_PRICE_ELITE_YEARLY")  ?? "",
  },
};

const VALID_PLANS = new Set<string>(["starter", "pro", "elite"]);
const VALID_INTERVALS = new Set<string>(["monthly", "yearly"]);

serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  const csrfErr = checkCsrfOrigin(req);
  if (csrfErr) return csrfErr;

  const ch = corsHeaders(req);

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 503, headers: { ...ch, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── Auth : JWT obligatoire ────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...ch, "Content-Type": "application/json" },
    });
  }

  // ── Rate limit : 10 tentatives/heure par utilisateur ─────────────────────
  const limited = await checkRateLimit(supabase, user.id, "create-checkout-session", 10, 3600);
  if (limited) {
    return new Response(JSON.stringify({ error: "Trop de tentatives. Réessayez dans une heure." }), {
      status: 429, headers: { ...ch, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as {
      plan?: unknown;
      interval?: unknown;
      clubId?: unknown;
    };

    const plan     = typeof body.plan     === "string" ? body.plan     : "";
    const interval = typeof body.interval === "string" ? body.interval : "monthly";
    const clubId   = typeof body.clubId   === "string" ? body.clubId   : "";

    // ── Validation stricte des paramètres ────────────────────────────────────
    if (!VALID_PLANS.has(plan)) {
      return new Response(JSON.stringify({ error: `Plan invalide : ${plan}` }), {
        status: 400, headers: { ...ch, "Content-Type": "application/json" },
      });
    }
    if (!VALID_INTERVALS.has(interval)) {
      return new Response(JSON.stringify({ error: `Intervalle invalide : ${interval}` }), {
        status: 400, headers: { ...ch, "Content-Type": "application/json" },
      });
    }
    if (!clubId) {
      return new Response(JSON.stringify({ error: "clubId requis" }), {
        status: 400, headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const priceId = PRICE_IDS[plan as PlanId]?.[interval as "monthly" | "yearly"];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `Price non configuré pour ${plan}/${interval} — vérifiez les Supabase Secrets` }),
        { status: 400, headers: { ...ch, "Content-Type": "application/json" } },
      );
    }

    // ── Autorisation : vérifier que l'user gère ce club ──────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, club_id")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin     = ["admin", "superadmin"].includes(profile?.role ?? "");
    const isClubAdmin = profile?.role === "club_admin" && profile?.club_id === clubId;

    if (!isAdmin && !isClubAdmin) {
      // Vérifier si l'user est manager actif du club
      const { data: managerRow } = await supabase
        .from("club_managers")
        .select("id")
        .eq("club_id", clubId)
        .eq("email", user.email)
        .eq("status", "active")
        .in("role", ["owner", "manager"])
        .maybeSingle();

      if (!managerRow) {
        return new Response(
          JSON.stringify({ error: "Vous n'êtes pas autorisé à gérer l'abonnement de ce club" }),
          { status: 403, headers: { ...ch, "Content-Type": "application/json" } },
        );
      }
    }

    // ── Créer ou récupérer le customer Stripe ────────────────────────────────
    const stripe  = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
    const appUrl  = Deno.env.get("APP_URL") ?? "https://sportlink.fr";

    const { data: sub } = await supabase
      .from("club_subscriptions")
      .select("stripe_cus_id")
      .eq("club_id", clubId)
      .maybeSingle();

    let customerId = sub?.stripe_cus_id as string | undefined;

    if (!customerId) {
      const { data: profileFull } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      const customer = await stripe.customers.create({
        email:    user.email ?? undefined,
        name:     profileFull?.name ?? undefined,
        metadata: { club_id: clubId, user_id: user.id },
      });
      customerId = customer.id;

      await supabase.from("club_subscriptions").upsert({
        club_id:       clubId,
        stripe_cus_id: customerId,
        plan:          "free",
        status:        "active",
      }, { onConflict: "club_id" });
    }

    // ── Session Checkout Stripe ───────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      customer:    customerId,
      mode:        "subscription",
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?stripe=success&plan=${plan}`,
      cancel_url:  `${appUrl}/?stripe=cancel`,
      metadata:    { club_id: clubId, user_id: user.id, plan, interval },
      subscription_data: {
        metadata:          { club_id: clubId },
        trial_period_days: 14,
      },
      allow_promotion_codes:       true,
      billing_address_collection:  "auto",
      locale:                      "fr",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...ch, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[create-checkout-session]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...ch, "Content-Type": "application/json" },
    });
  }
});
