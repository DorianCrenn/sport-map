// Tour Président — 11 étapes — Workflow "Jour de match"
// Ligne de vie : Vendredi (convoquer → réponses → covoiturage)
//              → Dimanche (score → multiplex)
//              → Après-match (planifier événement → bilan annonce)
//              → CTA

export const presidentTour = [
  {
    id:    1,
    title: 'Votre cockpit de président',
    body:  'Vous êtes sur l\'écran principal. En haut : les convocations de ce soir. Dessous : les scores de toutes vos équipes, les annonces et le fil du club. Tout sans ouvrir 4 applications.',
    emoji: '👑',
    tip:   'Le guide reste visible. Réduisez-le (▼) pour naviguer librement, agrandissez-le (▲) pour le relire.',
    why:   'Un seul écran pour piloter un club en temps réel.',
  },

  // ── Vendredi soir — Préparer le match ────────────────────────────────────
  {
    id:          2,
    title:       'Convoquez l\'équipe en 3 taps',
    body:        'Il est vendredi 18h30. Sur l\'onglet Agenda, appuyez sur "Créer la convocation" sur la carte match. Sélectionnez vos joueurs et validez. Chaque joueur reçoit une notification push instantanément.',
    emoji:       '📋',
    clickTarget: 'convocation-btn',
    clickLabel:  'Bouton convocation sur la carte match (onglet Agenda)',
    onTab:       'Agenda',
    closeOverlayBefore: true,
    why:         '89% de taux de réponse aux convocations vs 60% par WhatsApp.',
  },
  {
    id:          3,
    title:       'Les réponses arrivent en direct',
    body:        'Dès qu\'un joueur répond, la carte match se met à jour. Appuyez dessus pour voir l\'état complet de votre effectif : présents, absents, en attente. Composez tactiquement 48h à l\'avance.',
    emoji:       '✅',
    clickTarget: 'coach-match-card',
    clickLabel:  'Carte match pour voir les réponses',
    closeOverlayBefore: true,
    why:         'Connaître son effectif à l\'avance améliore la préparation tactique.',
  },
  {
    id:          4,
    title:       'Le covoiturage s\'organise tout seul',
    body:        'En répondant à la convocation, vos joueurs indiquent s\'ils conduisent ou cherchent une place. Appuyez sur la carte de covoiturage pour voir les trajets disponibles. Zéro message WhatsApp.',
    emoji:       '🚗',
    clickTarget: 'carpool-card',
    clickLabel:  'Carte de covoiturage (défilez vers le bas si besoin)',
    closeOverlayBefore: true,
    why:         'Le covoiturage intégré réduit les retards de 35% et renforce la cohésion d\'équipe.',
  },

  // ── Dimanche — Le match ───────────────────────────────────────────────────
  {
    id:          5,
    title:       'Saisissez le score en direct',
    body:        'C\'est dimanche, le match commence. Appuyez sur le pupitre de score visible à l\'écran. Mettez à jour but après but. Supporters et familles voient le résultat s\'actualiser en temps réel.',
    emoji:       '🔴',
    clickTarget: 'live-score-pupitre',
    clickLabel:  'Pupitre de score live',
    why:         'Le score en direct augmente l\'engagement des supporters de 3×.',
  },
  {
    id:          6,
    title:       'Toutes vos équipes simultanément',
    body:        'Pendant que l\'Équipe 1 joue, la Réserve et l\'U17 jouent aussi. Appuyez sur la section Multiplex pour voir tous vos matchs en temps réel sur un seul écran. Sans rafraîchir.',
    emoji:       '📡',
    clickTarget: 'live-multiplex',
    clickLabel:  'Section Multiplex des scores live',
    why:         'Pilotez plusieurs équipes en même temps, depuis n\'importe où.',
  },

  // ── Après-match — Planifier et communiquer ────────────────────────────────
  {
    id:          7,
    title:       'Planifiez le prochain match',
    body:        'Le match est terminé. Appuyez sur + en bas au centre pour ouvrir le menu d\'actions. Planifiez maintenant le prochain événement pendant que vous y êtes.',
    emoji:       '➕',
    clickTarget: 'fab-add',
    clickLabel:  'Bouton + au centre de la barre en bas',
    closeOverlayBefore: true,
  },
  {
    id:          8,
    title:       'Créez l\'événement',
    body:        'Tapez sur "Créer un événement". Choisissez le type (match, tournoi, entraînement), la date et les équipes. Vos 342 abonnés seront notifiés automatiquement.',
    emoji:       '📅',
    clickTarget: 'fab-event',
    clickLabel:  '"Créer un événement" dans le menu',
    tryItAction: 'event-created',
    tryItLabel:  'Créer un événement',
    why:         'Les clubs qui publient leurs événements à l\'avance ont 2× plus d\'affluence.',
  },
  {
    id:          9,
    title:       'Partagez le bilan avec tous',
    body:        'Appuyez à nouveau sur + en bas. Vous allez envoyer le bilan du match à tous vos abonnés en notification push. 85% de taux d\'ouverture — vs 20% pour un email.',
    emoji:       '➕',
    clickTarget: 'fab-add',
    clickLabel:  'Bouton + au centre de la barre en bas',
    closeOverlayBefore: true,
  },
  {
    id:          10,
    title:       'Rédigez et envoyez l\'annonce',
    body:        'Tapez sur "Envoyer une annonce". Choisissez le type (résultat, info, urgence), rédigez votre message et envoyez. L\'annonce arrive instantanément sur le téléphone de chaque abonné.',
    emoji:       '📢',
    clickTarget: 'fab-announce',
    clickLabel:  '"Envoyer une annonce" dans le menu',
    tryItAction: 'announcement-sent',
    tryItLabel:  'Envoyer l\'annonce',
    why:         'Les annonces push ont un taux d\'ouverture de 85% vs 20% pour les emails.',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    id:    11,
    title: 'Prêt à créer votre club ?',
    body:  'Convocations, covoiturage, scores en direct, communication — tout en un. Créez votre club gratuitement en 2 minutes et commencez à fédérer votre communauté !',
    emoji: '🚀',
    isCTA: true,
  },
];
