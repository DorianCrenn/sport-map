/**
 * Edge Function : send-push
 * Déclenche une notification Web Push à tous les appareils enregistrés d'un user.
 *
 * POST /functions/v1/send-push
 * Body: { user_id: string, title: string, body: string, url?: string, tag?: string }
 *
 * Variables d'environnement requises (Supabase Dashboard → Edge Functions → Secrets) :
 *   VAPID_SUBJECT   = "mailto:admin@sportlink.app"
 *   VAPID_PUBLIC_KEY  = <clé publique Base64URL>
 *   VAPID_PRIVATE_KEY = <clé privée Base64URL>
 *   SUPABASE_SERVICE_ROLE_KEY (injecté automatiquement)
 *   SUPABASE_URL              (injecté automatiquement)
 *
 * Générer les clés : npx web-push generate-vapid-keys
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, url = '/', tag = 'sportlink-push' } = await req.json();
    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: 'user_id and title are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Configure web-push avec les clés VAPID
    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT')     ?? 'mailto:admin@sportlink.app',
      Deno.env.get('VAPID_PUBLIC_KEY')  ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
    );

    // Récupérer les souscriptions de cet utilisateur (service role pour bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id);

    if (error) throw new Error(error.message);
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, url, tag });
    const results = await Promise.allSettled(
      subs.map(({ endpoint, p256dh, auth: authKey }) =>
        webpush.sendNotification(
          { endpoint, keys: { p256dh, auth: authKey } },
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
