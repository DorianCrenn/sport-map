import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

// Plans Stripe — à configurer avec les vrais Price IDs depuis le Stripe Dashboard
const PRICE_IDS: Record<string, Record<string, string>> = {
  premium: {
    monthly: Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY") ?? "",
    yearly:  Deno.env.get("STRIPE_PRICE_PREMIUM_YEARLY")  ?? "",
  },
  elite: {
    monthly: Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY") ?? "",
    yearly:  Deno.env.get("STRIPE_PRICE_ELITE_YEARLY")  ?? "",
  },
};

serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 503, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Authentifier l'utilisateur
  const authHeader = req.headers.get("authorization") ?? "";
  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const { plan, interval = "monthly", clubId } = await req.json() as {
      plan: "premium" | "elite";
      interval?: "monthly" | "yearly";
      clubId: string;
    };

    const priceId = PRICE_IDS[plan]?.[interval];
    if (!priceId) {
      return new Response(JSON.stringify({ error: `Price not configured for ${plan}/${interval}` }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
    const appUrl = Deno.env.get("APP_URL") ?? "https://sportlink.fr";

    // Récupérer ou créer le customer Stripe
    const { data: sub } = await supabase
      .from("club_subscriptions")
      .select("stripe_cus_id")
      .eq("club_id", clubId)
      .maybeSingle();

    let customerId = sub?.stripe_cus_id as string | undefined;

    if (!customerId) {
      // Récupérer le profil pour l'email
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name:  profile?.name ?? undefined,
        metadata: { club_id: clubId, user_id: user.id },
      });
      customerId = customer.id;

      // Sauvegarder le customer ID
      await supabase.from("club_subscriptions").upsert({
        club_id: clubId,
        stripe_cus_id: customerId,
        plan: "free",
        status: "active",
      }, { onConflict: "club_id" });
    }

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?stripe=success&plan=${plan}`,
      cancel_url:  `${appUrl}/?stripe=cancel`,
      metadata:    { club_id: clubId, user_id: user.id, plan, interval },
      subscription_data: {
        metadata: { club_id: clubId },
        trial_period_days: 14, // 14 jours d'essai gratuit
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "fr",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[create-checkout-session]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
