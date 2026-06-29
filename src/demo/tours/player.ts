// Tour Joueur — 7 étapes
// Convocation personnelle → Covoiturage → Favoris → Multiplex → Profil XP → CTA

export const playerTour = [
  // ── 1 : Intro ────────────────────────────────────────────────────────────
  {
    id:    1,
    title: 'Votre espace athlète',
    body:  'Bienvenue sur votre cockpit joueur. En haut : votre convocation pour le prochain match. Dessous : les annonces du staff, les scores de toutes les équipes et votre progression personnelle. Tout en un seul endroit.',
    emoji: '⚽',
    tip:   'Le guide reste visible. Réduisez-le (▼) pour naviguer librement, agrandissez-le (▲) pour le relire.',
    why:   'Les joueurs SportLink ne manquent plus jamais une convocation.',
  },

  // ── Convocation ───────────────────────────────────────────────────────────
  {
    id:          2,
    title:       'Répondez à votre convocation',
    body:        'Présent, absent ou indisponible ? Appuyez sur le bouton correspondant. Votre coach voit votre réponse instantanément et peut composer son équipe 48 h à l\'avance.',
    emoji:       '✅',
    clickTarget: 'convocation-respond',
    clickLabel:  'Boutons Présent / Absent / Indisponible (onglet Agenda)',
    onTab:       'Agenda',
    tryItAction: 'convocation-responded',
    tryItLabel:  'Répondre à la convocation',
    why:         'Un taux de réponse élevé permet au coach de mieux préparer les matchs.',
  },

  // ── Covoiturage ───────────────────────────────────────────────────────────
  {
    id:          3,
    title:       'Organisez votre transport',
    body:        'Un covoiturage est disponible pour ce déplacement. Appuyez sur la carte pour rejoindre un trajet. Le conducteur est notifié automatiquement. Zéro message WhatsApp.',
    emoji:       '🚗',
    clickTarget: 'carpool-card',
    clickLabel:  'Carte de covoiturage sur l\'écran',
    tryItAction: 'carpool-requested',
    tryItLabel:  'Demander une place',
    closeOverlayBefore: true,
    why:         'Le covoiturage intégré réduit les retards et renforce la cohésion d\'équipe.',
  },

  // ── Favoris ───────────────────────────────────────────────────────────────
  {
    id:          4,
    title:       'Sauvegardez les matchs à ne pas rater',
    body:        'Appuyez sur l\'étoile ⭐ sur une carte match pour recevoir un rappel la veille. Suivez aussi les autres équipes du club — Réserve, U17, Féminines — depuis le même endroit.',
    emoji:       '⭐',
    clickTarget: 'favorite-btn',
    clickLabel:  'Étoile ⭐ sur une carte match',
    tryItAction: 'event-favorited',
    tryItLabel:  'Sauvegarder le match',
    closeOverlayBefore: true,
    why:         'Les joueurs qui suivent l\'ensemble du club sont 2× plus engagés.',
  },

  // ── Multiplex ─────────────────────────────────────────────────────────────
  {
    id:          5,
    title:       'Scores de toutes vos équipes en direct',
    body:        'Appuyez sur la section Multiplex pour voir les matchs en cours de toutes les équipes du club simultanément. Mis à jour en temps réel par vos coachs — même depuis le vestiaire.',
    emoji:       '📡',
    clickTarget: 'live-multiplex',
    clickLabel:  'Section Multiplex des scores live',
    why:         'Rester connecté à son club renforce l\'appartenance et la motivation.',
  },

  // ── Profil joueur ─────────────────────────────────────────────────────────
  {
    id:          6,
    title:       'Votre profil athlète',
    body:        'Appuyez sur l\'onglet Profil en bas à droite. Vous y trouvez votre XP, vos badges débloqués (ponctualité, engagement, présence…) et votre progression dans le club. Une vraie carte d\'identité sportive.',
    emoji:       '🏅',
    clickTarget: 'tab-profil',
    clickLabel:  'Onglet Profil en bas à droite',
    closeOverlayBefore: true,
    why:         'La gamification augmente la fidélité et l\'engagement des joueurs de 40 %.',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    id:    7,
    title: 'Rejoignez SportLink',
    body:  'Convocations, covoiturage, scores en direct, badges XP — gérez tout en un tap. Créez votre compte gratuitement en 30 secondes.',
    emoji: '⚽',
    isCTA: true,
  },
];
