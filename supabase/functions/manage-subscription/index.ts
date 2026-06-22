import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { corsHeaders, handleOptions, checkCsrfOrigin } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

type Action = "cancel" | "reactivate" | "portal" | "invoices";

Deno.serve(async (req) => {
  const prelight = handleOptions(req);
  if (prelight) return prelight;
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

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...ch, "Content-Type": "application/json" },
    });
  }

  // ── Rate limit : 20 actions/heure ─────────────────────────────────────────
  const limited = await checkRateLimit(supabase, user.id, "manage-subscription", 20, 3600);
  if (limited) {
    return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans une heure." }), {
      status: 429, headers: { ...ch, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as { action?: unknown; clubId?: unknown };
    const action = typeof body.action === "string" ? body.action as Action : null;
    const clubId = typeof body.clubId === "string" ? body.clubId : null;

    if (!action || !["cancel", "reactivate", "portal", "invoices"].includes(action)) {
      return new Response(JSON.stringify({ error: "Action invalide" }), {
        status: 400, headers: { ...ch, "Content-Type": "application/json" },
      });
    }
    if (!clubId) {
      return new Response(JSON.stringify({ error: "clubId requis" }), {
        status: 400, headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    // ── Autorisation : l'user doit gérer ce club ───────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, club_id")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin     = ["admin", "superadmin"].includes(profile?.role ?? "");
    const isClubAdmin = profile?.role === "club_admin" && profile?.club_id === clubId;

    if (!isAdmin && !isClubAdmin) {
      const { data: managerRow } = await supabase
        .from("club_managers")
        .select("id")
        .eq("club_id", clubId)
        .eq("email", user.email)
        .eq("status", "active")
        .in("role", ["owner", "manager"])
        .maybeSingle();

      if (!managerRow) {
        return new Response(JSON.stringify({ error: "Accès non autorisé pour ce club" }), {
          status: 403, headers: { ...ch, "Content-Type": "application/json" },
        });
      }
    }

    // ── Récupérer la subscription Stripe ──────────────────────────────────
    const { data: sub } = await supabase
      .from("club_subscriptions")
      .select("stripe_sub_id, stripe_cus_id, plan, status")
      .eq("club_id", clubId)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });
    const appUrl = Deno.env.get("APP_URL") ?? "https://sportlink.fr";

    // ── Actions ───────────────────────────────────────────────────────────

    if (action === "invoices") {
      if (!sub?.stripe_cus_id) {
        return new Response(JSON.stringify({ invoices: [] }), {
          headers: { ...ch, "Content-Type": "application/json" },
        });
      }
      const invoiceList = await stripe.invoices.list({
        customer: sub.stripe_cus_id,
        limit: 12,
      });
      const invoices = invoiceList.data.map((inv) => ({
        id:          inv.id,
        number:      inv.number,
        amount:      inv.amount_paid / 100,
        currency:    inv.currency,
        status:      inv.status,
        date:        new Date(inv.created * 1000).toISOString(),
        period_end:  inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
        pdf_url:     inv.invoice_pdf,
        hosted_url:  inv.hosted_invoice_url,
      }));
      return new Response(JSON.stringify({ invoices }), {
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    if (action === "portal") {
      if (!sub?.stripe_cus_id) {
        return new Response(JSON.stringify({ error: "Aucun abonnement Stripe trouvé" }), {
          status: 400, headers: { ...ch, "Content-Type": "application/json" },
        });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer:   sub.stripe_cus_id,
        return_url: `${appUrl}/#subscription/${clubId}`,
      });
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel") {
      if (!sub?.stripe_sub_id) {
        return new Response(JSON.stringify({ error: "Aucun abonnement actif à annuler" }), {
          status: 400, headers: { ...ch, "Content-Type": "application/json" },
        });
      }
      // Annulation en fin de période (pas immédiate) — l'accès est maintenu jusqu'à la fin
      await stripe.subscriptions.update(sub.stripe_sub_id, {
        cancel_at_period_end: true,
      });
      await supabase
        .from("club_subscriptions")
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("club_id", clubId);

      return new Response(JSON.stringify({ ok: true, message: "Abonnement annulé en fin de période" }), {
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    if (action === "reactivate") {
      if (!sub?.stripe_sub_id) {
        return new Response(JSON.stringify({ error: "Aucun abonnement à réactiver" }), {
          status: 400, headers: { ...ch, "Content-Type": "application/json" },
        });
      }
      await stripe.subscriptions.update(sub.stripe_sub_id, {
        cancel_at_period_end: false,
      });
      await supabase
        .from("club_subscriptions")
        .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
        .eq("club_id", clubId);

      return new Response(JSON.stringify({ ok: true, message: "Abonnement réactivé" }), {
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action non gérée" }), {
      status: 400, headers: { ...ch, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[manage-subscription]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...ch, "Content-Type": "application/json" },
    });
  }
});
