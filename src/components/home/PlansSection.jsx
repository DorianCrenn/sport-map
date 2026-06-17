import { motion } from 'framer-motion';
import { usePlanConfig, STATIC_PRICING } from '../../hooks/usePlanConfig.js';

// Features affichées sur les cartes — dans l'ordre, labels humains uniquement
const PLAN_ROWS = [
  { key: 'POSTER_SIMPLE',           label: 'PosterStudio'            },
  { key: 'POSTER_EXPERT',           label: 'Mode Expert'             },
  { key: 'POSTER_WATERMARK_REMOVE', label: 'Sans filigrane'          },
  { key: 'POSTER_AI_BACKGROUND',    label: 'IA génération affiches'  },
  { key: 'CARPOOLING',              label: 'Covoiturage'             },
  { key: 'CARPOOLING_ALL_TEAMS',    label: 'Toutes les équipes'      },
  { key: 'TEAM_LINEUPS',            label: "Compositions d'équipes"  },
  { key: 'PLAYER_STATS',            label: 'Statistiques'            },
  { key: 'FEATURED_EVENTS',         label: 'Événements À la Une'     },
  { key: 'SPONSORS_ON_POSTERS',     label: 'Sponsors'                },
  { key: 'TOURNAMENTS',             label: 'Module Tournois'         },
  { key: 'AUTOMATIONS',             label: 'Automatisations IA'      },
];

function fmtQuota(value, unit = '') {
  if (value === null) return '∞';
  if (value === 0)    return '—';
  return `${value}${unit}`;
}

// ── PlanCard ──────────────────────────────────────────────────────────────────

function PlanCard({ planId, index, meta, quotas, canUseFeature, onCta }) {
  const color     = meta.color;
  const isPopular = meta.is_popular;

  const quotaPills = [
    { label: 'Affiches/mois',    value: fmtQuota(quotas?.postersPerMonth,      '/mois') },
    { label: 'À la Une',         value: fmtQuota(quotas?.featuredEventsMax,    '/mois') },
    { label: 'IA générations',   value: fmtQuota(quotas?.aiGeneratesPerMonth,  '/mois') },
  ].filter(q => q.value !== '—');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: index * 0.08, duration: 0.38, ease: 'easeOut' }}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        borderRadius: 20,
        border: `2px solid ${isPopular ? color : 'var(--sl-border)'}`,
        backgroundColor: isPopular ? `${color}08` : 'var(--sl-card)',
        overflow: 'hidden',
        minWidth: 260,
        scrollSnapAlign: 'start',
        flexShrink: 0,
      }}
    >
      {isPopular && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          backgroundColor: color, color: '#fff',
          fontSize: 10, fontWeight: 800,
          padding: '4px 12px',
          borderRadius: '0 18px 0 10px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          ⭐ Populaire
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '22px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{meta.badge}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--font-poppins, sans-serif)' }}>
            {meta.name}
          </span>
        </div>

        <div style={{ marginBottom: 8 }}>
          {meta.price_monthly === 0 ? (
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--sl-t1)', fontFamily: 'var(--font-poppins, sans-serif)' }}>
              Gratuit
            </span>
          ) : (
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--sl-t1)', fontFamily: 'var(--font-poppins, sans-serif)' }}>
              {meta.price_monthly}€
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--sl-t3)' }}>/mois</span>
            </span>
          )}
        </div>

        <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: 0, lineHeight: 1.4 }}>
          {meta.tagline}
        </p>
      </div>

      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '0 20px' }} />

      {/* Features */}
      <div style={{ padding: '14px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PLAN_ROWS.map(({ key, label }) => {
          const allowed = canUseFeature(key, planId);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {allowed ? (
                <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, backgroundColor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
              )}
              <span style={{ fontSize: 12, fontWeight: allowed ? 500 : 400, color: allowed ? 'var(--sl-t1)' : 'var(--sl-t3)', opacity: allowed ? 1 : 0.55 }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quotas pills */}
      {quotaPills.length > 0 && (
        <>
          <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '0 20px' }} />
          <div style={{ padding: '10px 20px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {quotaPills.map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 8,
                backgroundColor: value === '∞' ? `${color}12` : 'var(--sl-surface)',
                border: `1px solid ${value === '∞' ? `${color}25` : 'var(--sl-border)'}`,
              }}>
                <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: value === '∞' ? color : 'var(--sl-t2)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CTA */}
      <div style={{ padding: '12px 20px 20px' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          onClick={onCta}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12,
            border: isPopular ? 'none' : `1.5px solid ${color}50`,
            backgroundColor: isPopular ? color : `${color}10`,
            color: isPopular ? '#fff' : color,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-poppins, sans-serif)',
            boxShadow: isPopular ? `0 4px 16px ${color}35` : 'none',
            transition: 'all 0.12s',
          }}
        >
          {meta.cta_label}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Section principale ────────────────────────────────────────────────────────

export default function PlansSection({ onCta }) {
  const { planMeta, planOrder, canUseFeature, getQuotas, loading } = usePlanConfig();
  const handleCta = onCta ?? (() => {});

  // Pendant le chargement, on affiche avec les données statiques (pas de flash)
  const meta  = loading ? STATIC_PRICING : planMeta;
  const order = loading
    ? ['free', 'starter', 'pro', 'elite']
    : planOrder;

  return (
    <section style={{ padding: '48px 0 0' }}>
      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: 32, padding: '0 20px' }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 999,
          backgroundColor: 'rgba(34,217,106,0.10)',
          border: '1px solid rgba(34,217,106,0.20)',
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#22d96a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Plans &amp; Tarifs
          </span>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--sl-t1)', fontFamily: 'var(--font-poppins, sans-serif)', lineHeight: 1.2, margin: '0 0 10px' }}>
          Choisissez votre plan
        </h2>
        <p style={{ fontSize: 14, color: 'var(--sl-t2)', margin: 0, lineHeight: 1.6, maxWidth: 460, marginInline: 'auto' }}>
          Commencez gratuitement. Passez à un plan supérieur quand votre club est prêt.
        </p>
      </motion.div>

      {/* Mobile : scroll horizontal */}
      <div className="md:hidden" style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', padding: '0 20px 20px', WebkitOverflowScrolling: 'touch' }}>
        {order.map((planId, i) => meta[planId] && (
          <PlanCard
            key={planId}
            planId={planId}
            index={i}
            meta={meta[planId]}
            quotas={getQuotas(planId)}
            canUseFeature={canUseFeature}
            onCta={handleCta}
          />
        ))}
        <div style={{ flexShrink: 0, width: 4 }} />
      </div>

      {/* Desktop : grille 4 col */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, padding: '0 48px 20px', alignItems: 'stretch' }}>
        {order.map((planId, i) => meta[planId] && (
          <PlanCard
            key={planId}
            planId={planId}
            index={i}
            meta={meta[planId]}
            quotas={getQuotas(planId)}
            canUseFeature={canUseFeature}
            onCta={handleCta}
          />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: 'center', fontSize: 12, color: 'var(--sl-t3)', padding: '8px 20px 0', margin: 0 }}
      >
        Sans engagement · Résiliation à tout moment · Paiement sécurisé
      </motion.p>
    </section>
  );
}
