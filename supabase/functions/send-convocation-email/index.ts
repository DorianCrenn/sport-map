import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions, checkCsrfOrigin } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

interface ConvocationPayload {
  eventId:      string;
  clubId?:      string;
  clubName:     string;
  eventTitle:   string;
  eventDate:    string;   // ISO
  eventTime?:   string;
  eventVenue?:  string;
  coachName?:   string;
  players: Array<{ convocationId: string; name: string; email: string }>;
}

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

  // ── Auth : JWT obligatoire — seuls les managers/admins envoient des convocations
  const authHeader = req.headers.get("authorization") ?? "";
  const anonClient = createClient(supaUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Authentification requise" }), {
      status: 401, headers: { ...ch, "Content-Type": "application/json" },
    });
  }

  // Vérifier le rôle autorisé
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["club_admin", "admin", "superadmin"].includes(profile.role)) {
    // Accepter aussi les managers (club_managers)
    const { data: managerRow } = await supabase
      .from("club_managers")
      .select("id")
      .eq("email", user.email)
      .eq("status", "active")
      .in("role", ["owner", "manager", "editor"])
      .maybeSingle();

    if (!managerRow) {
      return new Response(JSON.stringify({ error: "Accès réservé aux gestionnaires de club" }), {
        status: 403, headers: { ...ch, "Content-Type": "application/json" },
      });
    }
  }

  // Rate limit : 100 emails/heure par expéditeur (environ 3 convocations × 30 joueurs)
  const limited = await checkRateLimit(supabase, user.id, "send-convocation-email", 100, 3600);
  if (limited) {
    return new Response(JSON.stringify({ error: "Limite atteinte — 100 emails par heure maximum." }), {
      status: 429, headers: { ...ch, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: ConvocationPayload = await req.json();
    const { eventId, clubId, clubName, eventTitle, eventDate, eventTime, eventVenue, coachName, players } = payload;

    if (!eventId || !players?.length) {
      return new Response(JSON.stringify({ error: "eventId and players required" }), {
        status: 400, headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const dateObj   = new Date(eventDate);
    const dateFr    = dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const dateShort = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

    const results: Array<{ email: string; sent: boolean; token?: string }> = [];

    for (const player of players) {
      if (!player.email?.trim()) { results.push({ email: player.email, sent: false }); continue; }

      const { data: tokenRow, error: tokenErr } = await supabase
        .from("convocation_reply_tokens")
        .insert({
          convocation_id: player.convocationId,
          player_email:   player.email.trim().toLowerCase(),
          player_name:    player.name,
          event_id:       eventId,
          club_id:        clubId ?? null,
        })
        .select("token")
        .single();

      if (tokenErr || !tokenRow) {
        console.error("[send-convoc] token insert error:", tokenErr?.message);
        results.push({ email: player.email, sent: false });
        continue;
      }

      const token = tokenRow.token as string;
      const replyBase       = `${appUrl}/#convoc-reply/${token}`;
      const linkAccepted    = `${replyBase}?s=accepted`;
      const linkDeclined    = `${replyBase}?s=declined`;
      const linkUnavailable = `${replyBase}?s=unavailable`;
      const expireDate      = new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString("fr-FR");

      const coachLine = coachName ? `<br/>👤 Coach : <strong>${coachName}</strong>` : "";
      const venueLine = eventVenue
        ? `<br/>📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventVenue)}" style="color:#2563eb;text-decoration:none;">${eventVenue}</a>`
        : "";

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 28px 24px; color: white; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p  { margin: 6px 0 0; font-size: 13px; opacity: 0.8; }
    .body { padding: 24px; }
    .club-badge { display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #1d4ed8; border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
    .event-card { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #2563eb; }
    .event-card h2 { margin: 0 0 8px; font-size: 16px; color: #1e293b; }
    .event-card .meta { font-size: 13px; color: #64748b; line-height: 1.8; }
    .question { font-size: 15px; font-weight: 700; color: #1e293b; margin: 20px 0 16px; text-align: center; }
    .buttons { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 16px 0; }
    .btn { display: inline-block; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; text-align: center; min-width: 120px; }
    .btn-yes   { background: #22c55e; color: white; }
    .btn-no    { background: #ef4444; color: white; }
    .btn-maybe { background: #f97316; color: white; }
    .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6; }
    .app-link { color: #2563eb; text-decoration: none; font-weight: 600; }
    .expire-note { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚽ Convocation</h1>
      <p>Vous avez reçu une convocation officielle</p>
    </div>
    <div class="body">
      <div class="club-badge">🏆 ${clubName}</div>
      <p style="font-size:15px;color:#334155;margin:0 0 12px;">Bonjour <strong>${player.name}</strong>,</p>
      <p style="font-size:14px;color:#475569;margin:0 0 4px;">Vous êtes convoqué(e) pour :</p>

      <div class="event-card">
        <h2>${eventTitle}</h2>
        <div class="meta">
          📅 ${dateFr}${eventTime ? `<br/>🕐 ${eventTime}` : ""}${venueLine}${coachLine}
        </div>
      </div>

      <p class="question">Serez-vous présent(e) ?</p>

      <div class="buttons">
        <a href="${linkAccepted}"    class="btn btn-yes">✅ Présent(e)</a>
        <a href="${linkDeclined}"    class="btn btn-no">❌ Absent(e)</a>
        <a href="${linkUnavailable}" class="btn btn-maybe">🤔 Peut-être</a>
      </div>

      <p class="expire-note">Ce lien est valable 7 jours (jusqu'au ${expireDate}).</p>
    </div>
    <div class="footer">
      Vous pouvez aussi répondre directement dans l'application<br/>
      <a href="${appUrl}" class="app-link">SportLink</a> · Ce message a été envoyé par ${clubName}
    </div>
  </div>
</body>
</html>`;

      if (!resendKey) {
        console.log(`[send-convoc] DEV — would email ${player.email} with token ${token}`);
        results.push({ email: player.email, sent: false, token });
        continue;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    `${clubName} via SportLink <${fromEmail}>`,
          to:      [player.email],
          subject: `⚽ Convocation — ${eventTitle} le ${dateShort}`,
          html,
        }),
      });

      if (res.ok) {
        await supabase.from("event_convocations")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", player.convocationId);
        results.push({ email: player.email, sent: true, token });
      } else {
        const errBody = await res.text();
        console.error(`[send-convoc] Resend error for ${player.email}:`, errBody);
        results.push({ email: player.email, sent: false });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...ch, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[send-convoc] Unhandled error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...ch, "Content-Type": "application/json" },
    });
  }
});
