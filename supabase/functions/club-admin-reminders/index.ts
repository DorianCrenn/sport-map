/**
 * Edge Function : club-admin-reminders
 *
 * Sends push reminders to club owners about their upcoming or past events.
 * Run via pg_cron once a day (morning check) + once in the evening.
 *
 * What it does:
 *   1. J-1 (tomorrow's events): "Votre match est demain — créez l'affiche !"
 *   2. J (today's events, in the future): "C'est aujourd'hui ! Préparez l'affiche"
 *   3. Post-match (event past 1–3h, score=null): "Saisissez le score et partagez !"
 *
 * pg_cron setup (run once in SQL Editor):
 *   SELECT cron.schedule(
 *     'club-admin-reminders-morning', '0 8 * * *',
 *     $$SELECT net.http_post(url := ... || '/functions/v1/club-admin-reminders',
 *       headers := ..., body := '{"check":"all"}'::jsonb)$$
 *   );
 *   SELECT cron.schedule(
 *     'club-admin-reminders-evening', '0 20 * * *',
 *     $$SELECT net.http_post(url := ... || '/functions/v1/club-admin-reminders',
 *       headers := ..., body := '{"check":"post_match"}'::jsonb)$$
 *   );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

function todayStr()    { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }

Deno.serve(async (req) => {
  const prelight = handleOptions(req); if (prelight) return prelight;
  const ch = corsHeaders(req);

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  let body: { check?: string } = {};
  try { body = await req.json(); } catch { /* no body = all checks */ }
  const check = body.check ?? 'all';

  const vapidConfigured = !!(
    Deno.env.get('VAPID_PUBLIC_KEY') &&
    Deno.env.get('VAPID_PRIVATE_KEY')
  );

  let webpush: { setVapidDetails: Function; sendNotification: Function } | null = null;
  if (vapidConfigured) {
    // @ts-ignore dynamic import
    webpush = await import('https://esm.sh/web-push@3.6.7');
    webpush!.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@sportlink.app',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    );
  }

  async function getAdminNotifPrefs(clubId: string): Promise<Record<string, boolean>> {
    const { data } = await serviceClient
      .from('club_brand_kits')
      .select('admin_notif_prefs')
      .eq('club_id', clubId)
      .maybeSingle();
    return data?.admin_notif_prefs ?? { match_j1: true, match_today: true, post_match_score: true };
  }

  async function sendPushToUser(userId: string, title: string, body: string, url: string, tag: string) {
    if (!webpush) return 0;
    const { data: subs } = await serviceClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);
    if (!subs || subs.length === 0) return 0;
    const payload = JSON.stringify({ title, body, url, tag });
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush!.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      )
    );
    return results.filter(r => r.status === 'fulfilled').length;
  }

  let totalSent = 0;
  const now = new Date();

  try {
    // ── 1. J-1 reminder ──────────────────────────────────────────────────────
    if (check === 'all') {
      const { data: tmEvents } = await serviceClient
        .from('events')
        .select('id, club_id, home_team, away_team, team_name, title, time')
        .eq('date', tomorrowStr())
        .not('club_id', 'is', null);

      for (const ev of tmEvents ?? []) {
        try {
          const [{ data: club }, prefs] = await Promise.all([
            serviceClient.from('clubs').select('user_id, name').eq('id', ev.club_id).single(),
            getAdminNotifPrefs(String(ev.club_id)),
          ]);
          if (!club || !prefs.match_j1) continue;

          const matchLabel =
            ev.home_team && ev.away_team
              ? `${ev.home_team} vs ${ev.away_team}`
              : (ev.team_name || ev.title || 'Match');

          totalSent += await sendPushToUser(
            club.user_id,
            'Match demain — créez l\'affiche !',
            `${matchLabel}${ev.time ? ` à ${ev.time}` : ''} — préparez votre communication`,
            '/',
            `admin-j1-${ev.id}`,
          );
        } catch { /* continue */ }
      }
    }

    // ── 2. J (today) reminder ────────────────────────────────────────────────
    if (check === 'all') {
      const { data: todayEvents } = await serviceClient
        .from('events')
        .select('id, club_id, home_team, away_team, team_name, title, time')
        .eq('date', todayStr())
        .not('club_id', 'is', null);

      for (const ev of todayEvents ?? []) {
        try {
          const [hh, mm] = (ev.time ?? '23:59').split(':').map(Number);
          const evTime = new Date(now);
          evTime.setHours(hh, mm, 0, 0);
          if (evTime <= now) continue;

          const [{ data: club }, prefs] = await Promise.all([
            serviceClient.from('clubs').select('user_id, name').eq('id', ev.club_id).single(),
            getAdminNotifPrefs(String(ev.club_id)),
          ]);
          if (!club || !prefs.match_today) continue;

          const matchLabel =
            ev.home_team && ev.away_team
              ? `${ev.home_team} vs ${ev.away_team}`
              : (ev.team_name || ev.title || 'Match');

          totalSent += await sendPushToUser(
            club.user_id,
            'C\'est aujourd\'hui !',
            `${matchLabel}${ev.time ? ` à ${ev.time}` : ''} — partagez l\'affiche avant le coup d\'envoi`,
            '/',
            `admin-today-${ev.id}`,
          );
        } catch { /* continue */ }
      }
    }

    // ── 3. Post-match: score missing ─────────────────────────────────────────
    if (check === 'all' || check === 'post_match') {
      const { data: pastEvents } = await serviceClient
        .from('events')
        .select('id, club_id, home_team, away_team, team_name, title, time, score')
        .eq('date', todayStr())
        .is('score', null)
        .not('club_id', 'is', null);

      for (const ev of pastEvents ?? []) {
        try {
          const [hh, mm] = (ev.time ?? '00:00').split(':').map(Number);
          const evTime = new Date(now);
          evTime.setHours(hh, mm, 0, 0);
          const diffMs = now.getTime() - evTime.getTime();
          if (diffMs < 60 * 60 * 1000 || diffMs > 4 * 60 * 60 * 1000) continue;

          const [{ data: club }, prefs] = await Promise.all([
            serviceClient.from('clubs').select('user_id, name').eq('id', ev.club_id).single(),
            getAdminNotifPrefs(String(ev.club_id)),
          ]);
          if (!club || !prefs.post_match_score) continue;

          const matchLabel =
            ev.home_team && ev.away_team
              ? `${ev.home_team} vs ${ev.away_team}`
              : (ev.team_name || ev.title || 'Match');

          totalSent += await sendPushToUser(
            club.user_id,
            'Saisissez le score !',
            `${matchLabel} — publiez le résultat et partagez votre victoire`,
            '/',
            `admin-score-${ev.id}`,
          );
        } catch { /* continue */ }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { ...ch, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...ch, 'Content-Type': 'application/json' },
    });
  }
});
