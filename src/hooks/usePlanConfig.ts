import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  FEATURE_GATES as STATIC_FEATURE_GATES,
  PLAN_QUOTAS  as STATIC_PLAN_QUOTAS,
  PLAN_RANK,
} from '../lib/subscriptionFeatures.js';

export const STATIC_PRICING: Record<string, {
  plan_id: string; name: string; price_monthly: number; color: string;
  badge: string; tagline: string; cta_label: string; is_popular: boolean;
  sort_order: number; is_active: boolean;
}> = {
  free:    { plan_id: 'free',    name: 'Gratuit',   price_monthly: 0,  color: '#64748b', badge: '⚪', tagline: 'Découvrir SportLink',  cta_label: 'Commencer gratuitement', is_popular: false, sort_order: 0, is_active: true },
  starter: { plan_id: 'starter', name: 'Starter',   price_monthly: 9,  color: '#3b82f6', badge: '🔵', tagline: 'Communication club',   cta_label: 'Essayer Starter',        is_popular: false, sort_order: 1, is_active: true },
  pro:     { plan_id: 'pro',     name: 'Club Pro',  price_monthly: 29, color: '#7c3aed', badge: '🟣', tagline: 'Gestion complète',     cta_label: 'Choisir Club Pro',       is_popular: true,  sort_order: 2, is_active: true },
  elite:   { plan_id: 'elite',   name: 'Elite',     price_monthly: 59, color: '#f59e0b', badge: '👑', tagline: 'Automatisation & IA',  cta_label: 'Choisir Elite',          is_popular: false, sort_order: 3, is_active: true },
};

interface FeatureRow    { feature_key: string; min_plan: string; feature_group?: string; }
interface QuotaRow      { plan: string; quota_key: string; value: number; }
interface PricingRow    { plan_id: string; name?: string; price_monthly?: number; color?: string; badge?: string; tagline?: string; cta_label?: string; is_popular?: boolean; is_active?: boolean; sort_order?: number; [key: string]: unknown; }

interface CacheEntry { features: FeatureRow[]; quotas: QuotaRow[]; pricing: PricingRow[]; }

let _cache:   CacheEntry | null = null;
let _promise: Promise<CacheEntry | null> | null = null;

async function fetchConfig(): Promise<CacheEntry | null> {
  if (_cache)   return _cache;
  if (_promise) return _promise;

  _promise = Promise.all([
    supabase.from('plan_features_config').select('*').order('feature_group').order('feature_key'),
    supabase.from('plan_quotas_config').select('*').order('plan').order('quota_key'),
    supabase.from('plan_pricing_config').select('*').order('sort_order'),
  ]).then(([featRes, quotaRes, pricingRes]) => {
    const entry: CacheEntry = {
      features: (featRes.data  ?? []) as FeatureRow[],
      quotas:   (quotaRes.data ?? []) as QuotaRow[],
      pricing:  (pricingRes.data ?? []) as PricingRow[],
    };
    _cache = entry;
    _promise = null;
    return entry;
  }).catch(() => {
    _promise = null;
    return null;
  });

  return _promise;
}

function buildFeatureGates(rows: FeatureRow[]): Record<string, string> {
  const gates: Record<string, string> = {};
  for (const row of rows) gates[row.feature_key] = row.min_plan;
  return gates;
}

function buildPlanQuotas(rows: QuotaRow[]): Record<string, Record<string, number>> {
  const quotas: Record<string, Record<string, number>> = { free: {}, starter: {}, pro: {}, elite: {} };
  for (const row of rows) {
    if (!quotas[row.plan]) continue;
    quotas[row.plan][row.quota_key] = row.value;
  }
  return quotas;
}

function buildPlanMeta(rows: PricingRow[]): Record<string, PricingRow> {
  const meta: Record<string, PricingRow> = {};
  for (const row of rows) meta[row.plan_id] = row;
  return meta;
}

export function usePlanConfig() {
  const [features, setFeatures] = useState<FeatureRow[] | null>(null);
  const [quotas,   setQuotas]   = useState<QuotaRow[] | null>(null);
  const [pricing,  setPricing]  = useState<PricingRow[] | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchConfig().then(data => {
      if (cancelled) return;
      if (data) { setFeatures(data.features); setQuotas(data.quotas); setPricing(data.pricing); }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const invalidateCache = useCallback(() => { _cache = null; }, []);

  const featureGates = useMemo(() => {
    if (!features || features.length === 0) return STATIC_FEATURE_GATES as Record<string, string>;
    return buildFeatureGates(features);
  }, [features]);

  const planQuotas = useMemo(() => {
    if (!quotas || quotas.length === 0) return STATIC_PLAN_QUOTAS as unknown as Record<string, Record<string, number>>;
    return buildPlanQuotas(quotas);
  }, [quotas]);

  const planMeta = useMemo(() => {
    if (!pricing || pricing.length === 0) return STATIC_PRICING;
    return buildPlanMeta(pricing);
  }, [pricing]);

  const planOrder = useMemo(() => {
    const rows = (pricing?.length ? pricing : Object.values(STATIC_PRICING)) as PricingRow[];
    return rows.filter(r => r.is_active).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(r => r.plan_id);
  }, [pricing]);

  const canUseFeature = useCallback((feature: string, planId: string): boolean => {
    const minPlan = featureGates[feature];
    if (!minPlan) return false;
    return ((PLAN_RANK as Record<string, number>)[planId] ?? 0) >= ((PLAN_RANK as Record<string, number>)[minPlan] ?? 4);
  }, [featureGates]);

  const getQuotas = useCallback((planId: string): Record<string, number> => {
    return planQuotas[planId] ?? planQuotas.free ?? {};
  }, [planQuotas]);

  const updateFeatureGate = useCallback(async (featureKey: string, newMinPlan: string) => {
    const { error } = await supabase.from('plan_features_config').update({ min_plan: newMinPlan }).eq('feature_key', featureKey) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    setFeatures(prev => prev?.map(f => f.feature_key === featureKey ? { ...f, min_plan: newMinPlan } : f) ?? prev);
    invalidateCache();
  }, [invalidateCache]);

  const updateQuota = useCallback(async (plan: string, quotaKey: string, newValue: number) => {
    const { error } = await supabase.from('plan_quotas_config').update({ value: newValue }).eq('plan', plan).eq('quota_key', quotaKey) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    setQuotas(prev => prev?.map(q => q.plan === plan && q.quota_key === quotaKey ? { ...q, value: newValue } : q) ?? prev);
    invalidateCache();
  }, [invalidateCache]);

  const updatePricing = useCallback(async (planId: string, fields: Partial<PricingRow>) => {
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
    }) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    setPricing(prev => {
      if (!prev) return prev;
      let rows = prev.map(r => r.plan_id === planId ? { ...r, ...fields } : r);
      if (fields.is_popular === true) {
        rows = rows.map(r => r.plan_id !== planId ? { ...r, is_popular: false } : r);
      }
      return rows;
    });
    invalidateCache();
  }, [invalidateCache]);

  return {
    loading,
    features, quotas, pricing,
    featureGates, planQuotas, planMeta, planOrder,
    canUseFeature, getQuotas,
    updateFeatureGate, updateQuota, updatePricing, invalidateCache,
  };
}
