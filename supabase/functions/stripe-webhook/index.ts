import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

type PlanId = "free" | "starter" | "pro" | "elite";

// Webhook Stripe — pas de CORS (appelé directement par Stripe, pas depuis le browser)
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

  // Idempotence : ignorer les events déjà traités
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .eq("processed", true)
    .maybeSingle();

  if (existing) {
    console.log("[stripe-webhook] Already processed:", event.id);
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const clubId   = session.metadata?.club_id;
        const plan     = validatePlan(session.metadata?.plan) ?? "starter";
        const interval = session.metadata?.interval ?? "monthly";
        const subId    = session.subscription as string;
        const cusId    = session.customer as string;

        if (!clubId || !subId) {
          console.error("[stripe-webhook] Missing club_id or subscription in metadata");
          break;
        }

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

        await supabase
          .from("clubs")
          .update({
            plan,
            subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("id", clubId);

        console.log(`[stripe-webhook] Club ${clubId} → ${plan} (${interval})`);

        // Email de bienvenue
        await sendWelcomeEmail(supabase, clubId, plan, cusId);
        break;
      }

      case "customer.subscription.updated": {
        const sub    = event.data.object as Stripe.Subscription;
        const clubId = sub.metadata?.club_id;
        if (!clubId) break;

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
          await supabase
            .from("clubs")
            .update({
              plan,
              subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
            })
            .eq("id", clubId);
        }

        console.log(`[stripe-webhook] Club ${clubId} updated → ${plan} / ${sub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription;
        const clubId = sub.metadata?.club_id;
        if (!clubId) break;

        await supabase.from("club_subscriptions").upsert({
          club_id:       clubId,
          plan:          "free",
          status:        "cancelled",
          stripe_sub_id: sub.id,
          updated_at:    new Date().toISOString(),
        }, { onConflict: "club_id" });

        await supabase
          .from("clubs")
          .update({ plan: "free", subscription_expires_at: null })
          .eq("id", clubId);

        console.log(`[stripe-webhook] Club ${clubId} → free (cancelled)`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = invoice.subscription as string;
        if (!subId) break;

        await supabase
          .from("club_subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_sub_id", subId);

        console.log(`[stripe-webhook] Payment failed for subscription ${subId}`);
        break;
      }
    }

    // Marquer l'event comme traité
    await supabase.from("stripe_webhook_events").upsert({
      event_id:   event.id,
      event_type: event.type,
      club_id:    getClubIdFromEvent(event),
      processed:  true,
    }, { onConflict: "event_id" });

  } catch (err: any) {
    console.error("[stripe-webhook] Handler error:", err.message);
    return new Response(`Handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Envoie un email de bienvenue à l'admin du club après souscription.
async function sendWelcomeEmail(
  supabase: ReturnType<typeof createClient>,
  clubId: string,
  plan: string,
  customerId: string,
): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@sportlink.fr";
  const appUrl    = Deno.env.get("APP_URL")    ?? "https://sportlink.fr";

  if (!resendKey) { console.log("[stripe-webhook] RESEND_API_KEY absent — welcome email skipped"); return; }

  try {
    // Récupérer l'email de l'admin via club_subscriptions → profil
    const { data: sub } = await supabase
      .from("club_subscriptions")
      .select("club_id")
      .eq("stripe_cus_id", customerId)
      .maybeSingle();

    if (!sub?.club_id) return;

    const { data: club } = await supabase
      .from("clubs")
      .select("name, user_id")
      .eq("id", sub.club_id)
      .maybeSingle();

    if (!club?.user_id) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email:id")
      .eq("id", club.user_id)
      .maybeSingle();

    // Récupérer l'email depuis auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(club.user_id);
    const email = authUser?.user?.email;
    if (!email) return;

    const PLAN_NAMES: Record<string, string> = {
      starter: 'Starter',
      pro:     'Club Pro',
      elite:   'Elite',
    };
    const planName = PLAN_NAMES[plan] ?? plan;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0F1E3A 0%,#1a3a6a 100%);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">🎉</div>
    <h1 style="margin:0;color:white;font-size:22px;font-weight:800;">Bienvenue sur le plan ${planName} !</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">SportLink — ${club.name ?? clubId}</p>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;">
      Bonjour ${(profile as any)?.name ?? 'là'},
    </p>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">
      Votre abonnement <strong>SportLink ${planName}</strong> est maintenant actif pour le club <strong>${club.name ?? clubId}</strong>. Vous bénéficiez de <strong>14 jours d'essai gratuit</strong> — aucun prélèvement avant la fin de cette période.
    </p>
    <a href="${appUrl}/#subscription/${clubId}" style="display:block;text-align:center;padding:14px;background:#22D96A;color:white;font-weight:800;font-size:16px;text-decoration:none;border-radius:14px;margin-bottom:24px;">
      Accéder à mon abonnement
    </a>
    <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1e293b;">Ce qui change maintenant :</p>
      <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.9;">
        ${plan === 'starter' ? '<li>Watermark SportLink supprimé de vos affiches</li><li>Templates avancés PosterStudio</li><li>Covoiturage pour une équipe</li>' : ''}
        ${plan === 'pro' ? '<li>Watermark supprimé + Templates avancés</li><li>Covoiturage toutes équipes</li><li>Événements à la une dans le feed</li><li>Compositions d\'équipe et statistiques</li>' : ''}
        ${plan === 'elite' ? '<li>Toutes les fonctionnalités Pro</li><li>IA génération de fonds + éléments</li><li>Analytics avancées + automatisations</li><li>Stats avancées joueurs/équipes</li>' : ''}
      </ul>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
      Vous pouvez annuler à tout moment depuis votre tableau de bord abonnement.<br/>
      Des questions ? Répondez à cet email ou consultez notre aide.
    </p>
  </div>
  <div style="padding:16px 32px;background:#f8fafc;text-align:center;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">SportLink · La communauté sport en Finistère</p>
  </div>
</div>
</body>
</html>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    `SportLink <${fromEmail}>`,
        to:      [email],
        subject: `🎉 Bienvenue sur SportLink ${planName} !`,
        html,
      }),
    });
  } catch (err: any) {
    console.error("[stripe-webhook] welcome email error:", err.message);
    // Non bloquant — on ne fait pas échouer le webhook pour un email
  }
}

// Déduit le plan depuis le Price ID Stripe.
// Ordre de priorité : elite > pro > starter (fallback).
function getPlanFromPrice(priceId?: string): PlanId {
  if (!priceId) return "starter";

  const eliteMonthly = Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY") ?? "";
  const eliteYearly  = Deno.env.get("STRIPE_PRICE_ELITE_YEARLY")  ?? "";
  if (priceId === eliteMonthly || priceId === eliteYearly) return "elite";

  const proMonthly = Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "";
  const proYearly  = Deno.env.get("STRIPE_PRICE_PRO_YEARLY")  ?? "";
  if (priceId === proMonthly || priceId === proYearly) return "pro";

  return "starter";
}

// Valide que le plan venant des metadata est un PlanId connu.
function validatePlan(plan?: string | null): PlanId | null {
  if (plan === "starter" || plan === "pro" || plan === "elite") return plan;
  return null;
}

function getClubIdFromEvent(event: Stripe.Event): string | null {
  const obj = event.data.object as Record<string, any>;
  return obj?.metadata?.club_id ?? null;
}
