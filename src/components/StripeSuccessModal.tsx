import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURE_GATES, PLAN_RANK } from '../lib/subscriptionFeatures.js';

const PLAN_CFG: Record<string, { name: string; badge: string; color: string; headline: string }> = {
  starter: {
    name: 'Starter',
    badge: '🔵',
    color: '#3b82f6',
    headline: 'Bienvenue dans le plan Starter !',
  },
  pro: {
    name: 'Club Pro',
    badge: '🟣',
    color: '#8b5cf6',
    headline: 'Bienvenue dans le plan Club Pro !',
  },
  elite: {
    name: 'Elite',
    badge: '👑',
    color: '#f59e0b',
    headline: 'Bienvenue dans le plan Elite !',
  },
};

const FEATURE_LABELS: Record<string, string> = {
  POSTER_WATERMARK_REMOVE:   'Suppression du watermark SportLink',
  POSTER_EXPERT:             'Mode Expert PosterStudio',
  POSTER_TEMPLATES_ADVANCED: 'Templates avancés',
  POSTER_AI_BACKGROUND:      'Fonds IA illimités',
  POSTER_AI_ELEMENTS:        'Éléments décoratifs IA',
  POSTER_AI_BRANDING:        'Analyse ADN visuel club',
  POSTER_SPONSORS_LOGOS:     'Logos sponsors sur affiches',
  CARPOOLING:                'Covoiturage (1 équipe)',
  CARPOOLING_ALL_TEAMS:      'Covoiturage toutes équipes',
  CARPOOLING_AUTO_REMINDERS: 'Relances covoiturage auto',
  TEAM_LINEUPS:              'Compositions d\'équipe',
  ADVANCED_LINEUPS:          'Compositions avancées',
  PLAYER_STATS:              'Statistiques joueurs',
  TEAM_STATS:                'Statistiques équipes',
  ADVANCED_STATS:            'Stats avancées',
  FEATURED_EVENTS:           'Événements à la une',
  SPONSORS_FEED_CARDS:       'Cartes sponsors dans le feed',
  TOURNAMENTS:               'Gestion de tournois',
  ADVANCED_ANALYTICS:        'Analytics avancées',
  AUTOMATIONS:               'Automatisations',
  AI_BRANDING:               'IA branding avancée',
};

function getUnlockedFeatures(plan: string): string[] {
  const planRank = PLAN_RANK[plan as keyof typeof PLAN_RANK] ?? 0;
  return Object.entries(FEATURE_GATES)
    .filter(([, minPlan]) => {
      const minRank = PLAN_RANK[minPlan as keyof typeof PLAN_RANK] ?? 0;
      return minRank === planRank; // Features débloquées exactement à ce tier
    })
    .map(([key]) => FEATURE_LABELS[key])
    .filter(Boolean)
    .slice(0, 6);
}

// Confetti simple
function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    color: ['#22d96a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ffffff'][i % 6],
    size: 6 + Math.random() * 8,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3102 }}>
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: 720, opacity: 0 }}
          transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', top: 0, left: 0, width: p.size, height: p.size, borderRadius: Math.random() > 0.5 ? '50%' : 2, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

interface StripeSuccessModalProps {
  plan:       string;
  onClose:    () => void;
  onViewSub?: () => void;
}

export default function StripeSuccessModal({ plan, onClose, onViewSub }: StripeSuccessModalProps) {
  const [visible, setVisible] = useState(true);
  const cfg = PLAN_CFG[plan] ?? PLAN_CFG.starter;
  const unlocked = getUnlockedFeatures(plan);

  // Fermeture automatique après 30s
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 30000);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <Confetti />

          {/* Backdrop */}
          <motion.div
            key="success-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3100 }}
          />

          {/* Modal */}
          <motion.div
            key="success-modal"
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 3101,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 420,
                backgroundColor: 'var(--sl-card)',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: `0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.color}40`,
                pointerEvents: 'auto',
              }}
            >
              {/* En-tête coloré */}
              <div style={{ background: `linear-gradient(135deg, ${cfg.color}22 0%, ${cfg.color}08 100%)`, padding: '32px 24px 24px', textAlign: 'center', borderBottom: `1px solid ${cfg.color}20`, position: 'relative' }}>
                {/* Close button */}
                <button
                  onClick={handleClose}
                  aria-label="Fermer"
                  style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 18 }}
                  style={{ fontSize: 52, marginBottom: 12, display: 'block' }}
                >
                  {cfg.badge}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 4 }}>
                    {cfg.headline}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--sl-t3)' }}>
                    Votre abonnement est actif · 14 jours d'essai inclus
                  </div>
                </motion.div>
              </div>

              {/* Features débloquées */}
              {unlocked.length > 0 && (
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Nouvelles fonctionnalités
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {unlocked.map((feat, i) => (
                      <motion.div
                        key={feat}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.07 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${cfg.color}20`, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--sl-t1)' }}>{feat}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {onViewSub && (
                  <button
                    onClick={() => { handleClose(); onViewSub(); }}
                    style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: cfg.color, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Voir mon abonnement
                  </button>
                )}
                <button
                  onClick={handleClose}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid var(--sl-border)', background: 'transparent', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Commencer à utiliser {cfg.name}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
