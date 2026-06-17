import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  FEATURE_GATES as STATIC_FEATURE_GATES,
  PLAN_QUOTAS  as STATIC_PLAN_QUOTAS,
  PLAN_RANK,
} from '../lib/subscriptionFeatures.ts';

// ── Fallback statique pour plan_pricing_config ────────────────────────────────
export const STATIC_PRICING = {
  free:    { plan_id: 'free',    name: 'Gratuit',   price_monthly: 0,  color: '#64748b', badge: '⚪', tagline: 'Découvrir SportLink',  cta_label: 'Commencer gratuitement', is_popular: false, sort_order: 0, is_active: true },
  starter: { plan_id: 'starter', name: 'Starter',   price_monthly: 9,  color: '#3b82f6', badge: '🔵', tagline: 'Communication club',   cta_label: 'Essayer Starter',        is_popular: false, sort_order: 1, is_active: true },
  pro:     { plan_id: 'pro',     name: 'Club Pro',  price_monthly: 29, color: '#8b5cf6', badge: '🟣', tagline: 'Gestion complète',     cta_label: 'Choisir Club Pro',       is_popular: true,  sort_order: 2, is_active: true },
  elite:   { plan_id: 'elite',   name: 'Elite',     price_monthly: 59, color: '#f59e0b', badge: '👑', tagline: 'Automatisation & IA',  cta_label: 'Choisir Elite',          is_popular: false, sort_order: 3, is_active: true },
};

// ── Builders ──────────────────────────────────────────────────────────────────

function buildFeatureGates(rows) {
  const gates = {};
  for (const row of rows) gates[row.feature_key] = row.min_plan;
  return gates;
}

function buildPlanQuotas(rows) {
  const quotas = { free: {}, starter: {}, pro: {}, elite: {} };
  for (const row of rows) {
    if (!quotas[row.plan]) continue;
    quotas[row.plan][row.quota_key] = row.value;
  }
  return quotas;
}

function buildPlanMeta(rows) {
  const meta = {};
  for (const row of rows) meta[row.plan_id] = row;
  return meta;
}

// ── Cache module-level ────────────────────────────────────────────────────────
let _cache   = null;
let _promise = null;

async function fetchConfig() {
  if (_cache)   return _cache;
  if (_promise) return _promise;

  _promise = Promise.all([
    supabase.from('plan_features_config').select('*').order('feature_group').order('feature_key'),
    supabase.from('plan_quotas_config').select('*').order('plan').order('quota_key'),
    supabase.from('plan_pricing_config').select('*').order('sort_order'),
  ]).then(([featRes, quotaRes, pricingRes]) => {
    const features = featRes.data    ?? [];
    const quotas   = quotaRes.data   ?? [];
    const pricing  = pricingRes.data ?? [];
    _cache = { features, quotas, pricing };
    _promise = null;
    return _cache;
  }).catch(() => {
    _promise = null;
    return null;
  });

  return _promise;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePlanConfig() {
  const [features, setFeatures] = useState(null);
  const [quotas,   setQuotas]   = useState(null);
  const [pricing,  setPricing]  = useState(null); // lignes brutes plan_pricing_config
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchConfig().then(data => {
      if (cancelled) return;
      if (data) {
        setFeatures(data.features);
        setQuotas(data.quotas);
        setPricing(data.pricing);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const invalidateCache = useCallback(() => { _cache = null; }, []);

  // ── Feature gates ─────────────────────────────────────────────────────────
  const featureGates = useMemo(() => {
    if (!features || features.length === 0) return STATIC_FEATURE_GATES;
    return buildFeatureGates(features);
  }, [features]);

  // ── Quotas ────────────────────────────────────────────────────────────────
  const planQuotas = useMemo(() => {
    if (!quotas || quotas.length === 0) return STATIC_PLAN_QUOTAS;
    return buildPlanQuotas(quotas);
  }, [quotas]);

  // ── Pricing / Plan meta ───────────────────────────────────────────────────
  // planMeta : { free: {...}, starter: {...}, pro: {...}, elite: {...} }
  const planMeta = useMemo(() => {
    if (!pricing || pricing.length === 0) return STATIC_PRICING;
    return buildPlanMeta(pricing);
  }, [pricing]);

  // Ordre des plans actifs
  const planOrder = useMemo(() => {
    const rows = pricing?.length ? pricing : Object.values(STATIC_PRICING);
    return rows
      .filter(r => r.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(r => r.plan_id);
  }, [pricing]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const canUseFeature = useCallback((feature, planId) => {
    const minPlan = featureGates[feature];
    if (!minPlan) return false;
    return (PLAN_RANK[planId] ?? 0) >= (PLAN_RANK[minPlan] ?? 4);
  }, [featureGates]);

  const getQuotas = useCallback((planId) => {
    return planQuotas[planId] ?? planQuotas.free ?? {};
  }, [planQuotas]);

  // ── Admin : feature gate ──────────────────────────────────────────────────

  const updateFeatureGate = useCallback(async (featureKey, newMinPlan) => {
    const { error } = await supabase
      .from('plan_features_config')
      .update({ min_plan: newMinPlan })
      .eq('feature_key', featureKey);
    if (error) throw new Error(error.message);
    setFeatures(prev => prev?.map(f =>
      f.feature_key === featureKey ? { ...f, min_plan: newMinPlan } : f
    ) ?? prev);
    invalidateCache();
  }, [invalidateCache]);

  // ── Admin : quota ─────────────────────────────────────────────────────────

  const updateQuota = useCallback(async (plan, quotaKey, newValue) => {
    const { error } = await supabase
      .from('plan_quotas_config')
      .update({ value: newValue })
      .eq('plan', plan)
      .eq('quota_key', quotaKey);
    if (error) throw new Error(error.message);
    setQuotas(prev => prev?.map(q =>
      q.plan === plan && q.quota_key === quotaKey ? { ...q, value: newValue } : q
    ) ?? prev);
    invalidateCache();
  }, [invalidateCache]);

  // ── Admin : pricing ───────────────────────────────────────────────────────
  // Appelle la RPC SECURITY DEFINER sl_update_plan_pricing

  const updatePricing = useCallback(async (planId, fields) => {
    const { error } = await supabase.rpc('sl_update_plan_pricing', {
      p_plan_id:    planId,
      p_name:       fields.name        ?? null,
      p_price:      fields.price_monthly != null ? Number(fields.price_monthly) : null,
      p_color:      fields.color       ?? null,
      p_badge:      fields.badge       ?? null,
      p_tagline:    fields.tagline     ?? null,
      p_cta_label:  fields.cta_label   ?? null,
      p_is_popular: fields.is_popular  ?? null,
      p_is_active:  fields.is_active   ?? null,
    });
    if (error) throw new Error(error.message);

    // Mise à jour locale optimiste
    setPricing(prev => {
      if (!prev) return prev;
      let rows = prev.map(r => r.plan_id === planId ? { ...r, ...fields } : r);
      // Si is_popular passé à true → vider les autres
      if (fields.is_popular === true) {
        rows = rows.map(r => r.plan_id !== planId ? { ...r, is_popular: false } : r);
      }
      return rows;
    });
    invalidateCache();
  }, [invalidateCache]);

  return {
    loading,
    // Données brutes
    features,
    quotas,
    pricing,
    // Maps calculées
    featureGates,
    planQuotas,
    planMeta,
    planOrder,
    // Helpers lecture
    canUseFeature,
    getQuotas,
    // Mutations admin
    updateFeatureGate,
    updateQuota,
    updatePricing,
    invalidateCache,
  };
}
