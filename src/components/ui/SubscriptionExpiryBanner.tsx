import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlansMiniModal from './PlansMiniModal.jsx';

function getDaysLeft(periodEnd?: string | null): number | null {
  if (!periodEnd) return null;
  const diff = new Date(periodEnd).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days > 7 || days < 0) return null;
  return days;
}
function getUrgency(days: number) {
  if (days <= 1) return { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  icon: '🔴' };
  if (days <= 3) return { color: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.25)', icon: '🟠' };
  return           { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)', icon: '🟡' };
}
function expiryLabel(days: number, periodEnd: string): string {
  if (days === 0) return 'expire aujourd\'hui';
  if (days === 1) return 'expire demain';
  const dateStr = new Date(periodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return `expire le ${dateStr}`;
}

interface SubscriptionExpiryBannerProps { periodEnd?: string | null; planId: string; planName?: string; compact?: boolean; }

export default function SubscriptionExpiryBanner({ periodEnd, planId, planName, compact = false }: SubscriptionExpiryBannerProps) {
  const dismissKey = `sl-expiry-dismissed-${planId}-${periodEnd}`;
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem(dismissKey));
  const [showPlans, setShowPlans] = useState(false);
  const days = getDaysLeft(periodEnd);
  if (days === null || dismissed) return null;
  const urgency = getUrgency(days);
  const label   = expiryLabel(days, periodEnd!);

  return (
    <>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: compact ? 'center' : 'flex-start', gap: compact ? 8 : 12, padding: compact ? '8px 16px' : '12px 16px', backgroundColor: urgency.bg, borderBottom: `1px solid ${urgency.border}` }}>
            <span style={{ fontSize: compact ? 13 : 16, flexShrink: 0, lineHeight: 1.5 }}>{urgency.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: urgency.color }}>Votre abonnement {planName ?? ''} {label}</span>
              {!compact && <span style={{ fontSize: 11, color: 'var(--sl-t3)', display: 'block', marginTop: 1 }}>Renouvelez pour conserver l'accès à toutes vos fonctionnalités.</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button onClick={() => setShowPlans(true)} style={{ padding: compact ? '4px 10px' : '6px 12px', borderRadius: 'var(--sl-radius-md)', border: 'none', backgroundColor: urgency.color, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Renouveler</button>
              <button onClick={() => { sessionStorage.setItem(dismissKey, '1'); setDismissed(true); }} aria-label="Fermer l'alerte" style={{ background: 'none', border: 'none', cursor: 'pointer', color: urgency.color, opacity: 0.6, padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <PlansMiniModal open={showPlans} onClose={() => setShowPlans(false)} currentPlanId={planId} />
    </>
  );
}
