import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventType = "verified" | "rejected" | "info_requested" | "suspended";

interface StatusConfig {
  notifType:  string;
  notifTitle: string;
  notifBody:  (club: string, note?: string) => string;
  subject:    (club: string) => string;
  emoji:      string;
  bodyHtml:   (club: string, note?: string, appUrl?: string) => string;
}

const STATUS_CONFIG: Record<EventType, StatusConfig> = {
  verified: {
    notifType:  "club_verified",
    notifTitle: "Club vérifié !",
    notifBody:  (club) => `${club} est maintenant vérifié sur SportLink. 🎉`,
    subject:    (club) => `Votre club ${club} est vérifié sur SportLink !`,
    emoji:      "✅",
    bodyHtml: (club, _note, appUrl) => `
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        Excellente nouvelle ! Votre club <strong>${club}</strong> a été vérifié par notre équipe.
        Votre page club est maintenant officielle sur SportLink.
      </p>
      <a href="${appUrl}" style="display:block;text-align:center;padding:14px;background:#22D96A;color:white;font-weight:800;font-size:16px;text-decoration:none;border-radius:14px;">
        Voir ma page club
      </a>`,
  },
  rejected: {
    notifType:  "club_rejected",
    notifTitle: "Demande de club non retenue",
    notifBody:  (club, note) => `${club} : ${note || "Votre demande n'a pas été retenue."}`,
    subject:    (club) => `Votre demande pour ${club} sur SportLink`,
    emoji:      "❌",
    bodyHtml: (club, note, appUrl) => `
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        Après examen de votre dossier, votre demande de club <strong>${club}</strong> n'a pas pu être retenue.
      </p>
      ${note ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.6;"><strong>Motif :</strong> ${note}</p>
      </div>` : ''}
      <p style="margin:0 0 24px;color:#334155;font-size:14px;line-height:1.6;">
        Si vous pensez qu'il s'agit d'une erreur ou souhaitez apporter des précisions, contactez-nous via l'application.
      </p>
      <a href="${appUrl}" style="display:block;text-align:center;padding:14px;background:#0F1E3A;color:white;font-weight:800;font-size:16px;text-decoration:none;border-radius:14px;">
        Contacter le support
      </a>`,
  },
  info_requested: {
    notifType:  "club_info_requested",
    notifTitle: "Informations requises",
    notifBody:  (club, note) => `Des informations complémentaires sont requises pour ${club}.`,
    subject:    (club) => `Informations complémentaires requises — ${club}`,
    emoji:      "ℹ️",
    bodyHtml: (club, note, appUrl) => `
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        Notre équipe a besoin d'informations complémentaires pour finaliser la vérification de <strong>${club}</strong>.
      </p>
      ${note ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;"><strong>Information demandée :</strong> ${note}</p>
      </div>` : ''}
      <a href="${appUrl}" style="display:block;text-align:center;padding:14px;background:#22D96A;color:white;font-weight:800;font-size:16px;text-decoration:none;border-radius:14px;">
        Mettre à jour mon club
      </a>`,
  },
  suspended: {
    notifType:  "club_suspended",
    notifTitle: "Club suspendu",
    notifBody:  (club, note) => `${club} a été temporairement suspendu.`,
    subject:    (club) => `Le club ${club} a été suspendu sur SportLink`,
    emoji:      "⏸️",
    bodyHtml: (club, note, appUrl) => `
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        Votre club <strong>${club}</strong> a été temporairement suspendu sur SportLink.
      </p>
      ${note ? `
      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:14px;padding:18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;"><strong>Motif :</strong> ${note}</p>
      </div>` : ''}
      <a href="${appUrl}" style="display:block;text-align:center;padding:14px;background:#0F1E3A;color:white;font-weight:800;font-size:16px;text-decoration:none;border-radius:14px;">
        Contacter le support
      </a>`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { club_id, event_type, note } = await req.json() as { club_id: string; event_type: EventType; note?: string };

    if (!club_id || !event_type) {
      return new Response(JSON.stringify({ error: "club_id and event_type required" }), { status: 400, headers: corsHeaders });
    }

    const config = STATUS_CONFIG[event_type];
    if (!config) {
      return new Response(JSON.stringify({ error: "Invalid event_type" }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey   = Deno.env.get("RESEND_API_KEY");
    const fromEmail   = Deno.env.get("FROM_EMAIL") ?? "noreply@sportlink.fr";
    const appUrl      = Deno.env.get("APP_URL")    ?? "https://sportlink.fr";

    // Vérifier que l'appelant est admin
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const admin = createClient(supabaseUrl, serviceKey);

    // Vérifier le rôle admin
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "superadmin"].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Récupérer le club + son propriétaire
    const { data: club, error: clubErr } = await admin
      .from("clubs")
      .select("id, name, sport, city, email, user_id")
      .eq("id", club_id)
      .single();

    if (clubErr || !club) {
      return new Response(JSON.stringify({ error: "Club not found" }), { status: 404, headers: corsHeaders });
    }

    // Récupérer l'email du propriétaire
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("name")
      .eq("id", club.user_id)
      .single();

    // Notification in-app pour le propriétaire
    await admin.from("club_notifications").insert({
      user_id:  club.user_id,
      type:     config.notifType,
      club_id:  club.id,
      title:    config.notifTitle,
      body:     config.notifBody(club.name, note),
    });

    // Email (si RESEND_API_KEY configuré)
    if (!resendKey) {
      console.warn("[notify-club-status] RESEND_API_KEY not set — skipping email");
      return new Response(JSON.stringify({ sent: false, reason: "RESEND_API_KEY missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerEmail = club.email;
    if (ownerEmail) {
      const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0F1E3A;padding:28px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">${config.emoji}</div>
      <h1 style="margin:0;color:white;font-size:20px;font-weight:800;">${config.notifTitle}</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">Bonjour${ownerProfile?.name ? ` ${ownerProfile.name}` : ''},</p>
      ${config.bodyHtml(club.name, note, appUrl)}
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
        Si vous ne reconnaissez pas cette action, ignorez cet email.
      </p>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">SportLink — La communauté sport</p>
    </div>
  </div>
</body></html>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    `SportLink <${fromEmail}>`,
          to:      [ownerEmail],
          subject: config.subject(club.name),
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[notify-club-status] Resend error:", err);
      }
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[notify-club-status] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
