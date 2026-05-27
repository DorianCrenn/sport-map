/**
 * Shared rate-limiting helper for SportLink Edge Functions.
 * Uses the `api_rate_limits` table as a sliding-window counter.
 *
 * Usage:
 *   import { checkRateLimit } from '../_shared/rateLimit.ts';
 *   const limited = await checkRateLimit(serviceClient, userId, 'generate-variant-bg', 10, 60);
 *   if (limited) return new Response(JSON.stringify({ error: 'Too Many Requests' }), { status: 429, ... });
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Returns true if the caller has exceeded the rate limit.
 *
 * @param client         Service-role Supabase client (bypasses RLS)
 * @param userId         Caller's user ID (used as the rate-limit key)
 * @param endpoint       Function/endpoint name (e.g. "generate-variant-bg")
 * @param maxRequests    Maximum requests allowed within the window
 * @param windowSeconds  Sliding window size in seconds
 */
export async function checkRateLimit(
  client: SupabaseClient,
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const key       = `${endpoint}:${userId}`;
  const windowAgo = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Count existing requests in the window
  const { count, error: countErr } = await client
    .from('api_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowAgo);

  if (countErr) {
    // If the table is unavailable, fail open (don't block the request)
    console.warn('[rateLimit] count error:', countErr.message);
    return false;
  }

  if ((count ?? 0) >= maxRequests) {
    return true; // rate limited
  }

  // Record this request
  await client.from('api_rate_limits').insert({ key, endpoint });
  return false;
}
