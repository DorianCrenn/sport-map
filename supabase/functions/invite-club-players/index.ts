// ============================================================
// invite-club-players — invite les joueurs/familles d'un club par email.
// Pour chaque joueur du roster ayant un email : crée un token d'invitation et
// envoie un mail avec un lien magique (#join-player/:token). À l'acceptation
// (RPC accept_player_invite), l'utilisateur est auto-rattaché à sa fiche.
// Réservé aux managers/admins du club. Reuse : CORS + Resend (comme les convocs).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleOptions, checkCsrfOrigin } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

interface InvitePayload {
  clubId:    string;
  clubName?: string;
  // Optionnel : sous-ensemble de joueurs. Sinon → tous les joueurs du club
  // ayant un email et pas encore rattachés.
  playerIds?: string[];
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;
  const csrfErr = checkCsrfOrigin(req);
  if (csrfErr) return csrfErr;
  const ch = corsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...ch, "Content-Type": "application/json" } });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "invitations@sportlink.fr";
  const appUrl    = Deno.env.get("APP_URL")    ?? "https://sportlink.fr";
  const supaUrl   = Deno.env.get("SUPABASE_URL")!;
  const supaKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase  = createClient(supaUrl, supaKey);

  // ── Auth : manager/admin uniquement ──────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const anonClient = createClient(supaUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await anonClient.auth.getUser();
  if (authErr || !user) return json({ error: "Authentification requise" }, 401);

  const rl = await checkRateLimit(supabase, user.id, "invite-club-players", 20, 3600);
  if (rl) return json({ error: "Trop de requêtes, réessayez plus tard." }, 429);

  let payload: InvitePayload;
  try { payload = await req.json(); } catch { return json({ error: "Corps invalide" }, 400); }
  const { clubId, playerIds } = payload;
  if (!clubId) return json({ error: "clubId requis" }, 400);

  // Le user est-il autorisé pour ce club ?
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = profile && ["admin", "superadmin"].includes(profile.role);
  let allowed = !!isAdmin;
  if (!allowed) {
    const { data: club } = await supabase.from("clubs").select("id,name,user_id").eq("id", clubId).maybeSingle();
    if (club?.user_id === user.id) allowed = true;
    if (!allowed) {
      const { data: mgr } = await supabase
        .from("club_managers").select("id")
        .eq("club_id", clubId).eq("email", user.email).eq("status", "active")
        .in("role", ["owner", "manager", "editor"]).maybeSingle();
      allowed = !!mgr;
    }
  }
  if (!allowed) return json({ error: "Accès refusé pour ce club" }, 403);

  const { data: clubRow } = await supabase.from("clubs").select("name").eq("id", clubId).maybeSingle();
  const clubName = payload.clubName ?? clubRow?.name ?? "votre club";

  // ── Joueurs à inviter : email présent + pas encore rattaché ──────────────
  let q = supabase.from("club_players")
    .select("id, name, email, user_id")
    .eq("club_id", clubId)
    .not("email", "is", null)
    .is("user_id", null);
  if (playerIds?.length) q = q.in("id", playerIds);
  const { data: players, error: playersErr } = await q;
  if (playersErr) return json({ error: playersErr.message }, 500);
  if (!players?.length) return json({ sent: 0, message: "Aucun joueur avec email à inviter." });

  let sent = 0;
  const failures: string[] = [];
  for (const p of players) {
    const { data: tokenRow, error: tokErr } = await supabase
      .from("player_invite_tokens")
      .insert({ player_id: p.id, club_id: clubId, email: p.email })
      .select("token").maybeSingle();
    if (tokErr || !tokenRow) { failures.push(p.email); continue; }

    const link = `${appUrl}/#join-player/${tokenRow.token}`;
    if (!resendKey) { sent++; continue; } // pas de clé → token créé, mail à envoyer manuellement

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0F1E3A">${clubName} t'invite sur SportLink</h2>
        <p>Bonjour ${p.name ?? ""},</p>
        <p><strong>${clubName}</strong> t'a ajouté à son effectif. Rejoins SportLink pour recevoir tes convocations, voir tes matchs et le covoiturage — en un clic tu seras déjà rattaché(e) à ta fiche.</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${link}" style="background:#22C55E;color:#fff;padding:13px 26px;border-radius:12px;text-decoration:none;font-weight:700">Rejoindre mon équipe</a>
        </p>
        <p style="color:#64748b;font-size:12px">Si tu n'es pas concerné(e), ignore cet email. Lien valable 30 jours.</p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `SportLink <${fromEmail}>`, to: p.email, subject: `${clubName} t'invite à rejoindre ton équipe`, html }),
    });
    if (res.ok) sent++;
    else { failures.push(p.email); console.error(`[invite-players] Resend error for ${p.email}:`, await res.text()); }
  }

  return json({ sent, total: players.length, failures });
});
