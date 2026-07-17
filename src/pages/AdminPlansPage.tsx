import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlanConfig } from '../hooks/usePlanConfig.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { supabase } from '../lib/supabase.js';

const GROUP_LABELS: Record<string, string> = {
  poster:     'PosterStudio',
  carpooling: 'Covoiturage',
  lineups:    'Compositions',
  stats:      'Statistiques',
  comms:      'Communication',
  advanced:   'Avancé',
  other:      'Autre',
};

const QUOTA_LABELS_DISPLAY: Record<string, { label: string; unit: string }> = {
  postersPerMonth:    { label: 'Affiches / mois',          unit: 'affiches' },
  featuredEventsMax:  { label: 'Événements À la Une max',  unit: 'events'   },
  featuredEventsDays: { label: 'Durée mise en avant',      unit: 'jours'    },
  aiGeneratesPerMonth:{ label: 'Générations IA / mois',    unit: 'gén.'     },
  aiImportsPerMonth:  { label: 'Imports IA / mois',        unit: 'imports'  },
  carpoolingTeamsMax: { label: 'Équipes covoiturage',       unit: 'équipes'  },
};

const COLOR_PALETTE = [
  '#64748b', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#22c55e', '#ef4444', '#ec4899', '#06b6d4',
  '#f97316', '#0F1E3A',
];

const BADGE_OPTIONS = ['⚪','🔵','🟣','👑','🟢','🔴','🟡','🏆','⭐','💎'];

interface PlanBadgeProps { plan: string; planMeta: Record<string, any>; }
function PlanBadge({ plan, planMeta }: PlanBadgeProps) {
  const p = planMeta?.[plan];
  if (!p) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: `${p.color}20`, color: p.color }}>
      {p.badge} {p.name}
    </span>
  );
}

interface QuotaValueProps { value: number | null; }
function QuotaValue({ value }: QuotaValueProps) {
  if (value === null) return <span style={{ color: '#22c55e', fontWeight: 700 }}>∞</span>;
  if (value === 0)    return <span style={{ color: '#ef4444', fontWeight: 700 }}>—</span>;
  return <span style={{ fontWeight: 700 }}>{value}</span>;
}

interface TarifTabProps {
  planMeta: Record<string, any>;
  planOrder: string[];
  updatePricing: (planId: string, data: Record<string, any>) => Promise<void>;
  toast: (opts: Record<string, any>) => void;
}
function TarifTab({ planMeta, planOrder, updatePricing, toast }: TarifTabProps) {
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  function startEdit(planId: string) {
    const m = planMeta[planId] ?? {};
    setForm({
      name:          m.name          ?? '',
      price_monthly: m.price_monthly ?? 0,
      tagline:       m.tagline       ?? '',
      cta_label:     m.cta_label     ?? '',
      color:         m.color         ?? '#64748b',
      badge:         m.badge         ?? '⚪',
      is_popular:    m.is_popular    ?? false,
      is_active:     m.is_active     ?? true,
    });
    setEditingPlan(planId);
  }

  function setField(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    try {
      await updatePricing(editingPlan!, { ...form, price_monthly: Number(form.price_monthly) });
      toast({ message: 'Plan mis à jour ✓' });
      setEditingPlan(null);
    } catch (e: any) {
      toast({ message: e.message, type: 'error' });
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--sl-t3)' }}>
        Ces modifications s'appliquent immédiatement sur la page d'accueil et le modal des plans.
      </p>

      {planOrder.map(planId => {
        const m = planMeta[planId];
        if (!m) return null;
        const isEditing = editingPlan === planId;

        return (
          <div key={planId} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-3xl)', border: `2px solid ${isEditing ? m.color : 'var(--sl-border)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>

            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{m.badge}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: m.color }}>{m.name}</span>
                  {m.is_popular && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: `${m.color}20`, color: m.color }}>
                      ⭐ Populaire
                    </span>
                  )}
                  {!m.is_active && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: '#ef444420', color: '#ef4444' }}>
                      Masqué
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginTop: 2 }}>
                  {m.price_monthly === 0 ? 'Gratuit' : `${m.price_monthly}€/mois`}
                  {m.tagline ? ` · ${m.tagline}` : ''}
                </div>
              </div>
              {!isEditing && (
                <button onClick={() => startEdit(planId)}
                  style={{ padding: '7px 14px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', flexShrink: 0 }}>
                  Modifier
                </button>
              )}
            </div>

            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--sl-border)', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Nom du plan
                        </label>
                        <input
                          value={form.name}
                          onChange={e => setField('name', e.target.value)}
                          placeholder="ex. Club Pro"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', fontSize: 13, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Prix (€/mois)
                        </label>
                        <input
                          type="number" min="0" max="999"
                          value={form.price_monthly}
                          onChange={e => setField('price_monthly', e.target.value)}
                          style={{ width: 90, padding: '9px 12px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', fontSize: 13, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', textAlign: 'center' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Tagline (sous le prix)
                      </label>
                      <input
                        value={form.tagline}
                        onChange={e => setField('tagline', e.target.value)}
                        placeholder="ex. Gestion complète"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', fontSize: 13, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Texte du bouton CTA
                      </label>
                      <input
                        value={form.cta_label}
                        onChange={e => setField('cta_label', e.target.value)}
                        placeholder="ex. Choisir Club Pro"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', fontSize: 13, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Badge (emoji)
                      </label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {BADGE_OPTIONS.map(b => (
                          <button key={b} onClick={() => setField('badge', b)}
                            style={{
                              width: 36, height: 36, borderRadius: 'var(--sl-radius-lg)', fontSize: 18, cursor: 'pointer',
                              border: `2px solid ${form.badge === b ? form.color : 'var(--sl-border)'}`,
                              backgroundColor: form.badge === b ? `${form.color}15` : 'var(--sl-surface)',
                            }}>
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Couleur
                      </label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {COLOR_PALETTE.map(c => (
                          <button key={c} onClick={() => setField('color', c)}
                            style={{
                              width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                              backgroundColor: c,
                              border: `3px solid ${form.color === c ? 'var(--sl-t1)' : 'transparent'}`,
                              outline: form.color === c ? `2px solid ${c}` : 'none',
                              outlineOffset: 2,
                            }}
                          />
                        ))}
                        <input type="color" value={form.color} onChange={e => setField('color', e.target.value)}
                          title="Couleur personnalisée"
                          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, overflow: 'hidden' }}
                        />
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--sl-t3)', fontFamily: 'monospace' }}>{form.color}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.is_popular} onChange={e => setField('is_popular', e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: form.color, cursor: 'pointer' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>⭐ Plan populaire</span>
                        <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>(un seul à la fois)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.is_active} onChange={e => setField('is_active', e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: form.color, cursor: 'pointer' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>Visible (affiché)</span>
                      </label>
                    </div>

                    <div style={{ padding: '10px 14px', borderRadius: 'var(--sl-radius-xl)', border: `1.5px dashed ${form.color}60`, backgroundColor: `${form.color}08` }}>
                      <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aperçu</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{form.badge}</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: form.color }}>{form.name || '—'}</span>
                        {form.is_popular && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: `${form.color}20`, color: form.color }}>⭐ Populaire</span>}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 900, color: 'var(--sl-t1)' }}>
                        {form.price_monthly === 0 || form.price_monthly === '' ? 'Gratuit' : `${form.price_monthly}€`}
                        {form.price_monthly > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sl-t3)' }}>/mois</span>}
                      </p>
                      {form.tagline && <p style={{ margin: '2px 0 6px', fontSize: 12, color: 'var(--sl-t3)' }}>{form.tagline}</p>}
                      <button style={{ padding: '6px 16px', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: form.color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'default' }}>
                        {form.cta_label || 'Choisir'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditingPlan(null)}
                        style={{ flex: 1, padding: '10px', borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>
                        Annuler
                      </button>
                      <button onClick={handleSave} disabled={saving} data-testid={`plan-save-${editingPlan}`}
                        style={{ flex: 2, padding: '10px', borderRadius: 'var(--sl-radius-xl)', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', backgroundColor: form.color, color: '#fff', opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Sauvegarde…' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

interface AdminPlansPageProps { onBack: () => void; }

export default function AdminPlansPage({ onBack }: AdminPlansPageProps) {
  const { loading, features, quotas, planMeta, planOrder, updateFeatureGate, updateQuota, updatePricing } = usePlanConfig();
  const { toast } = useToast();

  const [activeTab,       setActiveTab]       = useState('features');
  const [planStats,       setPlanStats]       = useState<Record<string, number>>({});
  const [editingFeature,  setEditingFeature]  = useState<string | null>(null);
  const [editingQuota,    setEditingQuota]    = useState<string | null>(null);
  const [saving,          setSaving]          = useState(false);

  useEffect(() => {
    Promise.all(
      ['free', 'starter', 'pro', 'elite'].map(plan =>
        supabase
          .from('club_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('plan', plan)
          .in('status', ['active', 'trialing'])
          .then(({ count }: { count: number | null }) => [plan, count ?? 0])
      )
    ).then((entries: any[]) => {
      const stats = Object.fromEntries(entries);
      supabase.from('clubs').select('id', { count: 'exact', head: true })
        .eq('status', 'verified')
        .then(({ count: total }: { count: number | null }) => {
          const withSub = Object.values(stats).reduce((s: number, n) => s + (n as number), 0);
          stats.free = (stats.free ?? 0) + Math.max(0, (total ?? 0) - withSub);
          setPlanStats(stats);
        });
    });
  }, []);

  const featuresByGroup = useMemo(() => {
    if (!features) return {};
    const groups: Record<string, any[]> = {};
    for (const f of features) {
      if (!groups[f.feature_group]) groups[f.feature_group] = [];
      groups[f.feature_group].push(f);
    }
    return groups;
  }, [features]);

  const quotasByPlan = useMemo(() => {
    if (!quotas) return {};
    const byPlan: Record<string, Record<string, any>> = {};
    for (const q of quotas) {
      if (!byPlan[q.plan]) byPlan[q.plan] = {};
      byPlan[q.plan][q.quota_key] = q;
    }
    return byPlan;
  }, [quotas]);

  async function handleFeatureSave(featureKey: string, newPlan: string) {
    setSaving(true);
    try {
      await updateFeatureGate(featureKey, newPlan);
      toast({ message: 'Feature gate mise à jour' });
      setEditingFeature(null);
    } catch (e: any) {
      toast({ message: e.message, type: 'error' });
    } finally { setSaving(false); }
  }

  async function handleQuotaSave(plan: string, quotaKey: string, newValue: string) {
    setSaving(true);
    try {
      await updateQuota(plan, quotaKey, newValue === '' ? null : Number(newValue));
      toast({ message: 'Quota mis à jour' });
      setEditingQuota(null);
    } catch (e: any) {
      toast({ message: e.message, type: 'error' });
    } finally { setSaving(false); }
  }

  const plansForTable = ['free', 'starter', 'pro', 'elite'].map(id => ({
    id,
    label: planMeta[id]?.name  ?? id,
    color: planMeta[id]?.color ?? '#64748b',
    badge: planMeta[id]?.badge ?? '⚪',
  }));

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--sl-border)', borderTopColor: '#8b5cf6', animation: 'sl-spin 0.7s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)', overflow: 'hidden' }}>

      <div style={{ flexShrink: 0, padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--sl-border)' }}>
        <button onClick={onBack} aria-label="Retour à l'administration" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)' }}>Matrice des abonnements</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--sl-t3)' }}>Configuration dynamique — sans redéploiement</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {plansForTable.map(p => (
            <span key={p.id} style={{ fontSize: 18 }} title={p.label}>{p.badge}</span>
          ))}
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', gap: 4, padding: '10px 16px', borderBottom: '1px solid var(--sl-border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { id: 'features', label: 'Feature Gates', icon: '🔑' },
          { id: 'quotas',   label: 'Quotas',        icon: '📊' },
          { id: 'preview',  label: 'Aperçu plans',  icon: '👁️' },
          { id: 'pricing',  label: 'Tarifs',         icon: '💶' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: '7px 14px', borderRadius: 'var(--sl-radius-4xl)', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', flexShrink: 0,
              backgroundColor: activeTab === t.id ? '#8b5cf6' : 'var(--sl-surface)',
              color: activeTab === t.id ? '#fff' : 'var(--sl-t2)',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {activeTab === 'features' && (
          <>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--sl-t3)' }}>
              Chaque feature est associée à un plan minimum. Modifier ici met à jour l'application immédiatement.
            </p>
            {Object.entries(featuresByGroup).map(([group, groupFeatures]) => (
              <div key={group}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {GROUP_LABELS[group] ?? group}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {groupFeatures.map(f => {
                    const isEditing = editingFeature === f.feature_key;
                    return (
                      <div key={f.feature_key} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-xl)', border: '1px solid var(--sl-border)', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>{f.feature_label}</p>
                            <p style={{ margin: 0, fontSize: 10, color: 'var(--sl-t3)', fontFamily: 'monospace' }}>{f.feature_key}</p>
                          </div>
                          {!isEditing && (
                            <>
                              <PlanBadge plan={f.min_plan} planMeta={planMeta} />
                              <button onClick={() => setEditingFeature(f.feature_key)}
                                style={{ padding: '5px 10px', borderRadius: 'var(--sl-radius-md)', border: '1px solid var(--sl-border)', fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', flexShrink: 0 }}>
                                Modifier
                              </button>
                            </>
                          )}
                        </div>
                        <AnimatePresence>
                          {isEditing && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: 10 }}>
                              <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--sl-t3)' }}>Plan minimum requis :</p>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                {plansForTable.map(p => (
                                  <button key={p.id} onClick={() => handleFeatureSave(f.feature_key, p.id)} disabled={saving}
                                    style={{
                                      padding: '6px 14px', borderRadius: 'var(--sl-radius-4xl)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                      border: `2px solid ${f.min_plan === p.id ? p.color : 'var(--sl-border)'}`,
                                      backgroundColor: f.min_plan === p.id ? `${p.color}18` : 'var(--sl-surface)',
                                      color: f.min_plan === p.id ? p.color : 'var(--sl-t2)',
                                    }}>
                                    {p.badge} {p.label}
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => setEditingFeature(null)} style={{ fontSize: 11, color: 'var(--sl-t3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                Annuler
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'quotas' && (
          <>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--sl-t3)' }}>
              null = illimité · 0 = bloqué · Nombre = quota mensuel
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--sl-border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--sl-t3)', fontWeight: 700, fontSize: 11 }}>Quota</th>
                    {plansForTable.map(p => (
                      <th key={p.id} style={{ textAlign: 'center', padding: '8px 10px', color: p.color, fontWeight: 700, fontSize: 11 }}>
                        {p.badge} {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(QUOTA_LABELS_DISPLAY).map(([key, meta]) => (
                    <tr key={key} style={{ borderBottom: '1px solid var(--sl-border)' }}>
                      <td style={{ padding: '10px', color: 'var(--sl-t2)', fontWeight: 600 }}>{meta.label}</td>
                      {plansForTable.map(p => {
                        const row = quotasByPlan[p.id]?.[key];
                        const isEditing = editingQuota === `${p.id}:${key}`;
                        return (
                          <td key={p.id} style={{ textAlign: 'center', padding: '8px 10px' }}>
                            {isEditing ? (
                              <input
                                type="number" min="-1" defaultValue={row?.value ?? ''}
                                placeholder="∞=vide"
                                aria-label={`Quota ${meta.label} pour le plan ${p.label}`}
                                onBlur={e => handleQuotaSave(p.id, key, e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingQuota(null); }}
                                autoFocus
                                style={{ width: 70, textAlign: 'center', padding: '4px 6px', borderRadius: 'var(--sl-radius-md)', border: `1px solid ${p.color}`, fontSize: 12, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }}
                              />
                            ) : (
                              <button onClick={() => setEditingQuota(`${p.id}:${key}`)}
                                style={{ padding: '4px 10px', borderRadius: 'var(--sl-radius-md)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', fontSize: 12 }}>
                                <QuotaValue value={row?.value ?? null} />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plansForTable.map(plan => {
              const planFeatures = features?.filter((f: any) => {
                const planRanks: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3 };
                return planRanks[f.min_plan] <= planRanks[plan.id];
              }) ?? [];
              const planQuotaRows = quotasByPlan[plan.id] ?? {};
              const m = planMeta[plan.id];
              return (
                <div key={plan.id} style={{ backgroundColor: 'var(--sl-card)', borderRadius: 'var(--sl-radius-3xl)', border: `1px solid ${plan.color}30`, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{plan.badge}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: plan.color }}>{plan.label}</span>
                    {m?.is_popular && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: `${plan.color}20`, color: plan.color }}>⭐ Populaire</span>}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                      {planStats[plan.id] != null && (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: `${plan.color}14`, color: plan.color, fontWeight: 700 }}>
                          {planStats[plan.id]} club{planStats[plan.id] !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--sl-t3)' }}>
                        {planFeatures.length} features
                      </span>
                    </div>
                  </div>
                  {m && (
                    <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 10 }}>
                      {m.price_monthly === 0 ? 'Gratuit' : `${m.price_monthly}€/mois`}
                      {m.tagline ? ` · ${m.tagline}` : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {Object.entries(planQuotaRows).map(([key, q]) => (
                      <span key={key} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>
                        {QUOTA_LABELS_DISPLAY[key]?.label ?? key} : {(q as any).value === null ? '∞' : (q as any).value === 0 ? '—' : (q as any).value}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {planFeatures.map((f: any) => (
                      <span key={f.feature_key} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', backgroundColor: `${plan.color}12`, color: plan.color, fontWeight: 600 }}>
                        {f.feature_label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'pricing' && (
          <TarifTab
            planMeta={planMeta}
            planOrder={planOrder.length ? planOrder : ['free', 'starter', 'pro', 'elite']}
            updatePricing={updatePricing}
            toast={toast}
          />
        )}

      </div>
    </div>
  );
}
