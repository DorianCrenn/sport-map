/**
 * Shared helper — Vérifie que le plan d'abonnement d'un club autorise la génération IA.
 *
 * Plans autorisant l'IA générative (POSTER_AI_BACKGROUND / POSTER_AI_BRANDING) :
 *   - elite : illimité
 *
 * Plans refusés :
 *   - free, starter, pro : aiGeneratesPerMonth = 0
 *   - plan inconnu ou absent → refus (fail closed)
 *
 * Usage :
 *   const check = await checkClubAIPlan(serviceClient, clubId, userId);
 *   if (!check.allowed) return new Response(JSON.stringify({ error: check.reason }), { status: 403, ... });
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AI_ALLOWED_PLANS = new Set(['elite']);

interface CheckResult {
  allowed: boolean;
  reason: string;
  plan: string | null;
}

/**
 * Vérifie si un club peut utiliser la génération IA avancée.
 *
 * @param client   Service-role Supabase client
 * @param clubId   ID du club (string ou null — si null, refus par défaut)
 * @param userId   ID de l'utilisateur authentifié (fallback : cherche via profiles)
 */
export async function checkClubAIPlan(
  client: SupabaseClient,
  clubId: string | null | undefined,
  userId?: string | null,
): Promise<CheckResult> {
  // Si pas de clubId, on tente de le résoudre via le profil utilisateur
  let resolvedClubId = clubId;

  if (!resolvedClubId && userId) {
    const { data: profile } = await client
      .from('profiles')
      .select('club_id')
      .eq('id', userId)
      .maybeSingle();
    resolvedClubId = profile?.club_id ?? null;
  }

  if (!resolvedClubId) {
    return { allowed: false, reason: 'Club ID requis pour la génération IA', plan: null };
  }

  // Lecture du plan actif dans club_subscriptions
  const { data: sub, error } = await client
    .from('club_subscriptions')
    .select('plan, status')
    .eq('club_id', String(resolvedClubId))
    .maybeSingle();

  if (error) {
    // En cas d'erreur DB → fail closed (refus prudent)
    console.warn('[checkClubAIPlan] DB error:', error.message);
    return { allowed: false, reason: 'Vérification du plan impossible', plan: null };
  }

  const isActive = sub?.status === 'active' || sub?.status === 'trialing';
  const plan = isActive ? (sub?.plan ?? 'free') : 'free';

  if (!AI_ALLOWED_PLANS.has(plan)) {
    return {
      allowed: false,
      reason: `Plan "${plan}" ne donne pas accès à la génération IA avancée. Plan Elite requis.`,
      plan,
    };
  }

  return { allowed: true, reason: 'OK', plan };
}
