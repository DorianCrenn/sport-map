/**
 * Edge Function : process-scheduled-announcements
 *
 * Runs every 15 minutes via pg_cron (see migration 20260527_scheduled_ann_notified.sql).
 * Can also be called manually for testing.
 *
 * What it does:
 *   1. Finds club_announcements where scheduled_for <= NOW() AND notified_at IS NULL
 *   2. For each announcement, fetches club followers who should receive it (team filtering)
 *   3. Sends a Web Push notification to each eligible subscriber (if VAPID keys are set)
 *   4. Marks the announcement notified_at = NOW()
 *
 * Requires (Supabase Dashboard → Edge Functions → Secrets):
 *   VAPID_SUBJECT    = "mailto:admin@sportlink.app"
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 * Optional — function works without VAPID keys, it just skips push sending.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const prelight = handleOptions(req); if (prelight) return prelight;
  const ch = corsHeaders(req);

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    // ── 1. Fetch due unnotified announcements ────────────────────────────────
    const { data: announcements, error: annErr } = await serviceClient
      .from('club_announcements')
      .select('id, club_id, club_name, title, message, type, target_teams, scheduled_for')
      .lte('scheduled_for', new Date().toISOString())
      .is('notified_at', null)
      .order('scheduled_for', { ascending: true })
      .limit(100);

    if (annErr) throw new Error(annErr.message);
    if (!announcements || announcements.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...ch, 'Content-Type': 'application/json' },
      });
    }

    const vapidConfigured = !!(
      Deno.env.get('VAPID_PUBLIC_KEY') &&
      Deno.env.get('VAPID_PRIVATE_KEY')
    );

    // Lazy-import webpush only if VAPID keys are present
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

    let totalNotified = 0;
    let totalPushSent = 0;

    for (const ann of announcements) {
      try {
        // ── 2. Find eligible club followers ──────────────────────────────────
        const { data: follows } = await serviceClient
          .from('club_follows')
          .select('user_id, teams, notif')
          .eq('club_id', ann.club_id)
          .eq('notif', true); // only users who opted in to notifications

        const eligible = (follows ?? []).filter(f => {
          if (!ann.target_teams || ann.target_teams.length === 0) return true;
          if (f.teams === 'all') return true;
          return ann.target_teams.some((t: string) =>
            Array.isArray(f.teams) && f.teams.includes(t)
          );
        });

        // ── 3. Send push notifications (best-effort) ─────────────────────────
        if (webpush && eligible.length > 0) {
          const userIds = eligible.map(f => f.user_id);
          const { data: subs } = await serviceClient
            .from('push_subscriptions')
            .select('user_id, endpoint, p256dh, auth')
            .in('user_id', userIds);

          const payload = JSON.stringify({
            title: ann.club_name
              ? `${ann.club_name} — ${ann.title || 'Annonce'}`
              : ann.title || 'Nouvelle annonce',
            body:  ann.message?.slice(0, 120) ?? '',
            url:   '/',
            tag:   `announcement-${ann.id}`,
          });

          const pushResults = await Promise.allSettled(
            (subs ?? []).map(sub =>
              webpush!.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload,
              )
            )
          );
          totalPushSent += pushResults.filter(r => r.status === 'fulfilled').length;
        }

        // ── 4. Mark announcement as notified ─────────────────────────────────
        await serviceClient
          .from('club_announcements')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', ann.id);

        totalNotified++;
      } catch (innerErr) {
        // Don't abort the whole batch if one announcement fails
        console.error(`[process-scheduled-announcements] failed on ${ann.id}:`, innerErr);
      }
    }

    return new Response(
      JSON.stringify({ processed: totalNotified, pushSent: totalPushSent }),
      { headers: { ...ch, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...ch, 'Content-Type': 'application/json' },
    });
  }
});
