import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { trackSandboxWelcomeSeen, trackSandboxWelcomeEntered, trackCreateAccountClicked } from './demoAnalytics.js';

const PROFILE_LABELS = {
  president:    'Président de club',
  coach:        'Coach',
  communication:'Responsable communication',
  parent:       'Parent',
  player:       'Joueur',
  supporter:    'Supporter',
};

const FEATURES = [
  { emoji: '📅', title: 'Calendrier complet',   desc: 'Matchs, entraînements, tournois — tout le club en un seul agenda.' },
  { emoji: '📢', title: 'Annonces & push',       desc: 'Notifications push ciblées par équipe en quelques secondes.' },
  { emoji: '🎨', title: 'PosterStudio',          desc: '37 templates pro, 3 formats, couleurs de votre club.' },
  { emoji: '🚗', title: 'Covoiturage',           desc: 'Proposez ou demandez des places en 2 taps.' },
  { emoji: '📊', title: 'Statistiques',          desc: 'Vues, abonnés, participation — mesurez votre impact.' },
  { emoji: '👥', title: 'Effectif & convocs',    desc: '75 joueurs, convocations avec réponse en push.' },
];

export default function SandboxWelcome({ profile, completedSteps, onEnterSandbox, onChangeProfile, onCreateAccount }) {
  useEffect(() => {
    trackSandboxWelcomeSeen(profile);
  }, [profile]);

  function handleEnterSandbox() {
    trackSandboxWelcomeEntered(profile);
    onEnterSandbox();
  }

  function handleCreateAccount() {
    trackCreateAccountClicked('sandbox-welcome');
    onCreateAccount();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     9999,
        background: 'linear-gradient(160deg, #0a0f1e 0%, #0f1729 50%, #0d1526 100%)',
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowY:  'auto',
        padding:    '32px 16px 48px',
      }}
    >
      {/* Fond décoratif */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
        }} />
      </div>

      {/* Emoji succès */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
        style={{ fontSize: 64, lineHeight: 1, marginBottom: 20, position: 'relative' }}
      >
        🎉
      </motion.div>

      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: 24, position: 'relative' }}
      >
        <h1 style={{
          fontSize:   'clamp(22px, 5vw, 34px)',
          fontWeight: 800,
          color:      '#fff',
          margin:     '0 0 10px',
          lineHeight: 1.2,
          letterSpacing: -0.5,
        }}>
          Vous venez de découvrir
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #3b82f6, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
          }}>SportLink !</span>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
          }}>
            ✓ {completedSteps} étapes complétées
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
          }}>
            🎯 {PROFILE_LABELS[profile] || profile}
          </span>
        </div>
      </motion.div>

      {/* Grille fonctionnalités */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ width: '100%', maxWidth: 560, marginBottom: 28, position: 'relative' }}
      >
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.45)',
          textAlign: 'center', marginBottom: 14, fontWeight: 600,
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}>
          Explorez librement
        </p>
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:                 10,
        }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              style={{
                background:   'rgba(255,255,255,0.04)',
                border:       '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding:      '12px 14px',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>{f.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}
      >
        <button
          onClick={handleEnterSandbox}
          style={{
            width:        '100%',
            background:   'linear-gradient(135deg, #1d4ed8, #7c3aed)',
            border:       'none',
            borderRadius: 12,
            color:        '#fff',
            padding:      '14px 24px',
            fontSize:     15,
            fontWeight:   700,
            cursor:       'pointer',
            transition:   'opacity 0.2s, transform 0.1s',
            letterSpacing: 0.2,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)'; }}
          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onPointerUp={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
        >
          🏖️ Explorer librement SportLink →
        </button>

        <button
          onClick={handleCreateAccount}
          style={{
            width:        '100%',
            background:   'rgba(255,255,255,0.05)',
            border:       '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            color:        'rgba(255,255,255,0.75)',
            padding:      '12px 24px',
            fontSize:     14,
            fontWeight:   600,
            cursor:       'pointer',
            transition:   'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background   = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.color        = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background   = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color        = 'rgba(255,255,255,0.75)';
          }}
        >
          🚀 Créer mon club gratuitement
        </button>

        {onChangeProfile && (
          <button
            onClick={onChangeProfile}
            style={{
              background: 'none', border: 'none', padding: '6px 0',
              fontSize: 13, color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer', textAlign: 'center', transition: 'color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
          >
            ↩ Voir la démo avec un autre profil
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
