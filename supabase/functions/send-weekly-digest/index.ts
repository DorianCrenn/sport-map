import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Date helpers ──────────────────────────────────────────────────────────────

function getWeekend() {
  const now = new Date();
  const daysUntilSat = ((6 - now.getDay()) + 7) % 7 || 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return { sat, sun };
}

function fmtDay(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ── Sport emoji map ───────────────────────────────────────────────────────────

const EMOJI: Record<string, string> = {
  Football: "⚽", Basketball: "🏀", Handball: "🤾", Volleyball: "🏐",
  Rugby: "🏉", Tennis: "🎾", Natation: "🏊", Cyclisme: "🚴",
  Athlétisme: "🏃", Judo: "🥋", Badminton: "🏸", Hockey: "🏒",
};

function sportEmoji(sport: string) {
  return EMOJI[sport] ?? "🏆";
}

// ── Email HTML builder ────────────────────────────────────────────────────────

function buildHtml(name: string, events: any[], sat: Date, sun: Date, appUrl: string): string {
  const satEvs = events.filter(e => new Date(e.date).toDateString() === sat.toDateString());
  const sunEvs = events.filter(e => new Date(e.date).toDateString() === sun.toDateString());

  function eventRow(e: any) {
    const emoji = sportEmoji(e.sport);
    const type = e.event_type === "championship" ? "Championnat"
               : e.event_type === "cup"          ? "Coupe"
               : "Amical";
    const typeColor = e.event_type === "championship" ? "#3b82f6"
                    : e.event_type === "cup"           ? "#f97316"
                    : "#22C55E";
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:32px;font-size:18px;vertical-align:middle;">${emoji}</td>
              <td style="padding-left:8px;vertical-align:middle;">
                <div style="font-size:13px;font-weight:600;color:#0F1E3A;line-height:1.3;">${e.title}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">
                  ${fmtTime(e.date)} · ${e.city}${e.team_name ? " · " + e.team_name : ""}
                </div>
              </td>
              <td style="text-align:right;vertical-align:middle;padding-left:6px;">
                <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:${typeColor}18;color:${typeColor};white-space:nowrap;">
                  ${type}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }

  function daySection(label: string, evs: any[]) {
    if (evs.length === 0) return "";
    return `
      <tr>
        <td style="padding:16px 28px 0;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:8px;">${label}</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${evs.map(eventRow).join("")}
          </table>
        </td>
      </tr>`;
  }

  const satLabel = `Samedi ${sat.getDate()} ${sat.toLocaleDateString("fr-FR", { month: "long" })}`;
  const sunLabel = `Dimanche ${sun.getDate()} ${sun.toLocaleDateString("fr-FR", { month: "long" })}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SportLink — Matchs du week-end</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f8fafc;">
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0"
  style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:#0F1E3A;padding:20px 28px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:28px;height:28px;background:#22C55E;border-radius:7px;"></div>
        <div>
          <div style="color:#fff;font-weight:800;font-size:15px;letter-spacing:-0.3px;">SportLink</div>
          <div style="color:#64748b;font-size:10px;">Finistère · Sports</div>
        </div>
      </div>
    </td>
  </tr>

  <!-- Intro -->
  <tr>
    <td style="padding:22px 28px 8px;">
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">Bonjour ${name} 👋</p>
      <h1 style="margin:0 0 8px;font-size:18px;color:#0F1E3A;font-weight:700;line-height:1.3;">
        Les matchs de ce week-end
      </h1>
      <p style="margin:0;font-size:13px;color:#64748b;">
        <strong style="color:#0F1E3A;">${events.length} événement${events.length > 1 ? "s" : ""}</strong>
        en Finistère ·
        ${fmtDay(sat).replace(/^\w/, c => c.toUpperCase())} &amp; ${fmtDay(sun)}
      </p>
    </td>
  </tr>

  ${daySection(satLabel, satEvs)}
  ${daySection(sunLabel, sunEvs)}

  <!-- CTA -->
  <tr>
    <td style="padding:20px 28px 8px;">
      <a href="${appUrl}"
        style="display:block;text-align:center;background:#22C55E;color:#fff;text-decoration:none;
               padding:13px 24px;border-radius:12px;font-weight:700;font-size:14px;">
        Voir tous les événements →
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:14px 28px 22px;border-top:1px solid #f1f5f9;margin-top:8px;">
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.7;">
        Tu reçois cet email car tu as activé le digest hebdo sur SportLink.<br>
        <a href="${appUrl}" style="color:#22C55E;text-decoration:none;">Gérer mes préférences</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Protection : vérifier le secret partagé (appelé uniquement par pg_cron ou admin)
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const providedSecret = authHeader.replace("Bearer ", "");
    if (providedSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const appUrl    = Deno.env.get("APP_URL") ?? "https://sport-map.vercel.app";
    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "digest@sportlink.fr";

    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
    }

    const { sat, sun } = getWeekend();

    // Fetch weekend events
    const { data: events, error: evErr } = await supabase
      .from("events")
      .select("id,title,sport,date,city,event_type,team_name,category")
      .gte("date", sat.toISOString())
      .lte("date", sun.toISOString())
      .order("date", { ascending: true });

    if (evErr) throw evErr;

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "No events this weekend" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch opted-in profiles
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("digest_opt_in", true);

    if (profErr) throw profErr;

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "No subscribers" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    // Get user emails via admin API
    const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw usersErr;

    const emailMap: Record<string, string> = {};
    for (const u of users) {
      if (u.email) emailMap[u.id] = u.email;
    }

    // Send emails
    let sent = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      const email = emailMap[profile.id];
      if (!email) continue;

      const html    = buildHtml(profile.name || "sportif", events, sat, sun, appUrl);
      const subject = `🏆 ${events.length} match${events.length > 1 ? "s" : ""} ce week-end en Finistère`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: `SportLink <${fromEmail}>`, to: [email], subject, html }),
      });

      if (res.ok) {
        sent++;
      } else {
        errors.push(`${email}: ${await res.text()}`);
      }
    }

    return new Response(JSON.stringify({ sent, total: profiles.length, errors }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[digest] Fatal:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
