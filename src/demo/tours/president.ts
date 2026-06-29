// Tour Président — 13 étapes
// Planifier → Convoquer → Covoiturage → Match live (score + multiplex)
// → Affiche résultat → Vitrine club → Bilan annonce → CTA

export const presidentTour = [
  // ── 1 : Intro ────────────────────────────────────────────────────────────
  {
    id:    1,
    title: 'Votre cockpit de président',
    body:  'Bienvenue sur l\'écran principal. En haut : les convocations à venir. Dessous : les scores en direct, les annonces et le fil du club. Tout sans ouvrir 4 applications.',
    emoji: '👑',
    tip:   'Le guide reste visible. Réduisez-le (▼) pour naviguer librement, agrandissez-le (▲) pour le relire.',
    why:   'Un seul écran pour piloter un club en temps réel.',
  },

  // ── Vendredi : Planifier le match ─────────────────────────────────────────
  {
    id:          2,
    title:       'Planifiez votre prochain match',
    body:        'C\'est vendredi. Le prochain match se dispute samedi. Appuyez sur le bouton + au centre de la barre en bas pour ouvrir le menu d\'actions.',
    emoji:       '📅',
    clickTarget: 'fab-add',
    clickLabel:  'Bouton + au centre de la barre en bas',
    closeOverlayBefore: true,
  },
  {
    id:          3,
    title:       'Créez l\'événement en quelques secondes',
    body:        'Tapez sur "Créer un événement". Le formulaire s\'ouvre avec vos informations de club déjà pré-remplies. Ajoutez la date et validez — l\'événement est publié instantanément à vos 342 abonnés.',
    emoji:       '➕',
    clickTarget: 'fab-event',
    clickLabel:  '"Créer un événement" dans le menu',
    tryItAction: 'event-created',
    tryItLabel:  'Créer l\'événement',
    why:         'Les clubs qui publient leurs événements à l\'avance ont 2× plus d\'affluence.',
  },

  // ── Convoquer ─────────────────────────────────────────────────────────────
  {
    id:          4,
    title:       'Convoquez en un tap depuis la popup',
    body:        'Votre match est en ligne ! La popup vous propose deux actions immédiates : envoyer les convocations ou créer l\'affiche avant-match. Appuyez sur "Convoquer" — chaque joueur reçoit une notification push instantanément.',
    emoji:       '📋',
    clickTarget: 'convocation-popup-btn',
    clickLabel:  '"Convoquer" dans la popup de succès',
    tryItAction: 'convocation-sent',
    tryItLabel:  'Convoquer les joueurs',
    why:         '89 % de taux de réponse aux convocations vs 60 % par WhatsApp.',
  },
  {
    id:          5,
    title:       'Les réponses arrivent en direct',
    body:        'Dès qu\'un joueur répond, la carte match se met à jour. Appuyez dessus pour voir l\'état complet de votre effectif : présents, absents, en attente. Composez tactiquement 48 h à l\'avance.',
    emoji:       '✅',
    clickTarget: 'coach-match-card',
    clickLabel:  'Carte match pour voir les réponses',
    closeOverlayBefore: true,
    why:         'Connaître son effectif à l\'avance améliore la préparation tactique.',
  },
  {
    id:          6,
    title:       'Le covoiturage s\'organise tout seul',
    body:        'En répondant à la convocation, vos joueurs indiquent s\'ils conduisent ou cherchent une place. Appuyez sur la carte de covoiturage pour voir les trajets disponibles. Zéro message WhatsApp.',
    emoji:       '🚗',
    clickTarget: 'carpool-card',
    clickLabel:  'Carte de covoiturage (défilez vers le bas si besoin)',
    closeOverlayBefore: true,
    why:         'Le covoiturage intégré réduit les retards de 35 % et renforce la cohésion d\'équipe.',
  },

  // ── Dimanche : Le match en direct ─────────────────────────────────────────
  {
    id:          7,
    title:       'Saisissez le score en direct',
    body:        'C\'est dimanche, le match commence. Appuyez sur le pupitre de score visible à l\'écran. Mettez à jour but après but. Supporters et familles voient le résultat s\'actualiser en temps réel.',
    emoji:       '🔴',
    clickTarget: 'live-score-pupitre',
    clickLabel:  'Pupitre de score live',
    why:         'Le score en direct augmente l\'engagement des supporters de 3×.',
  },
  {
    id:          8,
    title:       'Toutes vos équipes simultanément',
    body:        'Pendant que l\'Équipe 1 joue, la Réserve et l\'U17 jouent aussi. Appuyez sur la section Multiplex pour voir tous vos matchs en temps réel sur un seul écran. Sans rafraîchir.',
    emoji:       '📡',
    clickTarget: 'live-multiplex',
    clickLabel:  'Section Multiplex des scores live',
    why:         'Pilotez plusieurs équipes en même temps, depuis n\'importe où.',
  },

  // ── Affiche résultat ──────────────────────────────────────────────────────
  {
    id:          9,
    title:       'Créez l\'affiche du score final',
    body:        'Le match est terminé. Appuyez sur le bandeau Studio d\'affiches pour créer l\'affiche résultat en 30 secondes. 37 templates, le score intégré, format Story et Post prêts pour Instagram.',
    emoji:       '🎨',
    clickTarget: 'poster-feature-strip',
    clickLabel:  'Bandeau Studio d\'affiches (faites défiler si besoin)',
    tryItAction: 'poster-opened',
    tryItLabel:  'Ouvrir le Studio',
    closeOverlayBefore: true,
    why:         'Les clubs qui partagent leurs résultats en affiche ont 2× plus d\'abonnés Instagram.',
  },

  // ── Vitrine club ──────────────────────────────────────────────────────────
  {
    id:          10,
    title:       'Votre vitrine publique',
    body:        'Appuyez sur l\'onglet Clubs en bas. Vous verrez la page que vos 342 abonnés, supporters et futurs membres découvrent : agenda complet, résultats, effectif, sponsors — sans aucune compétence web.',
    emoji:       '🌐',
    clickTarget: 'tab-clubs',
    clickLabel:  'Onglet Clubs en bas à droite',
    closeOverlayBefore: true,
    why:         'Une page club soignée augmente les abonnements spontanés de 60 %.',
  },

  // ── Après-match : Bilan ───────────────────────────────────────────────────
  {
    id:          11,
    title:       'Partagez le bilan avec vos supporters',
    body:        'Appuyez sur + en bas au centre pour envoyer le bilan à vos abonnés. 85 % de taux d\'ouverture — vs 20 % pour un email.',
    emoji:       '➕',
    clickTarget: 'fab-add',
    clickLabel:  'Bouton + au centre de la barre en bas',
    closeOverlayBefore: true,
  },
  {
    id:          12,
    title:       'Rédigez et envoyez l\'annonce',
    body:        'Tapez sur "Envoyer une annonce". Choisissez le type (résultat, info, urgence), rédigez votre message et envoyez. L\'annonce arrive instantanément sur le téléphone de chaque abonné.',
    emoji:       '📢',
    clickTarget: 'fab-announce',
    clickLabel:  '"Envoyer une annonce" dans le menu',
    tryItAction: 'announcement-sent',
    tryItLabel:  'Envoyer l\'annonce',
    why:         'Les annonces push ont un taux d\'ouverture de 85 % vs 20 % pour les emails.',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    id:    13,
    title: 'Prêt à créer votre club ?',
    body:  'Planification, convocations, covoiturage, scores en direct, affiches pro, vitrine club, communication — tout en un. Créez votre club gratuitement en 2 minutes et commencez à fédérer votre communauté !',
    emoji: '🚀',
    isCTA: true,
  },
];
