// Edge Function : match-reminders
// Sends "Match in 2h" push notifications to followers of clubs with upcoming events.
// Run via pg_cron every 30 min or call manually for testing.
//
// pg_cron: SELECT cron.schedule('match-reminders', '0,30 * * * *', $$...$$);

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
    const now = new Date();
    // Window: events starting between now+1h45 and now+2h15 (±15min around the 2h mark)
    const windowStart = new Date(now.getTime() + 105 * 60 * 1000); // +1h45
    const windowEnd   = new Date(now.getTime() + 135 * 60 * 1000); // +2h15

    // Fetch upcoming events in the time window that haven't been reminded yet
    // We filter by date (TEXT) so we need events whose date matches today or tomorrow
    // and where reminder_sent_at IS NULL
    const { data: events, error: evErr } = await serviceClient
      .from('events')
      .select('id, club_id, date, time, home_team, away_team, team_name, sport, title')
      .is('reminder_sent_at', null)
      .not('club_id', 'is', null)
      .gte('date', windowStart.toISOString().split('T')[0])
      .lte('date', windowEnd.toISOString().split('T')[0]);

    if (evErr) throw new Error(evErr.message);
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...ch, 'Content-Type': 'application/json' },
      });
    }

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

    let totalProcessed = 0;
    let totalPushSent = 0;

    for (const event of events) {
      try {
        // Parse event datetime
        const eventDate = event.date; // YYYY-MM-DD
        const eventTime = event.time ?? '00:00';
        const [hh, mm] = eventTime.split(':').map(Number);
        const eventDt = new Date(`${eventDate}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`);

        // Check if this event is actually in the 2h window
        const diffMs = eventDt.getTime() - now.getTime();
        if (diffMs < 105 * 60 * 1000 || diffMs > 135 * 60 * 1000) continue;

        // Mark as reminded first to avoid re-processing
        await serviceClient
          .from('events')
          .update({ reminder_sent_at: now.toISOString() })
          .eq('id', event.id);

        if (!webpush) { totalProcessed++; continue; }

        // Fetch followers of this club
        const { data: follows } = await serviceClient
          .from('club_follows')
          .select('user_id')
          .eq('club_id', String(event.club_id))
          .eq('notif', true);

        if (!follows || follows.length === 0) { totalProcessed++; continue; }

        const userIds = follows.map(f => f.user_id);
        const { data: subs } = await serviceClient
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .in('user_id', userIds);

        if (!subs || subs.length === 0) { totalProcessed++; continue; }

        const matchLabel =
          (event.home_team && event.away_team)
            ? `${event.home_team} vs ${event.away_team}`
            : (event.team_name || event.title || 'Match');

        const payload = JSON.stringify({
          title: 'Match dans 2h !',
          body:  `${matchLabel} — ${eventDate} à ${eventTime}`,
          url:   '/',
          tag:   `reminder-${event.id}`,
        });

        const pushResults = await Promise.allSettled(
          subs.map(sub =>
            webpush!.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
            )
          )
        );
        totalPushSent += pushResults.filter(r => r.status === 'fulfilled').length;
        totalProcessed++;
      } catch (innerErr) {
        console.error(`[match-reminders] failed on event ${event.id}:`, innerErr);
      }
    }

    return new Response(JSON.stringify({ processed: totalProcessed, pushSent: totalPushSent }), {
      headers: { ...ch, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...ch, 'Content-Type': 'application/json' },
    });
  }
});
