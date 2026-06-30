import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions, checkCsrfOrigin } from "../_shared/cors.ts";

const STATUS_FR: Record<string, string> = {
  accepted:    "✅ Présent(e)",
  declined:    "❌ Absent(e)",
  unavailable: "🤔 Peut-être présent(e)",
};

Deno.serve(async (req) => {
  const prelight = handleOptions(req);
  if (prelight) return prelight;
  const csrfErr = checkCsrfOrigin(req);
  if (csrfErr) return csrfErr;
  const ch = corsHeaders(req);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "convocations@sportlink.fr";
  const appUrl    = Deno.env.get("APP_URL")    ?? "https://sportlink.fr";
  const supaUrl   = Deno.env.get("SUPABASE_URL")!;
  const supaKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase  = createClient(supaUrl, supaKey);

  try {
    const { token, status } = await req.json() as { token: string; status: string };
    if (!token || !STATUS_FR[status]) {
      return new Response(JSON.stringify({ error: "token and valid status required" }), {
        status: 400, headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const { data: row } = await supabase
      .from("convocation_reply_tokens")
      .select("player_name, player_email, events(title, date, time, venue), clubs(name)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle() as { data: any };

    if (!row?.player_email) {
      return new Response(JSON.stringify({ ok: false, reason: "token not found" }), {
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const clubName   = row.clubs?.name ?? "SportLink";
    const eventTitle = row.events?.title ?? "Événement";
    const dateObj    = row.events?.date ? new Date(row.events.date) : null;
    const dateFr     = dateObj
      ? dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
      : null;
    const timeStr    = row.events?.time ?? null;
    const venue      = row.events?.venue ?? null;

    if (!resendKey) {
      console.log(`[convoc-reply-confirm] DEV — would confirm ${row.player_email} status=${status}`);
      return new Response(JSON.stringify({ ok: true, dev: true }), {
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const statusLabel = STATUS_FR[status];
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 800; }
    .body { padding: 24px; }
    .status-box { text-align: center; padding: 20px; background: #f0fdf4; border-radius: 12px; margin-bottom: 16px; }
    .status-box .label { font-size: 20px; font-weight: 800; color: #166534; }
    .meta { font-size: 13px; color: #64748b; line-height: 1.7; }
    .footer { padding: 14px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    .app-link { color: #2563eb; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>📋 Confirmation de réponse</h1></div>
    <div class="body">
      <p style="font-size:14px;color:#334155;margin:0 0 16px;">Bonjour <strong>${row.player_name ?? ""}
</strong>, votre réponse a bien été enregistrée :</p>
      <div class="status-box"><div class="label">${statusLabel}</div></div>
      <div class="meta">
        <strong>${eventTitle}</strong><br/>
        ${dateFr ? `📅 ${dateFr}${timeStr ? ` à ${timeStr}` : ""}` : ""}
        ${venue ? `<br/>📍 ${venue}` : ""}
        <br/>🏆 ${clubName}
      </div>
      <p style="font-size:12px;color:#94a3b8;margin:16px 0 0;">
        Vous pouvez modifier votre réponse à tout moment via le lien dans l'email de convocation original.
      </p>
    </div>
    <div class="footer">
      <a href="${appUrl}" class="app-link">SportLink</a> · Gestion sportive simplifiée
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    `${clubName} via SportLink <${fromEmail}>`,
        to:      [row.player_email],
        subject: `✅ Réponse enregistrée — ${eventTitle}`,
        html,
      }),
    });

    return new Response(JSON.stringify({ ok: res.ok }), {
      headers: { ...ch, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[convoc-reply-confirm] error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...ch, "Content-Type": "application/json" },
    });
  }
});
