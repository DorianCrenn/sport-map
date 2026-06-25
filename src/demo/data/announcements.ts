import { DEMO_CLUB_ID, DEMO_USER_ID } from './club.js';

function past(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const demoAnnouncements = [
  // â”€â”€ Résultats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-001', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'ðŸ† Victoire 3-1 face Ã  SC Quimper Brest !',
    message: 'Super prestation collective ce samedi ! Une victoire méritée 3-1 qui nous maintient dans le top 5 du championnat. Bravo Ã  tous les joueurs et au staff. Lucas Morel nommé Homme du Match. Prochaine étape : la Coupe !',
    target_teams: [], scheduled_for: null, created_at: past(7, 18),
  },
  {
    id: 'demo-ann-008', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'âœ… U17 : Victoire 4-1 vs ES Lesneven â€” Bravo les jeunes !',
    message: 'Belle perf des U17 ce weekend ! 4-1 face Ã  ES Lesneven avec un hat-trick de Noa Kerguelen. L\'équipe confirme sa progression. RDV samedi prochain pour le Tournoi de la Pentecôte !',
    target_teams: ['U17'], scheduled_for: null, created_at: past(12, 17),
  },
  {
    id: 'demo-ann-009', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'âš½ Féminines : 2-1 contre Brest Sport F â€” Match intense !',
    message: 'Les Féminines s\'imposent 2-1 dans un match très disputé. Jade Berthou nommée Joueuse du Match avec son doublé. Le groupe monte en puissance. Prochain match vendredi soir.',
    target_teams: ['Équipe F'], scheduled_for: null, created_at: past(8, 19),
  },
  {
    id: 'demo-ann-010', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'ðŸ¥‡ Qualification Coupe ! On est en demi-finale !',
    message: 'Victoire 2-0 contre AS Landerneau en quart de finale ! On est qualifiés pour les demi-finales de la Coupe Bretagne. Tirage au sort vendredi. Restez connectés !',
    target_teams: [], scheduled_for: null, created_at: past(14, 20),
  },

  // â”€â”€ Urgences / Convocations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-002', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'urgent', title: 'ðŸ“‹ Convocation â€” Match vs AS Plougastel (samedi)',
    message: 'Tous les joueurs convoqués pour le match de championnat contre AS Plougastel. Rendez-vous samedi Ã  13h30 au vestiaire. Tenue : maillot domicile. Répondez Ã  cette convocation dès que possible.',
    target_teams: ['Équipe 1'], scheduled_for: null, created_at: past(2, 9),
  },
  {
    id: 'demo-ann-011', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'urgent', title: 'ðŸš¨ URGENT : Annulation entraînement jeudi â€” terrain indisponible',
    message: "L'entraînement de jeudi soir est annulé suite Ã  une indisponibilité du terrain suite aux intempéries. Le prochain entraînement aura lieu mardi Ã  18h30. Désolé pour la gêne occasionnée.",
    target_teams: ['Équipe 1', 'Réserve'], scheduled_for: null, created_at: past(3, 16),
  },
  {
    id: 'demo-ann-012', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'urgent', title: 'ðŸ“ Changement de terrain â€” Match Réserve samedi',
    message: "Suite Ã  une réservation conflictuelle, le match de la Réserve samedi se jouera au Terrain de Kergoat et non au terrain habituel. Même horaire : 14h00. Merci de bien noter l'adresse : Rue de Kergoat, Brest.",
    target_teams: ['Réserve'], scheduled_for: null, created_at: past(4, 11),
  },

  // â”€â”€ Infos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-003', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ• Nouvel horaire : entraînement seniors avancé Ã  18h30',
    message: "À partir de la semaine prochaine, l'entraînement des seniors est avancé Ã  18h30 (au lieu de 19h00). Ce changement est définitif pour la fin de la saison. Merci de votre compréhension.",
    target_teams: ['Équipe 1', 'Réserve'], scheduled_for: null, created_at: past(5, 14),
  },
  {
    id: 'demo-ann-013', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ‘• Commande de maillots â€” Délai 3 semaines',
    message: "La commande de maillots de fin de saison est en cours. Délai de livraison estimé : 3 semaines. Si vous n'avez pas encore confirmé votre taille, faites-le avant vendredi soir via le formulaire partagé.",
    target_teams: [], scheduled_for: null, created_at: past(9, 10),
  },
  {
    id: 'demo-ann-014', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ’³ Cotisations 2026-2027 â€” Ouverture des réinscriptions',
    message: "Les réinscriptions pour la saison 2026-2027 sont ouvertes ! Tarif identique Ã  la saison précédente. Règlement par virement ou espèces au trésorier. Profitez-en pour mettre Ã  jour vos informations médicales.",
    target_teams: [], scheduled_for: null, created_at: past(16, 9),
  },

  // â”€â”€ Événements / Activités â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-004', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'event', title: 'ðŸŽ‰ Tournoi de la Pentecôte â€” Inscription ouverte',
    message: 'Le FC SportLink Démo organise son Tournoi de la Pentecôte ! 8 équipes U17 s\'affrontent dans un esprit festif. Inscriptions ouvertes jusqu\'au 20 juin. Restauration sur place assurée par notre équipe de bénévoles.',
    target_teams: [], scheduled_for: null, created_at: past(6, 11),
  },
  {
    id: 'demo-ann-005', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'ðŸ… Qualification pour les demi-finales de Coupe !',
    message: 'Victoire 2-0 contre AS Landerneau en quart de finale ! On est en demi ! Le tirage au sort a lieu vendredi. Restez connectés pour connaître notre adversaire. Continuez Ã  nous soutenir !',
    target_teams: [], scheduled_for: null, created_at: past(14, 20),
  },
  {
    id: 'demo-ann-015', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'event', title: 'ðŸŽŠ Fête de fin de saison â€” 5 juillet Ã  partir de 18h !',
    message: 'Grande fête de fin de saison le 5 juillet au club ! Barbecue, animations, remise des récompenses et bonne humeur garantie. Entrée libre, venez nombreux avec vos familles. Inscription souhaitée pour prévoir le repas.',
    target_teams: [], scheduled_for: null, created_at: past(11, 14),
  },

  // â”€â”€ Bénévoles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-006', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ¥ Buvette ouverte â€” Bénévoles recherchés',
    message: 'La buvette sera ouverte lors du prochain match Ã  domicile vs AS Plougastel. Nous recherchons 3 bénévoles pour tenir la buvette. Si vous êtes disponible de 14h Ã  17h, contactez-nous par email. Merci d\'avance !',
    target_teams: [], scheduled_for: null, created_at: past(1, 16),
  },

  // â”€â”€ Entraînements & Préparation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-016', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ“Š Bilan séance mardi â€” Bonne intensité collective',
    message: 'Excellente séance mardi soir avec 18 présents sur 22 convoqués. Points forts : pressing haut très bien exécuté, transitions rapides en contre. Travail Ã  poursuivre : les phases arrêtées offensives. On sera prêts pour samedi !',
    target_teams: ['Équipe 1'], scheduled_for: null, created_at: past(2, 21),
  },
  {
    id: 'demo-ann-017', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'urgent', title: 'ðŸ¥ Blessure Mathieu Dourdain â€” Forfait 3 semaines',
    message: 'Suite Ã  une entorse Ã  la cheville lors du dernier entraînement, Mathieu Dourdain est indisponible pour environ 3 semaines. Bon rétablissement Mathieu ! Son remplaçant sera désigné lors de la prochaine séance.',
    target_teams: ['Équipe 1'], scheduled_for: null, created_at: past(3, 10),
  },
  {
    id: 'demo-ann-018', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸŽ¯ Séance vidéo jeudi â€” Analyse tactique pré-match',
    message: 'Comme annoncé, séance vidéo d\'analyse tactique jeudi Ã  20h dans la salle du club. Présence recommandée pour tous les joueurs convoqués vs AS Plougastel. Durée : environ 45 minutes. Le staff présentera les points clés de l\'adversaire.',
    target_teams: ['Équipe 1'], scheduled_for: null, created_at: past(1, 14),
  },

  // â”€â”€ IA & Communication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-019', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'event', title: 'ðŸ“¸ Photos du match disponibles â€” Album partagé',
    message: 'Les photos du match vs SC Quimper Brest sont disponibles dans l\'album partagé ! 87 photos au total par notre photographe bénévole Sylvain. Merci Ã  lui pour ce superbe travail. Partagez avec vos familles !',
    target_teams: [], scheduled_for: null, created_at: past(6, 12),
  },
  {
    id: 'demo-ann-020', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ† Classement J27 â€” On reste dans le Top 5 !',
    message: '5ème place au championnat après la journée 27 avec 44 points. 4 matchs Ã  jouer dont 2 Ã  domicile. L\'objectif d\'une place européenne en 3ème division reste accessible. Chaque point compte â€” restez mobilisés !',
    target_teams: [], scheduled_for: null, created_at: past(7, 20),
  },
  {
    id: 'demo-ann-021', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ‘• Nouveau partenariat â€” Auto Brest Center équipe notre staff',
    message: 'Bienvenue Ã  Auto Brest Center comme nouveau partenaire Silver du club ! Ils équiperont notre staff technique en tenues officielles pour la saison 2026-2027. Un grand merci pour leur soutien. Retrouvez-les sur le panneau publicitaire bord terrain.',
    target_teams: [], scheduled_for: null, created_at: past(18, 9),
  },

  // â”€â”€ U17 & Féminines â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-022', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'âš½ U17 : Noa Kerguelen â€” Hat-trick historique !',
    message: 'Noa Kerguelen a inscrit un triplé lors de la victoire 4-1 contre ES Lesneven. À 16 ans, il devient le plus jeune joueur Ã  réussir un hat-trick sous le maillot du FC SportLink. Un talent Ã  suivre de près ! ðŸŒŸ',
    target_teams: ['U17'], scheduled_for: null, created_at: past(12, 19),
  },
  {
    id: 'demo-ann-023', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸŒŸ Détection régionale â€” 3 U17 sélectionnés',
    message: 'Félicitations Ã  Noa Kerguelen, Mathis Keriven et Théo Tanguy, sélectionnés pour les stages de détection régionale Bretagne U17 ! Une belle reconnaissance du travail effectué. Le club est très fier de vous.',
    target_teams: ['U17'], scheduled_for: null, created_at: past(20, 11),
  },
  {
    id: 'demo-ann-024', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'event', title: 'ðŸ‘§ Féminines : Journée portes ouvertes U11 et U13 F',
    message: 'Le FC SportLink ouvre ses portes aux filles de 8 Ã  13 ans ! Journée portes ouvertes samedi prochain de 10h Ã  12h. Venez découvrir le football féminin dans une ambiance conviviale. Aucun équipement requis, juste envie de s\'amuser.',
    target_teams: ['Équipe F'], scheduled_for: null, created_at: past(4, 15),
  },
];

