import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlansSection from '../home/PlansSection.jsx';
import UpgradeDiff from './UpgradeDiff.jsx';
import { getPlanMeta } from '../../lib/planHelpers.js';
import { PLAN_ORDER } from '../../lib/subscriptionFeatures.js';
import { useStripeCheckout } from '../../hooks/useStripeCheckout.js';

type CheckoutPlan = 'starter' | 'pro' | 'elite';

const CHECKOUT_PLANS = new Set<string>(['starter', 'pro', 'elite']);

interface PlansMiniModalProps {
  open:             boolean;
  onClose:          () => void;
  currentPlanId?:   string | null;
  nextPlanId?:      string | null;
  clubId?:          string | null;
}

export default function PlansMiniModal({ open, onClose, currentPlanId, nextPlanId: nextPlanIdProp, clubId }: PlansMiniModalProps) {
  const nextPlanId    = nextPlanIdProp ?? (currentPlanId ? (PLAN_ORDER as string[])[((PLAN_ORDER as string[]).indexOf(currentPlanId) + 1)] ?? null : null);
  const currentMeta   = currentPlanId ? getPlanMeta(currentPlanId as any) as { badge: string; name: string } | null : null;
  const { startCheckout, loading: checkoutLoading, error: checkoutError } = useStripeCheckout();
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="plans-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 2100 }} onClick={onClose} />
          <motion.div key="plans-modal-drawer" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 36 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '92dvh', zIndex: 2101, backgroundColor: 'var(--sl-bg)', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)' }}>Plans d'abonnement</div>
                {currentMeta && <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>Plan actuel : {currentMeta.badge} {currentMeta.name}</div>}
              </div>
              <button onClick={onClose} aria-label="Fermer" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
              {currentPlanId && nextPlanId && <div style={{ padding: '16px 20px 0' }}><UpgradeDiff currentPlanId={currentPlanId} nextPlanId={nextPlanId} onUpgrade={onClose} /></div>}

              {/* Toggle mensuel/annuel */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '16px 20px 0' }}>
                {(['monthly', 'yearly'] as const).map(iv => (
                  <button key={iv} onClick={() => setSelectedInterval(iv)} style={{ padding: '7px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: selectedInterval === iv ? 'var(--sl-blue)' : 'var(--sl-surface)', color: selectedInterval === iv ? '#fff' : 'var(--sl-t2)', transition: 'all 0.15s' }}>
                    {iv === 'monthly' ? 'Mensuel' : 'Annuel −20%'}
                  </button>
                ))}
              </div>

              <PlansSection onCta={(planId?: string) => {
                if (!planId || planId === 'free' || planId === currentPlanId) { onClose(); return; }
                if (!CHECKOUT_PLANS.has(planId)) return;
                startCheckout(planId as CheckoutPlan, selectedInterval, clubId ?? undefined);
              }} />

              {checkoutError && (
                <div style={{ margin: '0 20px 16px', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
                  {checkoutError}
                </div>
              )}

              {checkoutLoading && (
                <div style={{ textAlign: 'center', padding: '8px 0 16px', fontSize: 12, color: 'var(--sl-t3)' }}>Redirection vers le paiement…</div>
              )}

              <div style={{ padding: '0 20px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0, lineHeight: 1.6 }}>
                  Paiement sécurisé par Stripe · 14 jours d'essai gratuit · Sans engagement · Annulable à tout moment
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
