/**
 * Edge Function : notify-club-followers
 *
 * Sends a Web Push notification to all followers of a club who have notif=true.
 * Called from the frontend after:
 *   - A score is published on an event (PUSH-PROD-001b)
 *   - A new immediate announcement is created (PUSH-PROD-001c)
 *
 * POST /functions/v1/notify-club-followers
 * Body: { club_id: string, title: string, body: string, url?: string, tag?: string }
 * Auth: Bearer <user JWT> — caller must be club owner or manager for that club.
 *
 * Requires (Supabase Dashboard → Edge Functions → Secrets):
 *   VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    const { data: { user: caller }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { club_id, title, body, url = '/', tag = 'sportlink-club' } = await req.json();
    if (!club_id || !title) {
      return new Response(JSON.stringify({ error: 'club_id and title are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── Authorization: caller must be club owner, manager, or platform admin ─
    const [{ data: club }, { data: managerRow }, { data: profile }] = await Promise.all([
      serviceClient.from('clubs').select('user_id').eq('id', club_id).single(),
      serviceClient.from('club_managers')
        .select('role')
        .eq('club_id', String(club_id))
        .ilike('email', caller.email ?? '')
        .single(),
      serviceClient.from('profiles').select('role').eq('id', caller.id).single(),
    ]);

    const isOwner    = club?.user_id === caller.id;
    const isManager  = !!managerRow;
    const isAdmin    = profile?.role === 'admin' || profile?.role === 'superadmin';

    if (!isOwner && !isManager && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: not a club owner or manager' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── VAPID check ───────────────────────────────────────────────────────────
    const vapidConfigured = !!(
      Deno.env.get('VAPID_PUBLIC_KEY') &&
      Deno.env.get('VAPID_PRIVATE_KEY')
    );

    if (!vapidConfigured) {
      return new Response(JSON.stringify({ sent: 0, skipped: 'VAPID not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // @ts-ignore dynamic import
    const webpush = await import('https://esm.sh/web-push@3.6.7');
    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@sportlink.app',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    );

    // ── Fetch followers with notifications enabled ────────────────────────────
    const { data: follows } = await serviceClient
      .from('club_follows')
      .select('user_id')
      .eq('club_id', String(club_id))
      .eq('notif', true);

    if (!follows || follows.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIds = follows.map(f => f.user_id);
    const { data: subs } = await serviceClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, url, tag });
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      )
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
