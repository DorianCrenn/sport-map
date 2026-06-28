/**
 * Edge Function : notify-team-players
 *
 * Sends a Web Push to a targeted group within a club:
 *   target='team'  → all players of a given team_id
 *   target='event' → all players convocated for a given event_id
 *   target='all'   → all players of the club
 *
 * POST /functions/v1/notify-team-players
 * Body: { club_id, title, body, url?, tag?, target, team_id?, event_id? }
 * Auth: Bearer <user JWT> — caller must be club owner or manager.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    const { data: { user: caller }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const {
      club_id, title, body,
      url = '/', tag = 'sportlink-push',
      target = 'all', team_id, event_id,
    } = await req.json();

    if (!club_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'club_id, title and body are required' }), {
        status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── Authorization ─────────────────────────────────────────────────────────
    const [{ data: club }, { data: managerRow }, { data: profile }] = await Promise.all([
      serviceClient.from('clubs').select('user_id').eq('id', club_id).single(),
      serviceClient.from('club_managers')
        .select('role').eq('club_id', String(club_id)).ilike('email', caller.email ?? '').maybeSingle(),
      serviceClient.from('profiles').select('role').eq('id', caller.id).single(),
    ]);

    const isOwner   = club?.user_id === caller.id;
    const isManager = !!managerRow;
    const isAdmin   = profile?.role === 'admin' || profile?.role === 'superadmin';
    if (!isOwner && !isManager && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // ── Resolve target user IDs ───────────────────────────────────────────────
    let userIds: string[] = [];

    if (target === 'event' && event_id) {
      const { data: rows } = await serviceClient
        .from('event_convocations')
        .select('user_id')
        .eq('event_id', String(event_id))
        .not('user_id', 'is', null);
      userIds = (rows ?? []).map((r: any) => r.user_id).filter(Boolean);
    } else if (target === 'team' && team_id) {
      const { data: rows } = await serviceClient
        .from('club_players')
        .select('user_id')
        .eq('club_id', String(club_id))
        .eq('team_id', String(team_id))
        .not('user_id', 'is', null);
      userIds = (rows ?? []).map((r: any) => r.user_id).filter(Boolean);
    } else {
      const { data: rows } = await serviceClient
        .from('club_players')
        .select('user_id')
        .eq('club_id', String(club_id))
        .not('user_id', 'is', null);
      userIds = (rows ?? []).map((r: any) => r.user_id).filter(Boolean);
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_targets' }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // ── VAPID check ───────────────────────────────────────────────────────────
    const vapidConfigured = !!(Deno.env.get('VAPID_PUBLIC_KEY') && Deno.env.get('VAPID_PRIVATE_KEY'));
    if (!vapidConfigured) {
      return new Response(JSON.stringify({ sent: 0, skipped: 'VAPID not configured' }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // @ts-ignore dynamic import
    const webpush = await import('https://esm.sh/web-push@3.6.7');
    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@sportlink.app',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    );

    const { data: subs } = await serviceClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_push_subscriptions' }), {
        headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, url, tag });
    const results = await Promise.allSettled(
      subs.map((sub: any) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      )
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return new Response(JSON.stringify({ sent, failed, total: userIds.length }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
