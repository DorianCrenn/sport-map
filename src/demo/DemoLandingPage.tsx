import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trackCreateAccountClicked } from './demoAnalytics.js';

const PROFILES = [
  {
    id:          'president',
    emoji:       '👑',
    label:       'Président',
    description: 'Événements, communication, statistiques et gestion complète du club',
    color:       '#1d4ed8',
    gradient:    'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    steps:       13,
  },
  {
    id:          'coach',
    emoji:       '🎯',
    label:       'Coach',
    description: 'Entraînements, convocations, présences et communication équipe',
    color:       '#059669',
    gradient:    'linear-gradient(135deg, #059669, #10b981)',
    steps:       13,
  },
  {
    id:          'communication',
    emoji:       '📣',
    label:       'Communication',
    description: 'Affiches PosterStudio, annonces, réseaux sociaux et sponsors',
    color:       '#7c3aed',
    gradient:    'linear-gradient(135deg, #7c3aed, #a78bfa)',
    steps:       6,
  },
  {
    id:          'parent',
    emoji:       '👨‍👧',
    label:       'Parent',
    description: 'Convocations, covoiturage, calendrier et notifications enfant',
    color:       '#dc2626',
    gradient:    'linear-gradient(135deg, #dc2626, #f87171)',
    steps:       7,
  },
  {
    id:          'player',
    emoji:       '⚽',
    label:       'Joueur',
    description: 'Convocations, covoiturage, calendrier et actualités de ton équipe',
    color:       '#0ea5e9',
    gradient:    'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    steps:       6,
  },
  {
    id:          'supporter',
    emoji:       '🏟️',
    label:       'Supporter',
    description: 'Suivez vos clubs favoris, découvrez les événements autour de vous',
    color:       '#f97316',
    gradient:    'linear-gradient(135deg, #f97316, #fb923c)',
    steps:       7,
  },
];

export default function DemoLandingPage({ onSelect }) {
  const [hovered,  setHovered]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [cols,     setCols]     = useState(() => window.innerWidth >= 560 ? 3 : 2);

  useEffect(() => {
    function updateCols() { setCols(window.innerWidth >= 560 ? 3 : 2); }
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  function handleSelect(profileId) {
    setSelected(profileId);
    setTimeout(() => onSelect(profileId), 280);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        background:     'var(--demo-full-bg)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'flex-start',
        padding:        '24px 16px 40px',
        overflowY:      'auto',
      }}
    >
      {/* Fond décoratif */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'var(--demo-deco1)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'var(--demo-deco2)',
        }} />
      </div>

      {/* Logo + titre */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'var(--demo-surface-bg)', border: '1px solid var(--demo-surface-border)',
          borderRadius: 12, padding: '5px 14px', marginBottom: 16,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-t2)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Démonstration interactive
          </span>
        </div>

        <h1 style={{
          fontSize:   'clamp(24px, 6vw, 40px)',
          fontWeight: 800, color: 'var(--sl-t1)',
          margin: '0 0 10px', lineHeight: 1.2, letterSpacing: -0.5,
        }}>
          Découvrez SportLink
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #3b82f6, #818cf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            en 5 minutes
          </span>
        </h1>

        <p style={{ fontSize: 15, color: 'var(--sl-t2)', margin: 0, maxWidth: 440 }}>
          Choisissez votre profil pour une démonstration personnalisée.
          <br />
          Aucune inscription requise — aucune donnée enregistrée.
        </p>
      </motion.div>

      {/* Grille 6 profils */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap:                 12,
        width:               '100%',
        maxWidth:            cols === 3 ? 640 : 480,
        position:            'relative',
      }}>
        {PROFILES.map((profile, i) => {
          const active = hovered === profile.id || selected === profile.id;
          return (
            <motion.button
              key={profile.id}
              data-profile={profile.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ delay: 0.12 + i * 0.06, duration: 0.35 }}
              onClick={() => handleSelect(profile.id)}
              onMouseEnter={() => setHovered(profile.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position:     'relative',
                background:   active ? profile.gradient : 'var(--demo-profile-card-bg)',
                border:       `1px solid ${active ? 'transparent' : 'var(--demo-profile-card-border)'}`,
                borderRadius: 14,
                padding:      '16px 14px',
                cursor:       'pointer',
                textAlign:    'left',
                transition:   'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow:    hovered === profile.id
                  ? `0 8px 28px ${profile.color}40`
                  : 'var(--demo-profile-shadow)',
                overflow:     'hidden',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8, lineHeight: 1 }}>{profile.emoji}</div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: active ? '#fff' : 'var(--sl-t1)',
                marginBottom: 4, lineHeight: 1.3,
              }}>
                {profile.label}
              </div>
              <div style={{
                fontSize: 11, lineHeight: 1.4, marginBottom: 10,
                color: active ? 'rgba(255,255,255,0.82)' : 'var(--sl-t2)',
              }}>
                {profile.description}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 10, fontWeight: 600,
                color: active ? 'rgba(255,255,255,0.9)' : 'var(--sl-t2)',
              }}>
                <span>{profile.steps} étapes</span>
                <span>→</span>
              </div>

              {/* Shimmer on hover */}
              {hovered === profile.id && (
                <div style={{
                  position: 'absolute', top: 0, left: '-100%',
                  width: '60%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                  animation: 'sl-shimmer 1.2s ease infinite',
                  pointerEvents: 'none',
                }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ marginTop: 28, textAlign: 'center', position: 'relative' }}
      >
        <a
          href="/#register"
          onClick={() => trackCreateAccountClicked('landing-footer')}
          style={{
            background: 'transparent',
            border: '1px solid var(--demo-surface-border)', borderRadius: 10,
            color: 'var(--sl-t2)', padding: '10px 20px',
            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            textDecoration: 'none', display: 'inline-block',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--demo-surface-border-hover)';
            e.currentTarget.style.color = 'var(--sl-t1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--demo-surface-border)';
            e.currentTarget.style.color = 'var(--sl-t2)';
          }}
        >
          Créer directement mon compte →
        </a>
      </motion.div>

      {/* Keyframes */}
      <style>{`
        @keyframes sl-shimmer {
          0%   { left: -100% }
          100% { left: 200% }
        }
      `}</style>
    </motion.div>
  );
}
