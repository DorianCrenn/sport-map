// Tour Supporter — 8 étapes
// Multiplex → Carte géo → Clubs → Abonnement → Accueil → Favoris → CTA

export const supporterTour = [
  // ── 1 : Intro ────────────────────────────────────────────────────────────
  {
    id:    1,
    title: 'L\'actu de votre club en temps réel',
    body:  'Vous êtes sur l\'écran principal. Résultats, annonces, scores en direct — tout le club sans chercher sur 5 réseaux différents. Le fil se met à jour automatiquement.',
    emoji: '🏟️',
    tip:   'Le guide reste visible. Réduisez-le (▼) pour naviguer librement, agrandissez-le (▲) pour le relire.',
    why:   'Les supporters SportLink sont informés 3× plus vite que les non-abonnés.',
  },

  // ── Multiplex ─────────────────────────────────────────────────────────────
  {
    id:          2,
    title:       'Scores en direct de toutes les équipes',
    body:        'Appuyez sur la section Multiplex ici sur l\'écran. Vous voyez l\'Équipe 1, la Réserve, l\'U17 et les Féminines simultanément. Mis à jour en direct, sans rafraîchir la page.',
    emoji:       '📡',
    clickTarget: 'live-multiplex',
    clickLabel:  'Section Multiplex des scores live',
    why:         'Restez connecté à 100% de votre club, même si vous ne pouvez pas vous déplacer.',
  },

  // ── Carte géo ─────────────────────────────────────────────────────────────
  {
    id:          3,
    title:       'Trouvez les événements autour de vous',
    body:        'Appuyez sur l\'onglet Carte en bas. Tous les matchs, tournois et événements sportifs de votre région s\'affichent sur la carte, géolocalisés en temps réel. Filtrez par sport, date ou distance.',
    emoji:       '📍',
    clickTarget: 'tab-map',
    clickLabel:  'Onglet Carte en bas de l\'écran',
    why:         'Les supporters qui utilisent la carte assistent à 3× plus d\'événements locaux.',
  },

  // ── Vitrine club ──────────────────────────────────────────────────────────
  {
    id:          4,
    title:       'Découvrez la page du club',
    body:        'Appuyez sur l\'onglet "Clubs" en bas à droite. Vous accédez à la vitrine complète du club : agenda, résultats de toutes les équipes, effectif, sponsors.',
    emoji:       '💙',
    clickTarget: 'tab-clubs',
    clickLabel:  'Onglet "Clubs" en bas à droite',
    closeOverlayBefore: true,
  },
  {
    id:          5,
    title:       'Abonnez-vous pour ne rien rater',
    body:        'Appuyez sur un club dans la liste pour ouvrir sa page. Puis appuyez sur "Suivre". Un seul tap et vous recevrez chaque résultat, annonce et actualité en notification push.',
    emoji:       '🔔',
    clickTarget: 'follow-club-btn',
    clickLabel:  'Bouton "Suivre" sur la page du club (ouvrez d\'abord un club de la liste)',
    tryItAction: 'club-followed',
    tryItLabel:  'Suivre le club',
    why:         'Les supporters abonnés assistent à 2× plus de matchs que les non-abonnés.',
  },

  // ── Favoris ───────────────────────────────────────────────────────────────
  {
    id:          6,
    title:       'Revenez sur le fil d\'actualité',
    body:        'Appuyez sur l\'onglet "Accueil" en bas à gauche pour retrouver le fil avec les prochains matchs à sauvegarder.',
    emoji:       '🏠',
    clickTarget: 'tab-home',
    clickLabel:  'Onglet "Accueil" en bas à gauche',
    closeOverlayBefore: true,
  },
  {
    id:          7,
    title:       'Sauvegardez les matchs à ne pas rater',
    body:        'Appuyez sur l\'étoile ⭐ sur une carte match pour le sauvegarder. Vous recevrez un rappel automatique la veille et le jour J — plus jamais de match raté.',
    emoji:       '⭐',
    clickTarget: 'favorite-btn',
    clickLabel:  'Étoile ⭐ sur une carte match',
    tryItAction: 'event-favorited',
    tryItLabel:  'Sauvegarder le match',
    why:         'Les supporters qui sauvegardent les matchs y assistent 2× plus souvent.',
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    id:    8,
    title: 'Rejoignez SportLink',
    body:  'Carte des événements, scores en direct, annonces push, matchs sauvegardés — tout gratuitement en 30 secondes.',
    emoji: '🏟️',
    isCTA: true,
  },
];
