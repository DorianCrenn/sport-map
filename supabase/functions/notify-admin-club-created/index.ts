import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { club_id } = await req.json();
    if (!club_id) return new Response(JSON.stringify({ error: "club_id required" }), { status: 400, headers: corsHeaders });

    const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
    const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey    = Deno.env.get("RESEND_API_KEY");
    const fromEmail    = Deno.env.get("FROM_EMAIL") ?? "noreply@sportlink.fr";
    const appUrl       = Deno.env.get("APP_URL")    ?? "https://sportlink.fr";

    // Client appelant (vérifie que l'utilisateur est propriétaire du club)
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Client service role — accès complet pour les inserts de notifs
    const admin = createClient(supabaseUrl, serviceKey);

    // Récupérer le club
    const { data: club, error: clubErr } = await admin
      .from("clubs")
      .select("id, name, sport, city, email, user_id, manager_name")
      .eq("id", club_id)
      .single();

    if (clubErr || !club) {
      return new Response(JSON.stringify({ error: "Club not found" }), { status: 404, headers: corsHeaders });
    }
    if (club.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Récupérer tous les admins
    const { data: admins } = await admin
      .from("profiles")
      .select("id, name, email")
      .in("role", ["admin", "superadmin"]);

    const adminList = admins ?? [];

    // Insérer notification in-app pour chaque admin
    if (adminList.length > 0) {
      await admin.from("club_notifications").insert(
        adminList.map(a => ({
          user_id:    a.id,
          type:       "new_club_pending",
          club_id:    club.id,
          title:      "Nouveau club à vérifier",
          body:       `${club.name} (${club.city}) — ${club.sport}`,
        }))
      );
    }

    // Notification de confirmation pour le créateur
    await admin.from("club_notifications").insert({
      user_id:  user.id,
      type:     "club_created_confirm",
      club_id:  club.id,
      title:    "Club créé avec succès !",
      body:     `${club.name} est en cours de vérification. Vous pouvez dès maintenant utiliser SportLink.`,
    });

    // Emails (optionnel si RESEND_API_KEY absent)
    if (!resendKey) {
      console.warn("[notify-club-created] RESEND_API_KEY not set — skipping emails");
      return new Response(JSON.stringify({ notified: adminList.length, emailSent: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Email aux admins
    const adminEmails = adminList.map(a => a.email).filter(Boolean);
    if (adminEmails.length > 0) {
      const adminHtml = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0F1E3A;padding:28px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🏟️</div>
      <h1 style="margin:0;color:white;font-size:20px;font-weight:800;">Nouveau club à vérifier</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        Un nouveau club vient d'être créé sur SportLink et attend votre validation.
      </p>
      <div style="background:#f8fafc;border-radius:14px;padding:18px;margin-bottom:24px;">
        <div style="font-weight:800;font-size:17px;color:#0F1E3A;margin-bottom:4px;">${club.name}</div>
        <div style="font-size:13px;color:#64748b;">${club.sport} · ${club.city}</div>
        ${club.manager_name ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">Responsable : ${club.manager_name}</div>` : ''}
      </div>
      <a href="${appUrl}" style="display:block;text-align:center;padding:14px;background:#22D96A;color:white;font-weight:800;font-size:16px;text-decoration:none;border-radius:14px;">
        Accéder au back-office
      </a>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">SportLink — Administration</p>
    </div>
  </div>
</body></html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    `SportLink <${fromEmail}>`,
          to:      adminEmails,
          subject: `[SportLink] Nouveau club à vérifier : ${club.name}`,
          html:    adminHtml,
        }),
      }).catch(e => console.warn("[notify-club-created] Admin email failed:", e.message));
    }

    // Email de confirmation au créateur
    const creatorEmail = club.email || user.email;
    if (creatorEmail) {
      const confirmHtml = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0F1E3A,#22C55E);padding:28px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🎉</div>
      <h1 style="margin:0;color:white;font-size:20px;font-weight:800;">Club créé avec succès !</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        Bonjour,
      </p>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        Votre club <strong>${club.name}</strong> a bien été créé sur SportLink.
        Vous pouvez dès maintenant commencer à l'utiliser.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
          Notre équipe vérifiera les informations fournies dans les meilleurs délais (généralement sous 48h).
          Vous recevrez un email de confirmation une fois la vérification effectuée.
        </p>
      </div>
      <a href="${appUrl}" style="display:block;text-align:center;padding:14px;background:#22D96A;color:white;font-weight:800;font-size:16px;text-decoration:none;border-radius:14px;">
        Accéder à mon club
      </a>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">SportLink — La communauté sport</p>
    </div>
  </div>
</body></html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    `SportLink <${fromEmail}>`,
          to:      [creatorEmail],
          subject: `Bienvenue sur SportLink — ${club.name} est en cours de vérification`,
          html:    confirmHtml,
        }),
      }).catch(e => console.warn("[notify-club-created] Creator email failed:", e.message));
    }

    return new Response(JSON.stringify({ notified: adminList.length, emailSent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[notify-club-created] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
