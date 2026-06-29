// Tour Communication — 9 étapes
// Annonce → Affiche → Multiplex → Vitrine club → Abonnement → CTA

export const communicationTour = [
  {
    id:    1,
    title: 'Votre atelier communication',
    body:  'Vous êtes sur l\'accueil : fil d\'actualité du club, scores en direct, annonces récentes. C\'est aussi depuis ici que vous publiez. Faites défiler pour voir tout ce que SportLink affiche automatiquement.',
    emoji: '📣',
    tip:   'Le guide reste visible. Réduisez-le (▼) pour naviguer librement, agrandissez-le (▲) pour le relire.',
    why:   'Les clubs avec une communication régulière ont 3× plus d\'engagement en ligne.',
  },
  {
    id:          2,
    title:       'Ouvrez le menu d\'actions',
    body:        'Appuyez sur le bouton + au centre de la barre en bas. Le menu d\'actions s\'ouvre avec toutes les options de publication disponibles.',
    emoji:       '➕',
    clickTarget: 'fab-add',
    clickLabel:  'Bouton + au centre de la barre en bas',
  },
  {
    id:          3,
    title:       'Publiez une annonce percutante',
    body:        'Tapez sur "Envoyer une annonce". Choisissez le type (résultat, info, urgence), rédigez votre message et envoyez. 85 % de taux d\'ouverture sur push vs 20 % par email.',
    emoji:       '📢',
    clickTarget: 'fab-announce',
    clickLabel:  '"Envoyer une annonce" dans le menu',
    tryItAction: 'announcement-sent',
    tryItLabel:  'Publier l\'annonce',
    why:         'Les annonces push ont 85 % de taux d\'ouverture vs 20 % pour les emails.',
  },

  // ── Studio d'affiches ─────────────────────────────────────────────────────
  {
    id:          4,
    title:       'Créez des affiches pro en 30 secondes',
    body:        'Appuyez sur le bandeau Studio d\'affiches. 37 templates, logos de votre club, couleurs personnalisées. Formats Story, Post et Paysage. Publiez directement sur Instagram depuis l\'app.',
    emoji:       '🎨',
    clickTarget: 'poster-feature-strip',
    clickLabel:  'Bandeau Studio d\'affiches (faites défiler si besoin)',
    tryItAction: 'poster-opened',
    tryItLabel:  'Ouvrir le Studio',
    closeOverlayBefore: true,
    why:         'Les clubs qui publient des affiches de match ont 2× plus d\'engagement Instagram.',
  },

  // ── Multiplex en direct ───────────────────────────────────────────────────
  {
    id:          5,
    title:       'Suivez tous vos matchs en direct',
    body:        'Appuyez sur la section Multiplex pour voir les scores de toutes vos équipes simultanément. Les supporters reçoivent les mises à jour en temps réel — plus besoin de WhatsApp.',
    emoji:       '📡',
    clickTarget: 'live-multiplex',
    clickLabel:  'Section Multiplex des scores live',
    closeOverlayBefore: true,
    why:         'Le multiplex en direct multiplie par 3 le temps passé sur la page du club.',
  },

  // ── Vitrine club ──────────────────────────────────────────────────────────
  {
    id:          6,
    title:       'Découvrez votre vitrine publique',
    body:        'Appuyez sur l\'onglet "Clubs" en bas à droite. C\'est la page que vos supporters, partenaires et futurs membres découvrent. Agenda, résultats, sponsors — sans aucune compétence web.',
    emoji:       '🌐',
    clickTarget: 'tab-clubs',
    clickLabel:  'Onglet "Clubs" en bas à droite',
    closeOverlayBefore: true,
    why:         'Une page club soignée augmente les abonnements spontanés de 60 %.',
  },
  {
    id:          7,
    title:       'Abonnez-vous pour tester le flux',
    body:        'Appuyez sur un club dans la liste pour ouvrir sa page. Puis appuyez sur "Suivre" — vos fans reçoivent ensuite chaque annonce, résultat et actualité en notification push.',
    emoji:       '🔔',
    clickTarget: 'follow-club-btn',
    clickLabel:  'Bouton "Suivre" sur la page du club (ouvrez d\'abord un club de la liste)',
    tryItAction: 'club-followed',
    tryItLabel:  'Suivre le club',
    why:         'Les abonnés sont 3× plus fidèles et plus engagés que les non-abonnés.',
  },
  {
    id:    8,
    title: 'Transformez la communication de votre club',
    body:  'Annonces push, affiches pro, scores en direct, page club — tout en un. Créez votre espace communication gratuitement en 2 minutes.',
    emoji: '📣',
    isCTA: true,
  },
];
