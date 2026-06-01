import { motion, AnimatePresence } from 'framer-motion';
import { PLAN_ORDER } from '../../lib/subscriptionFeatures.ts';
import { getPlanMeta } from '../../lib/planHelpers.ts';

/**
 * UpgradePrompt — Modal bottom-sheet d'upgrade plan.
 *
 * Explique quelle feature est verrouillée, quel plan est requis,
 * et présente les plans disponibles avec leurs prix.
 *
 * @param {object}   props
 * @param {boolean}  props.open
 * @param {() => void} props.onClose
 * @param {string}   [props.currentPlanId]  — plan actuel du club (défaut: 'free')
 * @param {string}   [props.featureLabel]   — ex: "le covoiturage", "les compositions"
 * @param {string}   [props.requiredPlanId] — plan minimum requis
 *
 * @example
 * <UpgradePrompt
 *   open={showUpgrade}
 *   onClose={() => setShowUpgrade(false)}
 *   currentPlanId={features.planId}
 *   featureLabel="le covoiturage"
 *   requiredPlanId="starter"
 * />
 */
export default function UpgradePrompt({
  open,
  onClose,
  currentPlanId = 'free',
  featureLabel = 'cette fonctionnalité',
  requiredPlanId,
}) {
  const reqRank = PLAN_ORDER.indexOf(requiredPlanId ?? 'starter');
  const plansToShow = PLAN_ORDER.slice(Math.max(reqRank, 1)); // exclure 'free'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 2000,
            }}
            onClick={onClose}
          />

          {/* Contenu */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              maxWidth: 480, margin: '0 auto',
              zIndex: 2001,
              backgroundColor: 'var(--sl-card)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: 'var(--sl-border)',
              margin: '0 auto 20px',
            }} />

            <div style={{ textAlign: 'center' }}>
              {/* Icône */}
              <div style={{ fontSize: 38, marginBottom: 12 }}>🚀</div>

              <div style={{
                fontSize: 17, fontWeight: 800,
                color: 'var(--sl-t1)', marginBottom: 8,
              }}>
                Passez à l'étape supérieure
              </div>

              <div style={{
                fontSize: 13, color: 'var(--sl-t2)',
                lineHeight: 1.6, marginBottom: 20,
              }}>
                Débloquez{' '}
                <strong style={{ color: 'var(--sl-t1)' }}>{featureLabel}</strong>
                {' '}en passant à un plan supérieur.
              </div>

              {/* Plans disponibles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {plansToShow.map(planId => {
                  const meta = getPlanMeta(planId);
                  const isRequired = planId === requiredPlanId;
                  const isCurrent  = planId === currentPlanId;

                  return (
                    <div
                      key={planId}
                      style={{
                        padding: '12px 16px', borderRadius: 14, textAlign: 'left',
                        border: `2px solid ${isRequired ? meta.color : 'var(--sl-border)'}`,
                        backgroundColor: isRequired ? `${meta.color}10` : 'var(--sl-surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: isRequired ? meta.color : 'var(--sl-t1)',
                        }}>
                          {meta.badge} {meta.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
                          {meta.price === 0 ? 'Gratuit' : `${meta.price} €/mois`}
                        </div>
                      </div>

                      {isRequired && (
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          padding: '3px 10px', borderRadius: 8,
                          backgroundColor: `${meta.color}20`,
                          color: meta.color,
                          letterSpacing: '0.04em',
                        }}>
                          REQUIS
                        </span>
                      )}
                      {isCurrent && !isRequired && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: 'var(--sl-t3)',
                        }}>
                          Actuel
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 13,
                    border: '1px solid var(--sl-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Pas maintenant
                </button>

                <button
                  onClick={onClose}
                  style={{
                    flex: 2, padding: '13px 0', borderRadius: 13,
                    border: 'none', backgroundColor: 'var(--sl-green)',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(34,217,106,0.3)',
                  }}
                >
                  Voir les plans →
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
