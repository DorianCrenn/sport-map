import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

// ── Config ────────────────────────────────────────────────────────────────────

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL")     ?? "noreply@sportlink.fr";
const APP_URL        = Deno.env.get("APP_URL")         ?? "https://sportlink-finistere.vercel.app";

// Délais pour lesquels on envoie un rappel (en jours avant expiration)
const REMINDER_DAYS = [7, 1];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function planLabel(plan: string): string {
  const labels: Record<string, string> = {
    starter: "Starter",
    pro:     "Club Pro",
    elite:   "Elite",
    free:    "Gratuit",
  };
  return labels[plan] ?? plan;
}

// ── Template email HTML ───────────────────────────────────────────────────────

function buildEmailHtml(opts: {
  clubName:   string;
  planName:   string;
  daysLeft:   number;
  expiryDate: string;
  renewUrl:   string;
}): string {
  const { clubName, planName, daysLeft, expiryDate, renewUrl } = opts;

  const urgencyColor = daysLeft <= 1 ? "#ef4444" : daysLeft <= 3 ? "#f97316" : "#f59e0b";
  const urgencyMsg   = daysLeft === 0
    ? "expire aujourd'hui"
    : daysLeft === 1
      ? "expire demain"
      : `expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre abonnement SportLink expire bientôt</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F1E3A 0%,#07142A 100%);padding:32px 36px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
        Sport<span style="color:#1FD37E;">Link</span>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:0.05em;text-transform:uppercase;">
        Rappel d'abonnement
      </div>
    </div>

    <!-- Alerte urgence -->
    <div style="background:${urgencyColor}10;border-left:4px solid ${urgencyColor};padding:16px 36px;display:flex;align-items:center;gap:12px;">
      <div style="font-size:20px;">⚠️</div>
      <div>
        <div style="font-size:14px;font-weight:700;color:${urgencyColor};">
          Votre abonnement ${urgencyMsg}
        </div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">
          Plan <strong>${planName}</strong> · Expiration le ${expiryDate}
        </div>
      </div>
    </div>

    <!-- Corps -->
    <div style="padding:32px 36px;">
      <p style="font-size:15px;color:#111827;font-weight:600;margin:0 0 8px;">
        Bonjour, administrateur de <strong>${clubName}</strong> 👋
      </p>
      <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px;">
        Votre abonnement <strong>${planName}</strong> SportLink ${urgencyMsg}.
        Pour continuer à profiter de toutes vos fonctionnalités — PosterStudio, covoiturage,
        statistiques, événements À la Une — pensez à renouveler avant la date d'expiration.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${renewUrl}" style="display:inline-block;background:#1FD37E;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:-0.2px;">
          Renouveler mon abonnement →
        </a>
      </div>

      <!-- Features résumé -->
      <div style="background:#f9fafb;border-radius:12px;padding:20px 24px;margin:24px 0 0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:12px;">
          Ce que vous perdrez sans renouvellement
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${[
            "PosterStudio illimité",
            "Suppression du filigrane",
            "Accès aux statistiques",
            "Covoiturage pour vos équipes",
            "Événements \"À la Une\" dans le feed",
          ].map(f => `
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#374151;">
            <span style="color:#ef4444;font-weight:700;">✗</span> ${f}
          </div>`).join("")}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">
        Vous recevez cet email car vous administrez le club <strong>${clubName}</strong> sur SportLink.<br>
        Des questions ? Contactez-nous à <a href="mailto:hello@sportlink.fr" style="color:#1FD37E;">hello@sportlink.fr</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Handler principal ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const prelight = handleOptions(req); if (prelight) return prelight;
  const ch = corsHeaders(req);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const now     = new Date();
    const results = { sent: 0, skipped: 0, errors: [] as string[] };

    for (const daysLeft of REMINDER_DAYS) {
      // Fenêtre : clubs dont l'expiration tombe AUJOURD'HUI + daysLeft jours
      const targetStart = new Date(now);
      targetStart.setDate(now.getDate() + daysLeft);
      targetStart.setHours(0, 0, 0, 0);

      const targetEnd = new Date(targetStart);
      targetEnd.setHours(23, 59, 59, 999);

      const { data: subs, error } = await supabase
        .from("club_subscriptions")
        .select("club_id, plan, current_period_end")
        .eq("status", "active")
        .gte("current_period_end", targetStart.toISOString())
        .lte("current_period_end", targetEnd.toISOString());

      if (error) {
        results.errors.push(`Query J-${daysLeft}: ${error.message}`);
        continue;
      }

      for (const sub of subs ?? []) {
        try {
          // Récupérer le club + propriétaire
          const { data: club } = await supabase
            .from("clubs")
            .select("name, user_id")
            .eq("id", sub.club_id)
            .single();

          if (!club?.user_id) { results.skipped++; continue; }

          // Récupérer l'email du propriétaire via auth admin API
          const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(club.user_id);
          if (userErr || !user?.email) { results.skipped++; continue; }

          const expiryDate = fmtDate(sub.current_period_end);
          const planName   = planLabel(sub.plan);

          // Envoi Resend
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from:    `SportLink <${FROM_EMAIL}>`,
              to:      [user.email],
              subject: `⚠️ Votre abonnement ${planName} expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} — ${club.name}`,
              html:    buildEmailHtml({
                clubName:   club.name,
                planName,
                daysLeft,
                expiryDate,
                renewUrl:   `${APP_URL}?tab=clubs`,
              }),
            }),
          });

          if (emailRes.ok) {
            results.sent++;
          } else {
            const body = await emailRes.text();
            results.errors.push(`Resend error for ${user.email}: ${body}`);
          }

        } catch (err) {
          results.errors.push(`Club ${sub.club_id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      status: 200,
      headers: { ...ch, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...ch, "Content-Type": "application/json" },
    });
  }
});
