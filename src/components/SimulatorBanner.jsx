import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoleSimulator, SIM_ROLES, SIM_PLANS } from '../hooks/useRoleSimulator.js';

export default function SimulatorBanner() {
  const { simRole, simPlan, isActive, setRole, setPlan, reset, currentSim } = useRoleSimulator();
  const [expanded, setExpanded] = useState(false);

  if (!isActive && !expanded) return (
    <button
      onClick={() => setExpanded(true)}
      style={{
        position: 'fixed', bottom: 80, right: 16, zIndex: 500,
        padding: '8px 14px', borderRadius: 20, border: '1px solid rgba(139,92,246,0.4)',
        backgroundColor: 'rgba(139,92,246,0.12)', color: '#8b5cf6',
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      Simuler
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        style={{
          position: 'fixed', bottom: 80, left: 0, right: 0, zIndex: 500,
          backgroundColor: isActive ? 'rgba(139,92,246,0.97)' : 'var(--sl-card)',
          borderTop: `2px solid ${isActive ? '#8b5cf6' : 'var(--sl-border)'}`,
          padding: 12,
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: expanded ? 12 : 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: isActive ? '#fff' : 'var(--sl-t1)' }}>
            👁️ Simulateur de vue
          </span>
          {isActive && (
            <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              {simRole && (
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>
                  {currentSim.role.icon} {currentSim.role.label}
                </span>
              )}
              {simPlan && (
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>
                  {currentSim.plan.icon} {currentSim.plan.label}
                </span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {isActive && (
              <button onClick={reset}
                style={{ padding: '5px 12px', borderRadius: 20, border: 'none', fontSize: 11, fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer' }}>
                Réinitialiser
              </button>
            )}
            <button onClick={() => setExpanded(p => !p)}
              style={{ padding: '5px 10px', borderRadius: 20, border: `1px solid ${isActive ? 'rgba(255,255,255,0.3)' : 'var(--sl-border)'}`, fontSize: 11, backgroundColor: 'transparent', color: isActive ? '#fff' : 'var(--sl-t2)', cursor: 'pointer' }}>
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Contenu déroulable */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Rôle */}
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Voir comme (rôle) :
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {SIM_ROLES.map(r => (
                      <button key={String(r.id)} onClick={() => setRole(r.id === simRole ? null : r.id)}
                        style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                          backgroundColor: simRole === r.id
                            ? (isActive ? 'rgba(255,255,255,0.3)' : r.color)
                            : (isActive ? 'rgba(255,255,255,0.12)' : 'var(--sl-surface)'),
                          color: isActive ? '#fff' : (simRole === r.id ? '#fff' : 'var(--sl-t2)'),
                        }}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plan */}
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Voir comme (abonnement club) :
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {SIM_PLANS.map(p => (
                      <button key={String(p.id)} onClick={() => setPlan(p.id === simPlan ? null : p.id)}
                        style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                          backgroundColor: simPlan === p.id
                            ? (isActive ? 'rgba(255,255,255,0.3)' : p.color)
                            : (isActive ? 'rgba(255,255,255,0.12)' : 'var(--sl-surface)'),
                          color: isActive ? '#fff' : (simPlan === p.id ? '#fff' : 'var(--sl-t2)'),
                        }}>
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <p style={{ margin: 0, fontSize: 10, color: isActive ? 'rgba(255,255,255,0.5)' : 'var(--sl-t3)' }}>
                  Le simulateur ne modifie que l'affichage — vos vraies données restent inchangées. Réinitialisez pour revenir en mode Admin.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
