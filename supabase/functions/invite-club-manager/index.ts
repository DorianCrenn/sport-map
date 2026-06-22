import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions, checkCsrfOrigin } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

Deno.serve(async (req) => {
  const prelight = handleOptions(req); if (prelight) return prelight;
  const ch = corsHeaders(req);

  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supaUrl, supaKey);

  // ── Auth : JWT obligatoire ─────────────────────────────────────────────────
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

  // Vérifier que l'inviteur est bien admin ou manager du club
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role, club_id")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = ["admin", "superadmin"].includes(profile?.role ?? "");

  try {
    const { email, clubId, clubName, role, inviterName } = await req.json();
    if (!email || !clubId) {
      return new Response(JSON.stringify({ error: "email and clubId are required" }), {
        status: 400, headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    if (!isAdmin) {
      const isClubAdmin = profile?.role === "club_admin" && profile?.club_id === clubId;
      if (!isClubAdmin) {
        const { data: managerRow } = await serviceClient
          .from("club_managers")
          .select("id")
          .eq("club_id", clubId)
          .eq("email", user.email)
          .eq("status", "active")
          .in("role", ["owner", "manager"])
          .maybeSingle();

        if (!managerRow) {
          return new Response(JSON.stringify({ error: "Vous n'êtes pas autorisé à inviter des gestionnaires pour ce club" }), {
            status: 403, headers: { ...ch, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Rate limit : 10 invitations/heure par utilisateur
    const limited = await checkRateLimit(serviceClient, user.id, "invite-club-manager", 10, 3600);
    if (limited) {
      return new Response(JSON.stringify({ error: "Limite atteinte — 10 invitations par heure maximum." }), {
        status: 429, headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@sportlink.fr";
    const appUrl    = Deno.env.get("APP_URL")    ?? "https://sportlink.fr";

    if (!resendKey) {
      console.warn("[invite-manager] RESEND_API_KEY not set — skipping email");
      return new Response(JSON.stringify({ sent: false, reason: "RESEND_API_KEY missing" }), {
        headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    const roleLabels: Record<string, string> = {
      manager:      "Manager (accès complet)",
      editor:       "Éditeur (événements + affiches)",
      communicant:  "Communicant (annonces)",
    };

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#0F1E3A;padding:28px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">⚽</div>
      <h1 style="margin:0;color:white;font-size:20px;font-weight:800;">Invitation SportLink</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        Bonjour,
      </p>
      <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
        <strong>${inviterName ?? "Un administrateur"}</strong> t'a ajouté(e) comme
        <strong>${roleLabels[role] ?? role}</strong> du club
        <strong>${clubName ?? clubId}</strong> sur SportLink.
      </p>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
        Crée ton compte ou connecte-toi avec cet email (<strong>${email}</strong>) pour accéder au tableau de bord du club.
      </p>
      <!-- CTA -->
      <a href="${appUrl}" style="display:block;text-align:center;padding:14px;background:#22D96A;color:white;font-weight:800;font-size:16px;text-decoration:none;border-radius:14px;">
        Accéder à SportLink
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
        Si tu ne connais pas ce club, ignore cet email.
      </p>
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;background:#f8fafc;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        SportLink — La communauté sport en Finistère
      </p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    `SportLink <${fromEmail}>`,
        to:      [email],
        subject: `Tu es invité(e) à gérer ${clubName ?? "un club"} sur SportLink`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[invite-manager] Resend error:", err);
      return new Response(JSON.stringify({ sent: false, error: err }), {
        status: 500, headers: { ...ch, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...ch, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[invite-manager] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...ch, "Content-Type": "application/json" },
    });
  }
});
