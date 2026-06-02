import { motion, AnimatePresence } from 'framer-motion';
import PlansSection from '../home/PlansSection.jsx';
import UpgradeDiff from './UpgradeDiff.jsx';
import { getPlanMeta } from '../../lib/planHelpers.ts';
import { PLAN_ORDER } from '../../lib/subscriptionFeatures.ts';

/**
 * PlansMiniModal — Drawer plein-écran affichant les plans d'abonnement.
 *
 * @param {boolean}  open
 * @param {() => void} onClose
 * @param {string}   [currentPlanId]  — plan actuel du club (pour afficher le diff en haut)
 * @param {string}   [nextPlanId]     — plan suggéré (déduit de currentPlanId si absent)
 */
export default function PlansMiniModal({ open, onClose, currentPlanId, nextPlanId: nextPlanIdProp }) {
  const nextPlanId = nextPlanIdProp ?? (currentPlanId
    ? PLAN_ORDER[PLAN_ORDER.indexOf(currentPlanId) + 1] ?? null
    : null);

  const currentMeta = currentPlanId ? getPlanMeta(currentPlanId) : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="plans-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 2100 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="plans-modal-drawer"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              height: '92dvh',
              zIndex: 2101,
              backgroundColor: 'var(--sl-bg)',
              borderRadius: '20px 20px 0 0',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--sl-border)',
              backgroundColor: 'var(--sl-card)',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)' }}>
                  Plans d'abonnement
                </div>
                {currentMeta && (
                  <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
                    Plan actuel : {currentMeta.badge} {currentMeta.name}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: 'none', backgroundColor: 'var(--sl-surface)',
                  cursor: 'pointer', color: 'var(--sl-t2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

              {/* Bannière diff si plan connu et upgradeable */}
              {currentPlanId && nextPlanId && (
                <div style={{ padding: '16px 20px 0' }}>
                  <UpgradeDiff
                    currentPlanId={currentPlanId}
                    nextPlanId={nextPlanId}
                    onUpgrade={onClose}
                  />
                </div>
              )}

              {/* Grille complète des plans */}
              <PlansSection onCta={onClose} />

              {/* Note bas */}
              <div style={{ padding: '0 20px 32px', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: 0, lineHeight: 1.6 }}>
                  Pour passer à un plan supérieur, contacte-nous à{' '}
                  <a href="mailto:hello@sportlink.fr" style={{ color: 'var(--sl-blue)', textDecoration: 'none', fontWeight: 600 }}>
                    hello@sportlink.fr
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
