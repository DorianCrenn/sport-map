import { DEMO_CLUB_ID, DEMO_USER_ID } from './club.js';

function past(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const demoAnnouncements = [
  // â”€â”€ RÃ©sultats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-001', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'ðŸ† Victoire 3-1 face Ã  SC Quimper Brest !',
    message: 'Super prestation collective ce samedi ! Une victoire mÃ©ritÃ©e 3-1 qui nous maintient dans le top 5 du championnat. Bravo Ã  tous les joueurs et au staff. Lucas Morel nommÃ© Homme du Match. Prochaine Ã©tape : la Coupe !',
    target_teams: [], scheduled_for: null, created_at: past(7, 18),
  },
  {
    id: 'demo-ann-008', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'âœ… U17 : Victoire 4-1 vs ES Lesneven â€” Bravo les jeunes !',
    message: 'Belle perf des U17 ce weekend ! 4-1 face Ã  ES Lesneven avec un hat-trick de Noa Kerguelen. L\'Ã©quipe confirme sa progression. RDV samedi prochain pour le Tournoi de la PentecÃ´te !',
    target_teams: ['U17'], scheduled_for: null, created_at: past(12, 17),
  },
  {
    id: 'demo-ann-009', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'âš½ FÃ©minines : 2-1 contre Brest Sport F â€” Match intense !',
    message: 'Les FÃ©minines s\'imposent 2-1 dans un match trÃ¨s disputÃ©. Jade Berthou nommÃ©e Joueuse du Match avec son doublÃ©. Le groupe monte en puissance. Prochain match vendredi soir.',
    target_teams: ['Ã‰quipe F'], scheduled_for: null, created_at: past(8, 19),
  },
  {
    id: 'demo-ann-010', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'ðŸ¥‡ Qualification Coupe ! On est en demi-finale !',
    message: 'Victoire 2-0 contre AS Landerneau en quart de finale ! On est qualifiÃ©s pour les demi-finales de la Coupe Bretagne. Tirage au sort vendredi. Restez connectÃ©s !',
    target_teams: [], scheduled_for: null, created_at: past(14, 20),
  },

  // â”€â”€ Urgences / Convocations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-002', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'urgent', title: 'ðŸ“‹ Convocation â€” Match vs AS Plougastel (samedi)',
    message: 'Tous les joueurs convoquÃ©s pour le match de championnat contre AS Plougastel. Rendez-vous samedi Ã  13h30 au vestiaire. Tenue : maillot domicile. RÃ©pondez Ã  cette convocation dÃ¨s que possible.',
    target_teams: ['Ã‰quipe 1'], scheduled_for: null, created_at: past(2, 9),
  },
  {
    id: 'demo-ann-011', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'urgent', title: 'ðŸš¨ URGENT : Annulation entraÃ®nement jeudi â€” terrain indisponible',
    message: "L'entraÃ®nement de jeudi soir est annulÃ© suite Ã  une indisponibilitÃ© du terrain suite aux intempÃ©ries. Le prochain entraÃ®nement aura lieu mardi Ã  18h30. DÃ©solÃ© pour la gÃªne occasionnÃ©e.",
    target_teams: ['Ã‰quipe 1', 'RÃ©serve'], scheduled_for: null, created_at: past(3, 16),
  },
  {
    id: 'demo-ann-012', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'urgent', title: 'ðŸ“ Changement de terrain â€” Match RÃ©serve samedi',
    message: "Suite Ã  une rÃ©servation conflictuelle, le match de la RÃ©serve samedi se jouera au Terrain de Kergoat et non au terrain habituel. MÃªme horaire : 14h00. Merci de bien noter l'adresse : Rue de Kergoat, Brest.",
    target_teams: ['RÃ©serve'], scheduled_for: null, created_at: past(4, 11),
  },

  // â”€â”€ Infos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-003', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ• Nouvel horaire : entraÃ®nement seniors avancÃ© Ã  18h30',
    message: "Ã€ partir de la semaine prochaine, l'entraÃ®nement des seniors est avancÃ© Ã  18h30 (au lieu de 19h00). Ce changement est dÃ©finitif pour la fin de la saison. Merci de votre comprÃ©hension.",
    target_teams: ['Ã‰quipe 1', 'RÃ©serve'], scheduled_for: null, created_at: past(5, 14),
  },
  {
    id: 'demo-ann-013', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ‘• Commande de maillots â€” DÃ©lai 3 semaines',
    message: "La commande de maillots de fin de saison est en cours. DÃ©lai de livraison estimÃ© : 3 semaines. Si vous n'avez pas encore confirmÃ© votre taille, faites-le avant vendredi soir via le formulaire partagÃ©.",
    target_teams: [], scheduled_for: null, created_at: past(9, 10),
  },
  {
    id: 'demo-ann-014', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ’³ Cotisations 2026-2027 â€” Ouverture des rÃ©inscriptions',
    message: "Les rÃ©inscriptions pour la saison 2026-2027 sont ouvertes ! Tarif identique Ã  la saison prÃ©cÃ©dente. RÃ¨glement par virement ou espÃ¨ces au trÃ©sorier. Profitez-en pour mettre Ã  jour vos informations mÃ©dicales.",
    target_teams: [], scheduled_for: null, created_at: past(16, 9),
  },

  // â”€â”€ Ã‰vÃ©nements / ActivitÃ©s â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-004', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'event', title: 'ðŸŽ‰ Tournoi de la PentecÃ´te â€” Inscription ouverte',
    message: 'Le FC SportLink DÃ©mo organise son Tournoi de la PentecÃ´te ! 8 Ã©quipes U17 s\'affrontent dans un esprit festif. Inscriptions ouvertes jusqu\'au 20 juin. Restauration sur place assurÃ©e par notre Ã©quipe de bÃ©nÃ©voles.',
    target_teams: [], scheduled_for: null, created_at: past(6, 11),
  },
  {
    id: 'demo-ann-005', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'ðŸ… Qualification pour les demi-finales de Coupe !',
    message: 'Victoire 2-0 contre AS Landerneau en quart de finale ! On est en demi ! Le tirage au sort a lieu vendredi. Restez connectÃ©s pour connaÃ®tre notre adversaire. Continuez Ã  nous soutenir !',
    target_teams: [], scheduled_for: null, created_at: past(14, 20),
  },
  {
    id: 'demo-ann-015', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'event', title: 'ðŸŽŠ FÃªte de fin de saison â€” 5 juillet Ã  partir de 18h !',
    message: 'Grande fÃªte de fin de saison le 5 juillet au club ! Barbecue, animations, remise des rÃ©compenses et bonne humeur garantie. EntrÃ©e libre, venez nombreux avec vos familles. Inscription souhaitÃ©e pour prÃ©voir le repas.',
    target_teams: [], scheduled_for: null, created_at: past(11, 14),
  },

  // â”€â”€ BÃ©nÃ©voles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-006', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ¥ Buvette ouverte â€” BÃ©nÃ©voles recherchÃ©s',
    message: 'La buvette sera ouverte lors du prochain match Ã  domicile vs AS Plougastel. Nous recherchons 3 bÃ©nÃ©voles pour tenir la buvette. Si vous Ãªtes disponible de 14h Ã  17h, contactez-nous par email. Merci d\'avance !',
    target_teams: [], scheduled_for: null, created_at: past(1, 16),
  },

  // â”€â”€ EntraÃ®nements & PrÃ©paration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-016', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ“Š Bilan sÃ©ance mardi â€” Bonne intensitÃ© collective',
    message: 'Excellente sÃ©ance mardi soir avec 18 prÃ©sents sur 22 convoquÃ©s. Points forts : pressing haut trÃ¨s bien exÃ©cutÃ©, transitions rapides en contre. Travail Ã  poursuivre : les phases arrÃªtÃ©es offensives. On sera prÃªts pour samedi !',
    target_teams: ['Ã‰quipe 1'], scheduled_for: null, created_at: past(2, 21),
  },
  {
    id: 'demo-ann-017', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'urgent', title: 'ðŸ¥ Blessure Mathieu Dourdain â€” Forfait 3 semaines',
    message: 'Suite Ã  une entorse Ã  la cheville lors du dernier entraÃ®nement, Mathieu Dourdain est indisponible pour environ 3 semaines. Bon rÃ©tablissement Mathieu ! Son remplaÃ§ant sera dÃ©signÃ© lors de la prochaine sÃ©ance.',
    target_teams: ['Ã‰quipe 1'], scheduled_for: null, created_at: past(3, 10),
  },
  {
    id: 'demo-ann-018', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸŽ¯ SÃ©ance vidÃ©o jeudi â€” Analyse tactique prÃ©-match',
    message: 'Comme annoncÃ©, sÃ©ance vidÃ©o d\'analyse tactique jeudi Ã  20h dans la salle du club. PrÃ©sence recommandÃ©e pour tous les joueurs convoquÃ©s vs AS Plougastel. DurÃ©e : environ 45 minutes. Le staff prÃ©sentera les points clÃ©s de l\'adversaire.',
    target_teams: ['Ã‰quipe 1'], scheduled_for: null, created_at: past(1, 14),
  },

  // â”€â”€ IA & Communication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-019', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'event', title: 'ðŸ“¸ Photos du match disponibles â€” Album partagÃ©',
    message: 'Les photos du match vs SC Quimper Brest sont disponibles dans l\'album partagÃ© ! 87 photos au total par notre photographe bÃ©nÃ©vole Sylvain. Merci Ã  lui pour ce superbe travail. Partagez avec vos familles !',
    target_teams: [], scheduled_for: null, created_at: past(6, 12),
  },
  {
    id: 'demo-ann-020', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ† Classement J27 â€” On reste dans le Top 5 !',
    message: '5Ã¨me place au championnat aprÃ¨s la journÃ©e 27 avec 44 points. 4 matchs Ã  jouer dont 2 Ã  domicile. L\'objectif d\'une place europÃ©enne en 3Ã¨me division reste accessible. Chaque point compte â€” restez mobilisÃ©s !',
    target_teams: [], scheduled_for: null, created_at: past(7, 20),
  },
  {
    id: 'demo-ann-021', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸ‘• Nouveau partenariat â€” Auto Brest Center Ã©quipe notre staff',
    message: 'Bienvenue Ã  Auto Brest Center comme nouveau partenaire Silver du club ! Ils Ã©quiperont notre staff technique en tenues officielles pour la saison 2026-2027. Un grand merci pour leur soutien. Retrouvez-les sur le panneau publicitaire bord terrain.',
    target_teams: [], scheduled_for: null, created_at: past(18, 9),
  },

  // â”€â”€ U17 & FÃ©minines â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'demo-ann-022', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'result', title: 'âš½ U17 : Noa Kerguelen â€” Hat-trick historique !',
    message: 'Noa Kerguelen a inscrit un triplÃ© lors de la victoire 4-1 contre ES Lesneven. Ã€ 16 ans, il devient le plus jeune joueur Ã  rÃ©ussir un hat-trick sous le maillot du FC SportLink. Un talent Ã  suivre de prÃ¨s ! ðŸŒŸ',
    target_teams: ['U17'], scheduled_for: null, created_at: past(12, 19),
  },
  {
    id: 'demo-ann-023', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'info', title: 'ðŸŒŸ DÃ©tection rÃ©gionale â€” 3 U17 sÃ©lectionnÃ©s',
    message: 'FÃ©licitations Ã  Noa Kerguelen, Mathis Keriven et ThÃ©o Tanguy, sÃ©lectionnÃ©s pour les stages de dÃ©tection rÃ©gionale Bretagne U17 ! Une belle reconnaissance du travail effectuÃ©. Le club est trÃ¨s fier de vous.',
    target_teams: ['U17'], scheduled_for: null, created_at: past(20, 11),
  },
  {
    id: 'demo-ann-024', club_id: DEMO_CLUB_ID, club_name: 'FC SportLink Démo', author_id: DEMO_USER_ID, author_name: 'Alexandre Martin',
    type: 'event', title: 'ðŸ‘§ FÃ©minines : JournÃ©e portes ouvertes U11 et U13 F',
    message: 'Le FC SportLink ouvre ses portes aux filles de 8 Ã  13 ans ! JournÃ©e portes ouvertes samedi prochain de 10h Ã  12h. Venez dÃ©couvrir le football fÃ©minin dans une ambiance conviviale. Aucun Ã©quipement requis, juste envie de s\'amuser.',
    target_teams: ['Ã‰quipe F'], scheduled_for: null, created_at: past(4, 15),
  },
];

