import { DEMO_CLUB_ID, DEMO_USER_ID } from './club.js';

function past(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const demoAnnouncements = [
  // ── Résultats ────────────────────────────────────────────────────────────────
  {
    id: 'demo-ann-001', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'result', title: '🏆 Victoire 3-1 face à SC Quimper Brest !',
    message: 'Super prestation collective ce samedi ! Une victoire méritée 3-1 qui nous maintient dans le top 5 du championnat. Bravo à tous les joueurs et au staff. Lucas Morel nommé Homme du Match. Prochaine étape : la Coupe !',
    target_teams: [], scheduled_for: null, created_at: past(7, 18),
  },
  {
    id: 'demo-ann-008', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'result', title: '✅ U17 : Victoire 4-1 vs ES Lesneven — Bravo les jeunes !',
    message: 'Belle perf des U17 ce weekend ! 4-1 face à ES Lesneven avec un hat-trick de Noa Kerguelen. L\'équipe confirme sa progression. RDV samedi prochain pour le Tournoi de la Pentecôte !',
    target_teams: ['U17'], scheduled_for: null, created_at: past(12, 17),
  },
  {
    id: 'demo-ann-009', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'result', title: '⚽ Féminines : 2-1 contre Brest Sport F — Match intense !',
    message: 'Les Féminines s\'imposent 2-1 dans un match très disputé. Jade Berthou nommée Joueuse du Match avec son doublé. Le groupe monte en puissance. Prochain match vendredi soir.',
    target_teams: ['Équipe F'], scheduled_for: null, created_at: past(8, 19),
  },
  {
    id: 'demo-ann-010', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'result', title: '🥇 Qualification Coupe ! On est en demi-finale !',
    message: 'Victoire 2-0 contre AS Landerneau en quart de finale ! On est qualifiés pour les demi-finales de la Coupe Bretagne. Tirage au sort vendredi. Restez connectés !',
    target_teams: [], scheduled_for: null, created_at: past(14, 20),
  },

  // ── Urgences / Convocations ──────────────────────────────────────────────────
  {
    id: 'demo-ann-002', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'urgent', title: '📋 Convocation — Match vs AS Plougastel (samedi)',
    message: 'Tous les joueurs convoqués pour le match de championnat contre AS Plougastel. Rendez-vous samedi à 13h30 au vestiaire. Tenue : maillot domicile. Répondez à cette convocation dès que possible.',
    target_teams: ['Équipe 1'], scheduled_for: null, created_at: past(2, 9),
  },
  {
    id: 'demo-ann-011', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'urgent', title: '🚨 URGENT : Annulation entraînement jeudi — terrain indisponible',
    message: "L'entraînement de jeudi soir est annulé suite à une indisponibilité du terrain suite aux intempéries. Le prochain entraînement aura lieu mardi à 18h30. Désolé pour la gêne occasionnée.",
    target_teams: ['Équipe 1', 'Réserve'], scheduled_for: null, created_at: past(3, 16),
  },
  {
    id: 'demo-ann-012', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'urgent', title: '📍 Changement de terrain — Match Réserve samedi',
    message: "Suite à une réservation conflictuelle, le match de la Réserve samedi se jouera au Terrain de Kergoat et non au terrain habituel. Même horaire : 14h00. Merci de bien noter l'adresse : Rue de Kergoat, Brest.",
    target_teams: ['Réserve'], scheduled_for: null, created_at: past(4, 11),
  },

  // ── Infos ────────────────────────────────────────────────────────────────────
  {
    id: 'demo-ann-003', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'info', title: '🕐 Nouvel horaire : entraînement seniors avancé à 18h30',
    message: "À partir de la semaine prochaine, l'entraînement des seniors est avancé à 18h30 (au lieu de 19h00). Ce changement est définitif pour la fin de la saison. Merci de votre compréhension.",
    target_teams: ['Équipe 1', 'Réserve'], scheduled_for: null, created_at: past(5, 14),
  },
  {
    id: 'demo-ann-013', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'info', title: '👕 Commande de maillots — Délai 3 semaines',
    message: "La commande de maillots de fin de saison est en cours. Délai de livraison estimé : 3 semaines. Si vous n'avez pas encore confirmé votre taille, faites-le avant vendredi soir via le formulaire partagé.",
    target_teams: [], scheduled_for: null, created_at: past(9, 10),
  },
  {
    id: 'demo-ann-014', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'info', title: '💳 Cotisations 2026-2027 — Ouverture des réinscriptions',
    message: "Les réinscriptions pour la saison 2026-2027 sont ouvertes ! Tarif identique à la saison précédente. Règlement par virement ou espèces au trésorier. Profitez-en pour mettre à jour vos informations médicales.",
    target_teams: [], scheduled_for: null, created_at: past(16, 9),
  },

  // ── Événements / Activités ───────────────────────────────────────────────────
  {
    id: 'demo-ann-004', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'event', title: '🎉 Tournoi de la Pentecôte — Inscription ouverte',
    message: 'Le FC SportLink Démo organise son Tournoi de la Pentecôte ! 8 équipes U17 s\'affrontent dans un esprit festif. Inscriptions ouvertes jusqu\'au 20 juin. Restauration sur place assurée par notre équipe de bénévoles.',
    target_teams: [], scheduled_for: null, created_at: past(6, 11),
  },
  {
    id: 'demo-ann-005', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'result', title: '🏅 Qualification pour les demi-finales de Coupe !',
    message: 'Victoire 2-0 contre AS Landerneau en quart de finale ! On est en demi ! Le tirage au sort a lieu vendredi. Restez connectés pour connaître notre adversaire. Continuez à nous soutenir !',
    target_teams: [], scheduled_for: null, created_at: past(14, 20),
  },
  {
    id: 'demo-ann-015', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'event', title: '🎊 Fête de fin de saison — 5 juillet à partir de 18h !',
    message: 'Grande fête de fin de saison le 5 juillet au club ! Barbecue, animations, remise des récompenses et bonne humeur garantie. Entrée libre, venez nombreux avec vos familles. Inscription souhaitée pour prévoir le repas.',
    target_teams: [], scheduled_for: null, created_at: past(11, 14),
  },

  // ── Bénévoles ────────────────────────────────────────────────────────────────
  {
    id: 'demo-ann-006', club_id: DEMO_CLUB_ID, author_id: DEMO_USER_ID,
    type: 'info', title: '🥐 Buvette ouverte — Bénévoles recherchés',
    message: 'La buvette sera ouverte lors du prochain match à domicile vs AS Plougastel. Nous recherchons 3 bénévoles pour tenir la buvette. Si vous êtes disponible de 14h à 17h, contactez-nous par email. Merci d\'avance !',
    target_teams: [], scheduled_for: null, created_at: past(1, 16),
  },
];
