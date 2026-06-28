import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscriptionManagement, StripeInvoice } from '../hooks/useSubscriptionManagement.js';
import { getPlanMeta } from '../lib/planHelpers.js';
import { PLAN_META } from '../lib/subscriptionFeatures.js';
import PlansMiniModal from '../components/ui/PlansMiniModal.jsx';
import { IconAlertTriangle, IconRocket, IconCreditCard, IconClipboard, IconCheckCircle, IconX, IconCrown } from '../components/icons.js';

const PLAN_LABELS: Record<string, { color: string; name: string; price: string }> = {
  free:    { color: '#6b7280', name: 'Gratuit',  price: '0 €/mois' },
  starter: { color: '#3b82f6', name: 'Starter',  price: '9 €/mois' },
  pro:     { color: '#8b5cf6', name: 'Club Pro', price: '29 €/mois' },
  elite:   { color: '#f59e0b', name: 'Elite',    price: '59 €/mois' },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string | null; cancelAtPeriodEnd: boolean }) {
  if (cancelAtPeriodEnd) {
    return (
      <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', color: '#d97706', fontSize: 11, fontWeight: 700 }}>
        Annulation en cours
      </span>
    );
  }
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active:    { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', label: 'Actif' },
    trialing:  { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', label: 'Essai gratuit' },
    past_due:  { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', label: 'Paiement en attente' },
    cancelled: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'Annulé' },
    inactive:  { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'Inactif' },
  };
  const cfg = map[status ?? 'inactive'] ?? map.inactive;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 8, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>
      {cfg.label}
    </span>
  );
}

function InvoiceRow({ inv }: { inv: StripeInvoice }) {
  const statusColor = inv.status === 'paid' ? '#16a34a' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--sl-border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>
          {formatDate(inv.date)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
          {inv.number ?? inv.id.slice(-8).toUpperCase()}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: statusColor }}>
        {formatAmount(inv.amount, inv.currency)}
      </div>
      {inv.pdf_url && (
        <a
          href={inv.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Télécharger la facture PDF"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'var(--sl-surface)', color: 'var(--sl-t2)', textDecoration: 'none', flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </a>
      )}
    </div>
  );
}

interface SubscriptionPageProps {
  clubId:   string | null | undefined;
  onClose?: () => void;
}

export default function SubscriptionPage({ clubId, onClose }: SubscriptionPageProps) {
  const {
    sub, loading,
    invoices, invoicesLoading,
    actionLoading, error,
    cancel, reactivate, openPortal, loadInvoices,
  } = useSubscriptionManagement(clubId);

  const [showPlans, setShowPlans]       = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (showInvoices && invoices.length === 0 && !invoicesLoading) {
      loadInvoices();
    }
  }, [showInvoices, invoices.length, invoicesLoading, loadInvoices]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--sl-border)', borderTopColor: 'var(--sl-green)', animation: 'sl-spin 0.7s linear infinite' }} />
      </div>
    );
  }

  const plan         = sub?.plan ?? 'free';
  const planCfg      = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const isPaid       = plan !== 'free';
  const isTrial      = sub?.status === 'trialing';
  const isPastDue    = sub?.status === 'past_due';
  const isCancelling = sub?.cancel_at_period_end ?? false;
  const periodEnd    = sub?.current_period_end;
  const trialEnd     = sub?.trial_end;
  const meta         = getPlanMeta(plan as any) as { name: string; price: number; badge: string } | null;

  // Nombre de jours restants avant fin de période/trial
  const daysRemaining = (iso: string | null | undefined): number | null => {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };
  const trialDays  = daysRemaining(trialEnd);
  const periodDays = daysRemaining(periodEnd);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1490, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
      />

      {/* Sheet slide-up */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '92dvh', zIndex: 1500,
          backgroundColor: 'var(--sl-bg)',
          borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        {onClose && (
          <button onClick={onClose} aria-label="Retour" style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'var(--sl-surface)', cursor: 'pointer', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)' }}>Mon abonnement</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--sl-t3)' }}>Gestion de votre plan SportLink</p>
        </div>
      </div>

      {/* Alerte past_due */}
      {isPastDue && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <IconAlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>Paiement en attente</div>
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>Votre paiement a échoué. Mettez à jour votre moyen de paiement pour maintenir l'accès.</div>
            <button onClick={openPortal} disabled={actionLoading} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Mettre à jour le paiement
            </button>
          </div>
        </motion.div>
      )}

      {/* Card plan actuel */}
      <div style={{ borderRadius: 16, border: `2px solid ${planCfg.color}`, background: 'var(--sl-card)', padding: '20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: planCfg.color, opacity: 0.06, transform: 'translate(30%, -30%)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Plan actuel</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${planCfg.color}18`, border: `1px solid ${planCfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCrown size={20} color={planCfg.color} /></div>
              <span style={{ fontSize: 22, fontWeight: 800, color: planCfg.color }}>{planCfg.name}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--sl-t3)', marginTop: 4 }}>{planCfg.price}</div>
          </div>
          <StatusBadge status={sub?.status ?? null} cancelAtPeriodEnd={isCancelling} />
        </div>

        {/* Dates */}
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {isTrial && trialEnd && (
            <div style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Fin d'essai</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', marginTop: 2 }}>{formatDate(trialEnd)}</div>
              {trialDays !== null && <div style={{ fontSize: 11, color: '#2563eb', marginTop: 1 }}>{trialDays} jour{trialDays > 1 ? 's' : ''} restant{trialDays > 1 ? 's' : ''}</div>}
            </div>
          )}
          {periodEnd && !isTrial && (
            <div style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: 10, background: 'var(--sl-surface)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase' }}>{isCancelling ? 'Accès jusqu\'au' : 'Prochain renouvellement'}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', marginTop: 2 }}>{formatDate(periodEnd)}</div>
              {periodDays !== null && !isCancelling && <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>dans {periodDays} jour{periodDays > 1 ? 's' : ''}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {error && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: 12, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>

        {/* Changer de plan */}
        {plan !== 'elite' && (
          <button
            onClick={() => setShowPlans(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--sl-border)', background: 'var(--sl-card)', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconRocket size={18} color="#6366f1" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Changer de plan</div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>Voir les fonctionnalités disponibles</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--sl-t3)', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Portail Stripe */}
        {isPaid && sub?.stripe_cus_id && (
          <button
            onClick={openPortal}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--sl-border)', background: 'var(--sl-card)', cursor: actionLoading ? 'wait' : 'pointer', textAlign: 'left', opacity: actionLoading ? 0.7 : 1 }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconCreditCard size={18} color="#3b82f6" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Gérer le paiement</div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>Moyen de paiement, adresse de facturation (Stripe)</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--sl-t3)', flexShrink: 0 }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
        )}

        {/* Factures */}
        {isPaid && sub?.stripe_cus_id && (
          <button
            onClick={() => setShowInvoices(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--sl-border)', background: 'var(--sl-card)', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconClipboard size={18} color="var(--sl-t2)" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Factures</div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>Historique des paiements</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--sl-t3)', flexShrink: 0, transform: showInvoices ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        <AnimatePresence>
          {showInvoices && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 4px 4px' }}>
                {invoicesLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--sl-t3)', fontSize: 13 }}>Chargement…</div>
                ) : invoices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--sl-t3)', fontSize: 13 }}>Aucune facture disponible</div>
                ) : (
                  invoices.map(inv => <InvoiceRow key={inv.id} inv={inv} />)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Annuler / Réactiver */}
        {isPaid && sub?.stripe_sub_id && (
          isCancelling ? (
            <button
              onClick={reactivate}
              disabled={actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)', cursor: actionLoading ? 'wait' : 'pointer', textAlign: 'left', opacity: actionLoading ? 0.7 : 1 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconCheckCircle size={18} color="#16a34a" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Réactiver l'abonnement</div>
                <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>L'accès sera maintenu après le {formatDate(periodEnd)}</div>
              </div>
            </button>
          ) : (
            <>
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--sl-border)', background: 'var(--sl-card)', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconX size={18} color="var(--sl-t3)" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t2)' }}>Annuler l'abonnement</div>
                    <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>Accès maintenu jusqu'au {formatDate(periodEnd)}</div>
                  </div>
                </button>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '16px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Confirmer l'annulation ?</div>
                  <div style={{ fontSize: 12, color: 'var(--sl-t2)', marginBottom: 14 }}>
                    Votre accès sera maintenu jusqu'au <strong>{formatDate(periodEnd)}</strong>. Vous pourrez réactiver à tout moment avant cette date.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmCancel(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--sl-border)', background: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Garder l'abonnement
                    </button>
                    <button onClick={async () => { setConfirmCancel(false); await cancel(); }} disabled={actionLoading} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                      Annuler quand même
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )
        )}
      </div>

      {/* Info plan gratuit */}
      {!isPaid && (
        <div style={{ padding: '16px', borderRadius: 12, background: 'var(--sl-surface)', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 4 }}>Vous êtes sur le plan gratuit</div>
          <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 12 }}>Passez à Starter, Pro ou Elite pour débloquer des fonctionnalités avancées.</div>
          <button onClick={() => setShowPlans(true)} style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'var(--sl-green)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Voir les plans
          </button>
        </div>
      )}

      <PlansMiniModal
        open={showPlans}
        onClose={() => setShowPlans(false)}
        currentPlanId={plan}
        clubId={clubId}
      />
    </div>
        </div>
      </motion.div>
    </>
  );
}
