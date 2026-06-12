import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { trackSandboxWelcomeSeen, trackSandboxWelcomeEntered, trackCreateAccountClicked } from './demoAnalytics.js';

const PROFILE_LABELS = {
  president:     'Président de club',
  coach:         'Coach',
  communication: 'Responsable communication',
  parent:        'Parent',
  player:        'Joueur',
  supporter:     'Supporter',
};

// Titre personnalisé par profil
const PROFILE_HEADLINE = {
  president:     'Votre club mérite une vitrine professionnelle.',
  coach:         'Vos joueurs attendent leurs convocations sur SportLink.',
  communication: 'Vos prochaines affiches sont à 2 clics.',
  parent:        'Plus jamais d\'organisation par WhatsApp.',
  player:        'Retrouvez vos convocations, vos matchs, vos trajets.',
  supporter:     'Suivez vos clubs favoris en temps réel.',
};

// Features prioritaires par profil (6 max)
const PROFILE_FEATURES = {
  president: [
    { emoji: '📅', title: 'Calendrier complet',   desc: 'Matchs, entraînements, tournois — tout le club en un agenda.' },
    { emoji: '📢', title: 'Annonces & push',       desc: '85 % de taux d\'ouverture — vs 20 % pour les emails.' },
    { emoji: '🎨', title: 'PosterStudio',          desc: '37 templates pro, 3 formats, couleurs du club.' },
    { emoji: '📋', title: 'Convocations',          desc: '89 % de taux de réponse en moins de 4 heures.' },
    { emoji: '🚗', title: 'Covoiturage intégré',   desc: 'Coordination transport sans aucun WhatsApp.' },
    { emoji: '📊', title: 'Statistiques',          desc: 'Mesurez l\'impact réel de votre communication.' },
  ],
  coach: [
    { emoji: '📋', title: 'Convocations push',     desc: '89 % de réponse en moins de 4 heures.' },
    { emoji: '✅', title: 'Présences en direct',   desc: 'Compteurs mis à jour à chaque réponse joueur.' },
    { emoji: '🏃', title: 'Entraînements',         desc: 'Créneaux + rappels automatiques la veille.' },
    { emoji: '💬', title: 'Messages équipe',       desc: 'Annonces ciblées, consignes tactiques en push.' },
    { emoji: '🔴', title: 'Live score',            desc: 'Pupitre +1 directement depuis le terrain.' },
    { emoji: '🎨', title: 'Affiche résultat',      desc: 'Générée en 1 clic après la saisie du score.' },
  ],
  communication: [
    { emoji: '🎨', title: 'PosterStudio',          desc: '37 templates, 3 formats, couleurs du club.' },
    { emoji: '📱', title: 'Partage en 1 tap',      desc: 'WhatsApp · Instagram · Facebook — directement.' },
    { emoji: '📢', title: 'Annonces ciblées',      desc: '85 % de taux d\'ouverture en push notification.' },
    { emoji: '📋', title: 'Affiche Convocation',   desc: 'Liste des 14 joueurs injectée automatiquement.' },
    { emoji: '⚡', title: 'Affiche résultat',      desc: 'Générée et partagée dans les minutes après le match.' },
    { emoji: '🤝', title: 'Sponsors valorisés',    desc: '3× plus de renouvellements avec visibilité in-app.' },
  ],
  parent: [
    { emoji: '📋', title: 'Convocations + transport', desc: 'Répondez et déclarez votre mode de transport en 1 geste.' },
    { emoji: '🚗', title: 'Covoiturage auto',      desc: 'Trajet créé automatiquement si vous conduisez.' },
    { emoji: '📍', title: 'Géolocalisation',       desc: 'Adresse exacte du stade, itinéraire intégré.' },
    { emoji: '⭐', title: 'Favoris + rappels',     desc: 'Rappel automatique la veille et le jour J.' },
    { emoji: '📢', title: 'Annonces du club',      desc: 'Résultats, infos pratiques en notification push.' },
    { emoji: '📅', title: 'Agenda enfant',         desc: 'Tous les matchs de votre enfant dans un seul endroit.' },
  ],
  player: [
    { emoji: '📋', title: 'Tes convocations',      desc: 'Notification push + confirmation en 1 tap.' },
    { emoji: '🚗', title: 'Covoiturage',           desc: 'Propose ou trouve une place en 2 taps.' },
    { emoji: '📅', title: 'Agenda complet',        desc: 'Tous tes matchs, entraînements et tournois.' },
    { emoji: '⭐', title: 'Favoris + rappels',     desc: 'Rappel automatique pour ne rien rater.' },
    { emoji: '👥', title: 'Ton équipe',            desc: '75 joueurs, postes, numéros — tout l\'effectif.' },
    { emoji: '📢', title: 'Annonces du staff',     desc: 'Consignes, infos, résultats en push instant.' },
  ],
  supporter: [
    { emoji: '🏟️', title: 'Clubs à suivre',       desc: 'Football, basket, rugby, handball — tous les sports.' },
    { emoji: '🔔', title: 'Notifications push',    desc: 'Résultats dans les 5 minutes après le coup de sifflet.' },
    { emoji: '📅', title: 'Agenda complet',        desc: 'Tous les matchs à venir avec lieu et horaire.' },
    { emoji: '🔴', title: 'Live score',            desc: 'Score en direct sans rafraîchir la page.' },
    { emoji: '🎨', title: 'Affiches des clubs',    desc: 'Partagez les affiches de vos clubs favoris.' },
    { emoji: '🚗', title: 'Covoiturage',           desc: 'Venez ensemble aux matchs à domicile et à l\'extérieur.' },
  ],
};

export default function SandboxWelcome({ profile, completedSteps, onEnterSandbox, onChangeProfile, onCreateAccount }) {
  const features = PROFILE_FEATURES[profile] ?? PROFILE_FEATURES.president;
  const headline = PROFILE_HEADLINE[profile] ?? 'Découvrez tout ce que SportLink peut faire pour vous.';

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
        position:      'fixed',
        inset:         0,
        zIndex:        9999,
        background:    'linear-gradient(160deg, #0a0f1e 0%, #0f1729 50%, #0d1526 100%)',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        justifyContent:'flex-start',
        overflowY:     'auto',
        padding:       '32px 16px 48px',
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

      {/* Titre + headline personnalisé */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: 24, position: 'relative', maxWidth: 480 }}
      >
        <h1 style={{
          fontSize:      'clamp(20px, 5vw, 30px)',
          fontWeight:    800,
          color:         '#fff',
          margin:        '0 0 8px',
          lineHeight:    1.2,
          letterSpacing: -0.5,
        }}>
          {headline}
        </h1>

        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 14px', lineHeight: 1.5 }}>
          Vous venez de parcourir la démo en profil&nbsp;
          <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
            {PROFILE_LABELS[profile] ?? profile}
          </span>.
          Explorez librement maintenant, ou créez votre club en 2 minutes.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
          }}>
            ✓ {completedSteps} étapes complétées
          </span>
        </div>
      </motion.div>

      {/* Grille fonctionnalités personnalisées */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ width: '100%', maxWidth: 560, marginBottom: 28, position: 'relative' }}
      >
        <p style={{
          fontSize: 11, color: 'rgba(255,255,255,0.35)',
          textAlign: 'center', marginBottom: 12, fontWeight: 700,
          letterSpacing: 1, textTransform: 'uppercase',
        }}>
          Ce que vous pouvez faire maintenant
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {features.map((f, i) => (
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
            e.currentTarget.style.background  = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.color       = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.color       = 'rgba(255,255,255,0.75)';
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
