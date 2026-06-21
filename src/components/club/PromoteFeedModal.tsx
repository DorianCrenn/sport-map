import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeaturedEventsAdmin } from '../../hooks/useFeaturedEventsAdmin.ts';
import { PLAN_CONFIG } from '../feed/feed.types.ts';

const PLANS = [
  { id: 'starter', emoji: '⭐', desc: '1 événement · 7 jours',  price: 'Gratuit' },
  { id: 'pro',     emoji: '🔥', desc: '3 événements · 30 jours', price: 'Club Pro' },
  { id: 'elite',   emoji: '👑', desc: '5 événements · 60 jours', price: 'Élite' },
];

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function computeEndsAt(plan: string) {
  const days = (PLAN_CONFIG as any)[plan].durationDays;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function PlanCard({ plan, selected, onSelect }: { plan: { id: string; emoji: string; desc: string; price: string }; selected: boolean; onSelect: (id: string) => void }) {
  const cfg = (PLAN_CONFIG as any)[plan.id];
  return (
    <button
      onClick={() => onSelect(plan.id)}
      style={{ flex: 1, minWidth: 80, borderRadius: 14, padding: '12px 10px', border: `2px solid ${selected ? cfg.accent : 'var(--sl-border)'}`, backgroundColor: selected ? `${cfg.accent}10` : 'var(--sl-card)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', boxShadow: selected ? `0 0 12px ${cfg.glow}` : 'none' }}
    >
      <div style={{ fontSize: 18, marginBottom: 4 }}>{plan.emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: selected ? cfg.accent : 'var(--sl-t1)' }}>{cfg.label}</div>
      <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2, lineHeight: 1.4 }}>{plan.desc}</div>
      <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, display: 'inline-block', backgroundColor: selected ? `${cfg.accent}20` : 'var(--sl-surface)', color: selected ? cfg.accent : 'var(--sl-t3)' }}>
        {plan.price}
      </div>
    </button>
  );
}

export function FeaturedSection({ club, upcomingEvents = [] }: { club: Record<string, any>; upcomingEvents?: Record<string, any>[] }) {
  const { active, loading, saving, error, promote, cancel } = useFeaturedEventsAdmin(club.id) as any;
  const [showForm, setShowForm]     = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedPlan, setSelectedPlan]   = useState('starter');
  const [submitting, setSubmitting]       = useState(false);
  const [success, setSuccess]             = useState(false);

  const futureEvents = upcomingEvents.filter(ev => new Date(ev.date) >= new Date());

  async function handleSubmit() {
    if (!selectedEvent || !selectedPlan) return;
    setSubmitting(true);
    setSuccess(false);
    const endsAt = computeEndsAt(selectedPlan);
    await promote(selectedEvent, selectedPlan, endsAt);
    setSubmitting(false);
    setSuccess(true);
    setShowForm(false);
    setSelectedEvent('');
    setSelectedPlan('starter');
    setTimeout(() => setSuccess(false), 3000);
  }

  const cfg = (plan: string) => (PLAN_CONFIG as any)[plan];

  return (
    <div style={{ borderRadius: 14, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}>⭐ Mise en avant</div>
          <div style={{ fontSize: 12, color: 'var(--sl-t2)', marginTop: 2 }}>
            {active.length === 0 ? 'Aucun événement mis en avant' : `${active.length} actif${active.length > 1 ? 's' : ''}`}
          </div>
        </div>
        {!showForm && futureEvents.length > 0 && (
          <button onClick={() => setShowForm(true)} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: '#f59e0b', color: 'white', fontSize: 12, fontWeight: 700 }}>
            + Promouvoir
          </button>
        )}
      </div>

      {!loading && active.length > 0 && (
        <div style={{ borderTop: '1px solid var(--sl-border)' }}>
          {active.map((feat: any, idx: number) => {
            const c = cfg(feat.plan);
            return (
              <div key={feat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: idx < active.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c.accent, flexShrink: 0, boxShadow: `0 0 6px ${c.glow}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feat.event_title ?? feat.event_id}</div>
                  <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>
                    <span style={{ color: c.accent, fontWeight: 700 }}>{c.label}</span>{' · '}Jusqu'au {fmtDate(feat.ends_at)}
                  </div>
                </div>
                <button onClick={() => cancel(feat.id)} disabled={saving} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 11, cursor: saving ? 'wait' : 'pointer', flexShrink: 0 }}>
                  Retirer
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ padding: '10px 16px', backgroundColor: 'rgba(34,217,106,0.08)', borderTop: '1px solid var(--sl-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#22d96a' }}>✓ Événement mis en avant — il apparaît dès maintenant dans le feed.</div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ padding: '10px 16px', backgroundColor: 'rgba(239,68,68,0.08)', borderTop: '1px solid var(--sl-border)' }}>
          <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ borderTop: '1px solid var(--sl-border)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)', marginBottom: 6 }}>Quel événement mettre en avant ?</div>
                {futureEvents.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>Aucun événement à venir.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {futureEvents.slice(0, 6).map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev.id)}
                        style={{ padding: '10px 12px', borderRadius: 10, textAlign: 'left', border: `2px solid ${selectedEvent === ev.id ? '#f59e0b' : 'var(--sl-border)'}`, backgroundColor: selectedEvent === ev.id ? 'rgba(245,158,11,0.08)' : 'var(--sl-surface)', cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)' }}>
                          {ev.homeTeam && ev.awayTeam ? `${ev.homeTeam} vs ${ev.awayTeam}` : (ev.title ?? 'Événement')}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2 }}>
                          {fmtDate(ev.date)}{ev.city ? ` · ${ev.city}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)', marginBottom: 6 }}>Choisir un plan de mise en avant</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} selected={selectedPlan === plan.id} onSelect={setSelectedPlan} />)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 8 }}>
                  Durée : <strong style={{ color: cfg(selectedPlan).accent }}>{(PLAN_CONFIG as any)[selectedPlan].durationDays} jours</strong>{' · '}Expire le{' '}<strong>{fmtDate(computeEndsAt(selectedPlan))}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowForm(false); setSelectedEvent(''); setSelectedPlan('starter'); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedEvent || submitting}
                  style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', backgroundColor: selectedEvent ? cfg(selectedPlan).accent : 'var(--sl-border)', color: selectedEvent ? 'white' : 'var(--sl-t3)', fontSize: 12, fontWeight: 700, cursor: !selectedEvent || submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: selectedEvent ? `0 4px 12px ${cfg(selectedPlan).glow}` : 'none', transition: 'all 0.15s' }}
                >
                  {submitting ? 'Publication…' : '⭐ Mettre en avant'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
