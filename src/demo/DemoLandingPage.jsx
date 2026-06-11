import { useState } from 'react';
import { motion } from 'framer-motion';
import { trackCreateAccountClicked } from './demoAnalytics.js';

const PROFILES = [
  {
    id:          'president',
    emoji:       '👑',
    label:       'Président de club',
    description: 'Gérez votre club, événements, communication et statistiques',
    color:       '#1d4ed8',
    gradient:    'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    steps:       10,
  },
  {
    id:          'coach',
    emoji:       '🎯',
    label:       'Coach',
    description: 'Entraînements, convocations, présences et communication équipe',
    color:       '#059669',
    gradient:    'linear-gradient(135deg, #059669, #10b981)',
    steps:       6,
  },
  {
    id:          'communication',
    emoji:       '📣',
    label:       'Communication',
    description: 'Affiches, annonces, réseaux sociaux et sponsors',
    color:       '#7c3aed',
    gradient:    'linear-gradient(135deg, #7c3aed, #a78bfa)',
    steps:       6,
  },
  {
    id:          'parent',
    emoji:       '👨‍👧',
    label:       'Parent',
    description: 'Convocations, covoiturage, calendrier et notifications',
    color:       '#dc2626',
    gradient:    'linear-gradient(135deg, #dc2626, #f87171)',
    steps:       6,
  },
];

export default function DemoLandingPage({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  function handleSelect(profileId) {
    setSelected(profileId);
    setTimeout(() => onSelect(profileId), 300);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     9999,
        background: 'linear-gradient(160deg, #0a0f1e 0%, #0f1729 50%, #0d1526 100%)',
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding:    '24px 16px 40px',
        overflowY:  'auto',
      }}
    >
      {/* Background decoration */}
      <div style={{
        position:   'absolute',
        inset:      0,
        overflow:   'hidden',
        pointerEvents: 'none',
      }}>
        <div style={{
          position:   'absolute',
          top:        '-20%',
          left:       '50%',
          transform:  'translateX(-50%)',
          width:      700,
          height:     700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position:   'absolute',
          bottom:     '-10%',
          right:      '-10%',
          width:      400,
          height:     400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        }} />
      </div>

      {/* Logo + titre */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 40, position: 'relative' }}
      >
        <div style={{
          display:    'inline-flex',
          alignItems: 'center',
          gap:        10,
          background: 'rgba(255,255,255,0.05)',
          border:     '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding:    '6px 16px',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Démonstration interactive
          </span>
        </div>

        <h1 style={{
          fontSize:   'clamp(26px, 6vw, 44px)',
          fontWeight: 800,
          color:      '#fff',
          margin:     '0 0 12px',
          lineHeight: 1.2,
          letterSpacing: -0.5,
        }}>
          Découvrez SportLink
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #3b82f6, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            en 5 minutes
          </span>
        </h1>

        <p style={{
          fontSize:   16,
          color:      'rgba(255,255,255,0.55)',
          margin:     0,
          maxWidth:   460,
        }}>
          Choisissez votre profil pour une démonstration personnalisée.
          <br />
          Aucune inscription requise — aucune donnée enregistrée.
        </p>
      </motion.div>

      {/* Profile grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap:                 16,
        width:               '100%',
        maxWidth:            560,
        position:            'relative',
      }}>
        {PROFILES.map((profile, i) => (
          <motion.button
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
            onClick={() => handleSelect(profile.id)}
            onMouseEnter={() => setHovered(profile.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position:   'relative',
              background: hovered === profile.id || selected === profile.id
                ? profile.gradient
                : 'rgba(255,255,255,0.04)',
              border:     `1px solid ${hovered === profile.id || selected === profile.id ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 16,
              padding:    '20px 16px',
              cursor:     'pointer',
              textAlign:  'left',
              transition: 'all 0.2s ease',
              transform:  hovered === profile.id ? 'translateY(-2px)' : 'none',
              boxShadow:  hovered === profile.id
                ? `0 8px 32px ${profile.color}40`
                : '0 2px 8px rgba(0,0,0,0.2)',
              overflow:   'hidden',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10, lineHeight: 1 }}>{profile.emoji}</div>
            <div style={{
              fontSize:   14,
              fontWeight: 700,
              color:      '#fff',
              marginBottom: 6,
              lineHeight: 1.3,
            }}>
              {profile.label}
            </div>
            <div style={{
              fontSize:   12,
              color:      hovered === profile.id || selected === profile.id
                ? 'rgba(255,255,255,0.8)'
                : 'rgba(255,255,255,0.45)',
              lineHeight: 1.4,
              marginBottom: 12,
            }}>
              {profile.description}
            </div>
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        6,
              fontSize:   11,
              color:      hovered === profile.id || selected === profile.id
                ? 'rgba(255,255,255,0.9)'
                : 'rgba(255,255,255,0.3)',
              fontWeight: 600,
            }}>
              <span>{profile.steps} étapes</span>
              <span>→</span>
            </div>

            {/* Shimmer on hover */}
            {hovered === profile.id && (
              <div style={{
                position:   'absolute',
                top:        0,
                left:       '-100%',
                width:      '60%',
                height:     '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                animation:  'sl-shimmer 1.2s ease infinite',
                pointerEvents: 'none',
              }} />
            )}
          </motion.button>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          marginTop:  32,
          textAlign:  'center',
          position:   'relative',
        }}
      >
        <a
          href="/#register"
          onClick={() => trackCreateAccountClicked('landing-footer')}
          style={{
            background:  'transparent',
            border:      '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            color:       'rgba(255,255,255,0.5)',
            padding:     '10px 20px',
            fontSize:    13,
            cursor:      'pointer',
            transition:  'all 0.2s',
            textDecoration: 'none',
            display:     'inline-block',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          Créer directement mon compte →
        </a>
      </motion.div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes sl-shimmer {
          0%   { left: -100% }
          100% { left: 200% }
        }
      `}</style>
    </motion.div>
  );
}
