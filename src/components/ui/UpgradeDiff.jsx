import { motion } from 'framer-motion';
import { PLAN_QUOTAS } from '../../lib/subscriptionFeatures.ts';
import { canUseFeature, getPlanMeta } from '../../lib/planHelpers.ts';

// Features sur lesquelles calculer le diff — dans l'ordre d'affichage
const ALL_ROWS = [
  { key: 'POSTER_SIMPLE',           label: 'PosterStudio'                 },
  { key: 'POSTER_EXPERT',           label: 'Mode Expert PosterStudio'     },
  { key: 'POSTER_WATERMARK_REMOVE', label: 'Sans filigrane'               },
  { key: 'POSTER_AI_BACKGROUND',    label: 'IA génération affiches'       },
  { key: 'CARPOOLING',              label: 'Covoiturage'                  },
  { key: 'CARPOOLING_ALL_TEAMS',    label: 'Covoiturage toutes équipes'   },
  { key: 'TEAM_LINEUPS',            label: "Compositions d'équipes"       },
  { key: 'PLAYER_STATS',            label: 'Statistiques équipes & joueurs'},
  { key: 'FEATURED_EVENTS',         label: 'Événements "À la Une"'        },
  { key: 'SPONSORS_ON_POSTERS',     label: 'Sponsors sur les affiches'    },
  { key: 'SPONSORS_FEED_CARDS',     label: 'Cartes sponsors dans le feed' },
  { key: 'TOURNAMENTS',             label: 'Module Tournois'              },
  { key: 'CO2_REPORTS',             label: 'Bilan CO2'                    },
  { key: 'AUTOMATIONS',             label: 'Automatisations IA'           },
  { key: 'AI_BRANDING',             label: 'Charte graphique IA'          },
  { key: 'ADVANCED_STATS',          label: 'Statistiques avancées'        },
];

// Comparaison de quotas lisibles
function quotaLabel(value, unit = '') {
  if (value === null) return '∞';
  if (value === 0)    return '—';
  return `${value}${unit}`;
}

function getQuotaImprovements(fromPlan, toPlan) {
  const from = PLAN_QUOTAS[fromPlan];
  const to   = PLAN_QUOTAS[toPlan];
  const improvements = [];

  if ((from.postersPerMonth !== null && to.postersPerMonth === null) ||
      (from.postersPerMonth !== null && to.postersPerMonth !== null && to.postersPerMonth > from.postersPerMonth)) {
    improvements.push({
      label: 'Affiches par mois',
      from: quotaLabel(from.postersPerMonth, '/mois'),
      to:   quotaLabel(to.postersPerMonth, '/mois'),
    });
  }

  if (to.featuredEventsMax > from.featuredEventsMax) {
    improvements.push({
      label: 'Événements "À la Une"',
      from: quotaLabel(from.featuredEventsMax, '/mois'),
      to:   quotaLabel(to.featuredEventsMax, '/mois'),
    });
  }

  if ((from.aiGeneratesPerMonth === 0 && to.aiGeneratesPerMonth !== 0) ||
      (from.aiGeneratesPerMonth !== null && to.aiGeneratesPerMonth === null)) {
    improvements.push({
      label: 'Générations IA',
      from: quotaLabel(from.aiGeneratesPerMonth, '/mois'),
      to:   quotaLabel(to.aiGeneratesPerMonth, '/mois'),
    });
  }

  if (from.carpoolingTeamsMax === 0 && to.carpoolingTeamsMax !== 0) {
    improvements.push({ label: 'Covoiturage', from: 'Verrouillé', to: '1 équipe' });
  } else if (from.carpoolingTeamsMax === 1 && to.carpoolingTeamsMax === null) {
    improvements.push({ label: 'Équipes covoiturage', from: '1 équipe', to: 'Toutes' });
  }

  return improvements;
}

/**
 * UpgradeDiff — Affiche ce qu'un club gagne en passant d'un plan à un autre.
 *
 * @param {string}    currentPlanId
 * @param {string}    nextPlanId
 * @param {() => void} [onUpgrade]  — CTA "Passer à [plan]"
 * @param {boolean}   [compact]     — mode compact (sans bordure de section, pour UpgradePrompt)
 */
export default function UpgradeDiff({ currentPlanId, nextPlanId, onUpgrade, compact = false }) {
  if (!currentPlanId || !nextPlanId) return null;

  const currentMeta = getPlanMeta(currentPlanId);
  const nextMeta    = getPlanMeta(nextPlanId);

  const gainedFeatures = ALL_ROWS.filter(({ key }) =>
    canUseFeature(key, nextPlanId) && !canUseFeature(key, currentPlanId)
  );

  const improvedQuotas = getQuotaImprovements(currentPlanId, nextPlanId);

  if (gainedFeatures.length === 0 && improvedQuotas.length === 0) return null;

  const accentColor = nextMeta.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={compact ? {} : {
        borderRadius: 16, overflow: 'hidden',
        border: `1.5px solid ${accentColor}30`,
        backgroundColor: `${accentColor}07`,
      }}
    >
      {/* Header */}
      {!compact && (
        <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            backgroundColor: `${accentColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>
            {nextMeta.badge}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: accentColor, lineHeight: 1.2 }}>
              Passer à {nextMeta.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>
              {nextMeta.price === 0 ? 'Gratuit' : `${nextMeta.price} €/mois`}
            </div>
          </div>
        </div>
      )}

      {/* Titre compact */}
      {compact && (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t2)', marginBottom: 10 }}>
          En passant à{' '}
          <span style={{ color: accentColor }}>{nextMeta.badge} {nextMeta.name}</span>
          {' '}tu débloques aussi :
        </div>
      )}

      {/* Features gagnées */}
      <div style={{ padding: compact ? '0' : '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {gainedFeatures.map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              backgroundColor: `${accentColor}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10,
            }}>
              🆕
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sl-t1)' }}>{label}</span>
          </div>
        ))}

        {/* Quotas améliorés */}
        {improvedQuotas.map(({ label, from, to }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              backgroundColor: 'rgba(34,217,106,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10,
            }}>
              📈
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sl-t1)' }}>
              {label} :{' '}
              <span style={{ color: 'var(--sl-t3)', textDecoration: 'line-through', fontWeight: 400 }}>{from}</span>
              {' → '}
              <span style={{ color: '#22d96a', fontWeight: 700 }}>{to}</span>
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {onUpgrade && (
        <div style={{ padding: compact ? '10px 0 0' : '4px 16px 14px' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onUpgrade}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
              backgroundColor: accentColor, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 4px 14px ${accentColor}35`,
            }}
          >
            Passer à {nextMeta.name} — {nextMeta.price} €/mois →
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
