import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

// Webhook Stripe — pas de CORS (appelé par Stripe directement)
serve(async (req) => {
  const stripeKey     = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    console.error("[stripe-webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("not configured", { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  console.log("[stripe-webhook] Event:", event.type);

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const clubId   = session.metadata?.club_id;
        const plan     = session.metadata?.plan ?? "premium";
        const interval = session.metadata?.interval ?? "monthly";
        const subId    = session.subscription as string;
        const cusId    = session.customer as string;
        if (!clubId || !subId) break;

        // Récupérer les dates de la subscription
        const sub = await stripe.subscriptions.retrieve(subId);
        await supabase.from("club_subscriptions").upsert({
          club_id:               clubId,
          plan,
          status:                sub.status,
          stripe_sub_id:         subId,
          stripe_cus_id:         cusId,
          current_period_start:  new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:    new Date(sub.current_period_end   * 1000).toISOString(),
          trial_end:             sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          updated_at:            new Date().toISOString(),
        }, { onConflict: "club_id" });

        // Sync plan sur le club (colonne plan dans clubs)
        await supabase.from("clubs").update({ plan, subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString() }).eq("id", clubId);

        console.log(`[stripe-webhook] Club ${clubId} upgraded to ${plan} (${interval})`);
        break;
      }

      case "customer.subscription.updated": {
        const sub    = event.data.object as Stripe.Subscription;
        const clubId = sub.metadata?.club_id;
        if (!clubId) break;

        // Déduire le plan depuis le Price ID
        const priceId = sub.items.data[0]?.price.id;
        const plan    = getPlanFromPrice(priceId);

        await supabase.from("club_subscriptions").upsert({
          club_id:               clubId,
          plan,
          status:                sub.status,
          stripe_sub_id:         sub.id,
          current_period_start:  new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:    new Date(sub.current_period_end   * 1000).toISOString(),
          trial_end:             sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          updated_at:            new Date().toISOString(),
        }, { onConflict: "club_id" });

        if (sub.status === "active" || sub.status === "trialing") {
          await supabase.from("clubs").update({ plan, subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString() }).eq("id", clubId);
        }

        console.log(`[stripe-webhook] Club ${clubId} subscription updated: ${plan} / ${sub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription;
        const clubId = sub.metadata?.club_id;
        if (!clubId) break;

        await supabase.from("club_subscriptions").upsert({
          club_id:    clubId,
          plan:       "free",
          status:     "cancelled",
          stripe_sub_id: sub.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "club_id" });

        await supabase.from("clubs").update({ plan: "free", subscription_expires_at: null }).eq("id", clubId);
        console.log(`[stripe-webhook] Club ${clubId} subscription cancelled → free`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = invoice.subscription as string;
        if (!subId) break;
        await supabase.from("club_subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("stripe_sub_id", subId);
        console.log(`[stripe-webhook] Payment failed for subscription ${subId}`);
        break;
      }
    }
  } catch (err: any) {
    console.error("[stripe-webhook] Handler error:", err.message);
    return new Response(`Handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

function getPlanFromPrice(priceId?: string): string {
  const eliteMonthly = Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY") ?? "";
  const eliteYearly  = Deno.env.get("STRIPE_PRICE_ELITE_YEARLY")  ?? "";
  if (priceId === eliteMonthly || priceId === eliteYearly) return "elite";
  return "premium";
}
