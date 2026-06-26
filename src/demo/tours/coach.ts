// Tour Coach — 13 étapes
// Ligne de vie : Séance du soir (training-card)
//              → Planifier le match (créer événement)
//              → Affiche → Convoquer → Réponses → Covoiturage
//              → Match live (score + multiplex)
//              → Bilan d'après-match
//              → CTA

export const coachTour = [
  // ── 1 : Intro ────────────────────────────────────────────────────────────
  {
    id:    1,
    title: 'Votre cockpit coach',
    body:  'Bienvenue sur l\'écran principal. En haut : la séance d\'entraînement de ce soir. Dessous : la carte match avec l\'état des convocations, les scores live et le fil du club. Tout sans ouvrir 4 applications.',
    emoji: '🎯',
    tip:   'Le guide reste visible. Réduisez-le (▼) pour naviguer librement, agrandissez-le (▲) pour le relire.',
    why:   'Les coachs SportLink passent 70 % moins de temps sur la logistique.',
  },

  // ── Entraînement du soir ───────────────────────────────────────────────────
  {
    id:          2,
    title:       'La séance de ce soir',
    body:        'En haut de l\'onglet Agenda : la carte de votre séance d\'entraînement. Heure, lieu, équipe — tout en un coup d\'œil. Appuyez sur la carte pour consulter les présences et gérer vos créneaux récurrents.',
    emoji:       '🏃',
    clickTarget: 'training-card',
    clickLabel:  'Carte d\'entraînement (onglet Agenda)',
    onTab:       'Agenda',
    closeOverlayBefore: true,
    tip:         'Depuis TrainingManager, ajoutez des créneaux récurrents — vos joueurs voient automatiquement le planning dans l\'app.',
    why:         'Les clubs qui publient leur planning d\'entraînement ont 40 % de présences en plus.',
  },

  // ── Planifier le match ────────────────────────────────────────────────────
  {
    id:          3,
    title:       'Planifiez le match de samedi',
    body:        'Un match à venir ? Appuyez sur le bouton + au centre de la barre en bas pour ouvrir le menu d\'actions.',
    emoji:       '📅',
    clickTarget: 'fab-add',
    clickLabel:  'Bouton + au centre de la barre en bas',
    closeOverlayBefore: true,
  },
  {
    id:          4,
    title:       'Créez l\'événement',
    body:        'Tapez sur "Créer un événement". Le formulaire s\'ouvre avec vos informations de club déjà pré-remplies. Ajoutez la date et validez — le match est publié et vos joueurs sont notifiés.',
    emoji:       '➕',
    clickTarget: 'fab-event',
    clickLabel:  '"Créer un événement" dans le menu',
    tryItAction: 'event-created',
    tryItLabel:  'Créer l\'événement',
    why:         'Les événements publiés à l\'avance ont 2× plus de participants.',
  },

  // ── Affiche + Convocations ────────────────────────────────────────────────
  {
    id:    5,
    title: 'Match publié — et ensuite ?',
    body:  'Le match est en ligne et vos joueurs sont notifiés. Depuis cet écran, appuyez sur "Générer l\'affiche" pour créer visuels Instagram/Story, ou passez directement à la convocation. Appuyez sur "Suivant" pour continuer.',
    emoji: '✅',
    tip:   'L\'affiche est générée entièrement sur votre téléphone, sans compte supplémentaire. Formats Instagram, Story et Print inclus.',
  },
  {
    id:          6,
    title:       'Convoquez votre équipe en 3 taps',
    body:        'Sur l\'onglet Agenda, appuyez sur "Créer la convocation" sur la carte match. Sélectionnez vos joueurs, validez. Chaque joueur reçoit une notification push instantanément.',
    emoji:       '📋',
    clickTarget: 'convocation-btn',
    clickLabel:  'Bouton convocation sur la carte match (onglet Agenda)',
    tryItAction: 'convocation-sent',
    tryItLabel:  'Créer la convocation',
    onTab:       'Agenda',
    closeOverlayBefore: true,
    why:         '89 % de taux de réponse vs 60 % par WhatsApp.',
  },
  {
    id:          7,
    title:       'Composez votre équipe à l\'avance',
    body:        'Dès qu\'un joueur répond, la carte match se met à jour : présents, absents, en attente. Appuyez sur la carte pour voir l\'état complet de votre effectif et composer tactiquement 48 h avant le match.',
    emoji:       '✅',
    clickTarget: 'coach-match-card',
    clickLabel:  'Carte match pour voir les réponses',
    closeOverlayBefore: true,
    why:         'Connaître son effectif à l\'avance améliore la préparation tactique.',
  },
  {
    id:          8,
    title:       'Le covoiturage s\'organise tout seul',
    body:        'En répondant à la convocation, vos joueurs indiquent s\'ils conduisent ou cherchent une place. Appuyez sur la carte de covoiturage pour voir les trajets disponibles. Zéro message WhatsApp.',
    emoji:       '🚗',
    clickTarget: 'carpool-card',
    clickLabel:  'Carte de covoiturage (défilez vers le bas si besoin)',
    closeOverlayBefore: true,
    why:         'Le covoiturage intégré réduit les retards et renforce la cohésion d\'équipe.',
  },

  // ── Dimanche : Le match ───────────────────────────────────────────────────
  {
    id:          9,
    title:       'Saisissez le score en direct',
    body:        'Pendant le match, appuyez sur le pupitre de score visible à l\'écran. Mettez à jour but après but. Supporters et président voient le résultat s\'actualiser en temps réel.',
    emoji:       '🔴',
    clickTarget: 'live-score-pupitre',
    clickLabel:  'Pupitre de score live',
    why:         'Le score en direct augmente l\'engagement des supporters de 3×.',
  },
  {
    id:          10,
    title:       'Tous vos matchs simultanément',
    body:        'Appuyez sur la section Multiplex pour voir l\'Équipe 1, la Réserve, l\'U17 et les Féminines simultanément. Scores mis à jour en direct sans rafraîchir. Vous suivez tout le club depuis le terrain.',
    emoji:       '📡',
    clickTarget: 'live-multiplex',
    clickLabel:  'Section Multiplex des scores live',
    why:         'Pilotez plusieurs équipes en même temps, depuis n\'importe où.',
  },

  // ── Bilan d'après-match ───────────────────────────────────────────────────
  {
    id:          11,
    title:       'Envoyez le bilan à votre équipe',
    body:        'Le match est terminé. Appuyez sur + en bas au centre. Le menu d\'actions s\'ouvre. Vous allez envoyer votre briefing d\'après-match : bilan, félicitations, consignes pour la semaine.',
    emoji:       '➕',
    clickTarget: 'fab-add',
    clickLabel:  'Bouton + au centre de la barre en bas',
    closeOverlayBefore: true,
  },
  {
    id:          12,
    title:       'Rédigez et envoyez',
    body:        'Tapez sur "Envoyer une annonce". Rédigez votre bilan ou vos consignes, choisissez les destinataires et envoyez. Chaque joueur reçoit une notification push.',
    emoji:       '📣',
    clickTarget: 'fab-announce',
    clickLabel:  '"Envoyer une annonce" dans le menu',
    tryItAction: 'announcement-sent',
    tryItLabel:  'Envoyer le message',
    why:         'La communication régulière renforce la cohésion et l\'engagement des joueurs.',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    id:    13,
    title: 'Gérez votre équipe comme un pro',
    body:  'Entraînements, convocations, covoiturage, scores live, communication — tout en un. Créez votre espace coach gratuitement en 2 minutes.',
    emoji: '⚽',
    isCTA: true,
  },
];
