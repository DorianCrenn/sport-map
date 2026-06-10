import { DEMO_CLUB_ID, DEMO_USER_ID } from './club.js';

function past(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const demoAnnouncements = [
  {
    id:           'demo-ann-001',
    club_id:      DEMO_CLUB_ID,
    author_id:    DEMO_USER_ID,
    type:         'result',
    title:        '🏆 Victoire 3-1 face à SC Quimper Brest !',
    message:      'Super prestation collective ce samedi ! Une victoire méritée 3-1 qui nous maintient dans le top 5 du championnat. Bravo à tous les joueurs et au staff. Prochaine étape : la Coupe !',
    target_teams: [],
    scheduled_for: null,
    created_at:   past(7, 18),
  },
  {
    id:           'demo-ann-002',
    club_id:      DEMO_CLUB_ID,
    author_id:    DEMO_USER_ID,
    type:         'urgent',
    title:        '📋 Convocation — Match vs AS Plougastel',
    message:      'Tous les joueurs convoqués pour le match de championnat contre AS Plougastel. Rendez-vous samedi à 13h30 au vestiaire. Tenue : maillot domicile. Répondez à cette convocation dès que possible.',
    target_teams: ['Équipe 1'],
    scheduled_for: null,
    created_at:   past(2, 9),
  },
  {
    id:           'demo-ann-003',
    club_id:      DEMO_CLUB_ID,
    author_id:    DEMO_USER_ID,
    type:         'info',
    title:        '🕐 Nouvel horaire : entraînement seniors',
    message:      'À partir de la semaine prochaine, l\'entraînement des seniors est avancé à 18h30 (au lieu de 19h00). Ce changement est définitif pour la fin de la saison. Merci de votre compréhension.',
    target_teams: ['Équipe 1', 'Réserve'],
    scheduled_for: null,
    created_at:   past(4, 14),
  },
  {
    id:           'demo-ann-004',
    club_id:      DEMO_CLUB_ID,
    author_id:    DEMO_USER_ID,
    type:         'event',
    title:        '🎉 Tournoi de la Pentecôte — Inscription ouverte',
    message:      'Le FC SportLink Démo organise son Tournoi de la Pentecôte ! 8 équipes U17 s\'affrontent dans un esprit festif. Inscriptions ouvertes jusqu\'au 20 juin. Restauration sur place assurée par notre équipe de bénévoles.',
    target_teams: [],
    scheduled_for: null,
    created_at:   past(5, 11),
  },
  {
    id:           'demo-ann-005',
    club_id:      DEMO_CLUB_ID,
    author_id:    DEMO_USER_ID,
    type:         'result',
    title:        '🏅 Qualification pour les demi-finales de Coupe !',
    message:      'Victoire 2-0 contre AS Landerneau en quart de finale ! On est en demi ! Le tirage au sort a lieu vendredi. Restez connectés pour connaître notre adversaire. Continuez à nous soutenir !',
    target_teams: [],
    scheduled_for: null,
    created_at:   past(14, 20),
  },
  {
    id:           'demo-ann-006',
    club_id:      DEMO_CLUB_ID,
    author_id:    DEMO_USER_ID,
    type:         'info',
    title:        '🥐 Buvette ouverte — Bénévoles recherchés',
    message:      'La buvette sera ouverte lors du prochain match à domicile vs AS Plougastel. Nous recherchons 3 bénévoles pour tenir la buvette. Si vous êtes disponible de 14h à 17h, contactez-nous par email. Merci d\'avance !',
    target_teams: [],
    scheduled_for: null,
    created_at:   past(1, 16),
  },
];
