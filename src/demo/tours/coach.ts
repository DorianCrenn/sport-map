// Tour Coach — 9 étapes — Workflow "Jour de match"
// Ligne de vie : Vendredi (convoquer → réponses → covoiturage)
//              → Dimanche (score → multiplex)
//              → Après-match (briefing annonce)
//              → CTA

export const coachTour = [
  {
    id:    1,
    title: 'Votre cockpit coach',
    body:  'Vous êtes sur l\'écran principal. En haut : la séance d\'entraînement de ce soir. Dessous : la carte match avec l\'état des convocations, les scores live et le fil du club. Tout sans ouvrir 4 applications.',
    emoji: '🎯',
    tip:   'Le guide reste visible. Réduisez-le (▼) pour naviguer librement, agrandissez-le (▲) pour le relire.',
    why:   'Les coachs SportLink passent 70% moins de temps sur la logistique.',
  },

  // ── Vendredi soir — Préparer le match ────────────────────────────────────
  {
    id:          2,
    title:       'Convoyez votre équipe en 3 taps',
    body:        'Il est vendredi soir. Sur l\'onglet Agenda, appuyez sur "Créer la convocation" sur la carte match. Sélectionnez vos joueurs, validez. Chaque joueur reçoit une notification push instantanément.',
    emoji:       '📋',
    clickTarget: 'convocation-btn',
    clickLabel:  'Bouton convocation sur la carte match (onglet Agenda)',
    onTab:       'Agenda',
    closeOverlayBefore: true,
    why:         '89% de taux de réponse vs 60% par WhatsApp.',
  },
  {
    id:          3,
    title:       'Composez votre équipe à l\'avance',
    body:        'Dès qu\'un joueur répond, la carte match se met à jour : présents, absents, en attente. Appuyez sur la carte pour voir l\'état complet de votre effectif et composer tactiquement 48h avant le match.',
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
    why:         'Le covoiturage intégré réduit les retards et renforce la cohésion d\'équipe.',
  },

  // ── Dimanche — Le match ───────────────────────────────────────────────────
  {
    id:          5,
    title:       'Saisissez le score en direct',
    body:        'Pendant le match, appuyez sur le pupitre de score visible à l\'écran. Mettez à jour but après but. Supporters et président voient le résultat s\'actualiser en temps réel.',
    emoji:       '🔴',
    clickTarget: 'live-score-pupitre',
    clickLabel:  'Pupitre de score live',
    why:         'Le score en direct augmente l\'engagement des supporters de 3×.',
  },
  {
    id:          6,
    title:       'Tous vos matchs simultanément',
    body:        'Appuyez sur la section Multiplex pour voir l\'Équipe 1, la Réserve, l\'U17 et les Féminines simultanément. Scores mis à jour en direct sans rafraîchir. Vous suivez tout le club depuis le terrain.',
    emoji:       '📡',
    clickTarget: 'live-multiplex',
    clickLabel:  'Section Multiplex des scores live',
    why:         'Pilotez plusieurs équipes en même temps, depuis n\'importe où.',
  },

  // ── Après-match — Briefing ────────────────────────────────────────────────
  {
    id:          7,
    title:       'Envoyez le bilan à votre équipe',
    body:        'Le match est terminé. Appuyez sur + en bas au centre. Le menu d\'actions s\'ouvre. Vous allez envoyer votre briefing d\'après-match : bilan, félicitations, consignes pour la semaine.',
    emoji:       '➕',
    clickTarget: 'fab-add',
    clickLabel:  'Bouton + au centre de la barre en bas',
    closeOverlayBefore: true,
  },
  {
    id:          8,
    title:       'Rédigez et envoyez',
    body:        'Tapez sur "Envoyer une annonce". La page Mon Club s\'ouvre avec le formulaire. Rédigez votre bilan ou vos consignes, choisissez les destinataires et envoyez. Chaque joueur reçoit une notification push.',
    emoji:       '📣',
    clickTarget: 'fab-announce',
    clickLabel:  '"Envoyer une annonce" dans le menu',
    tryItAction: 'announcement-sent',
    tryItLabel:  'Envoyer le message',
    why:         'La communication régulière renforce la cohésion et l\'engagement des joueurs.',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    id:    9,
    title: 'Gérez votre équipe comme un pro',
    body:  'Convocations, covoiturage, scores live, communication — tout en un. Créez votre espace coach gratuitement en 2 minutes.',
    emoji: '⚽',
    isCTA: true,
  },
];
