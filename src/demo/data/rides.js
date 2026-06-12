import { DEMO_USER_ID } from './club.js';

function future(days, hour = 14, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function past(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const demoRides = [
  // ── Match Équipe 1 (J+4) — 2 voitures ──────────────────────────────────────
  {
    id:                   'demo-ride-001',
    event_id:             'demo-event-001',
    driver_id:            DEMO_USER_ID,
    driver_name:          'Alexandre Martin',
    departure_location:   'Place de la Liberté, Brest',
    departure_lat:        48.3904,
    departure_lng:        -4.4861,
    departure_time:       future(4, 14, 0),
    available_seats:      3,
    accepted_equipment:   [],
    detour_flexibility:   'none',
    status:               'active',
    notes:                'Départ pile à 14h00. Retour prévu vers 18h30 après le match.',
    created_at:           past(2),
  },
  {
    id:                   'demo-ride-002',
    event_id:             'demo-event-001',
    driver_id:            'demo-user-002',
    driver_name:          'Romain Quéméner',
    departure_location:   'Parking Intermarché Bellevue, Brest',
    departure_lat:        48.4012,
    departure_lng:        -4.5022,
    departure_time:       future(4, 13, 45),
    available_seats:      4,
    accepted_equipment:   ['bag'],
    detour_flexibility:   'small',
    status:               'active',
    notes:                'Monospace 7 places, pas de souci pour les sacs de sport. Je passe par Guipavas.',
    created_at:           past(2),
  },

  // ── Coupe de Bretagne Équipe 1 (J+7) ──────────────────────────────────────
  {
    id:                   'demo-ride-003',
    event_id:             'demo-event-002',
    driver_id:            'demo-user-003',
    driver_name:          'Sophie Kerboas',
    departure_location:   'Gare de Brest',
    departure_lat:        48.3920,
    departure_lng:        -4.4773,
    departure_time:       future(7, 13, 0),
    available_seats:      4,
    accepted_equipment:   ['bag'],
    detour_flexibility:   'small',
    status:               'active',
    notes:                'Grand monospace. Retour après le match + pot. N\'hésitez pas à me contacter !',
    created_at:           past(3),
  },

  // ── U17 (J+6) — covoiturage parents ───────────────────────────────────────
  {
    id:                   'demo-ride-004',
    event_id:             'demo-event-006',
    driver_id:            'demo-user-006',
    driver_name:          'Patrick Kerguelen',
    departure_location:   'Complexe de la Cavale Blanche, Brest',
    departure_lat:        48.3780,
    departure_lng:        -4.4650,
    departure_time:       future(6, 14, 30),
    available_seats:      5,
    accepted_equipment:   ['bag'],
    detour_flexibility:   'medium',
    status:               'active',
    notes:                'Je prends les gamins U17 — 4 places disponibles. Départ après l\'entraînement du midi.',
    created_at:           past(1),
  },

  // ── Réserve (J+5) ─────────────────────────────────────────────────────────
  {
    id:                   'demo-ride-005',
    event_id:             'demo-event-017',
    driver_id:            'demo-user-007',
    driver_name:          'Gaël Kerboas',
    departure_location:   'Place Guérin, Brest',
    departure_lat:        48.3862,
    departure_lng:        -4.4900,
    departure_time:       future(5, 14, 0),
    available_seats:      3,
    accepted_equipment:   [],
    detour_flexibility:   'none',
    status:               'active',
    notes:                'Départ à 14h pétantes. Je ne peux pas attendre, soyez à l\'heure !',
    created_at:           past(0),
  },

  // ── Tournoi U17 journée (J+10) ────────────────────────────────────────────
  {
    id:                   'demo-ride-006',
    event_id:             'demo-event-003',
    driver_id:            'demo-user-002',
    driver_name:          'Yann Le Guével',
    departure_location:   'Parking Leclerc Guipavas',
    departure_lat:        48.4380,
    departure_lng:        -4.4150,
    departure_time:       future(10, 8, 30),
    available_seats:      2,
    accepted_equipment:   ['bag', 'chair'],
    detour_flexibility:   'none',
    status:               'active',
    notes:                'Tournoi toute la journée. Prévoir pique-nique. On rentre vers 18h. Equipement de repli autorisé.',
    created_at:           past(1),
  },

  // ── Féminines (J+11) ──────────────────────────────────────────────────────
  {
    id:                   'demo-ride-007',
    event_id:             'demo-event-007',
    driver_id:            'demo-user-008',
    driver_name:          'Camille Burel',
    departure_location:   'Stade Francis-Le Blé, Brest',
    departure_lat:        48.3904,
    departure_lng:        -4.4861,
    departure_time:       future(11, 13, 30),
    available_seats:      3,
    accepted_equipment:   ['bag'],
    detour_flexibility:   'small',
    status:               'active',
    notes:                'Départ stade après l\'entraînement du matin. Retour vers 19h.',
    created_at:           past(0),
  },
];

export const demoRideRequests = [
  // ── Ride 001 (Alexandre Martin J+4) — 2 accepted, 1 place libre ───────────
  {
    id:             'demo-req-001',
    ride_id:        'demo-ride-001',
    passenger_id:   'demo-user-004',
    passenger_name: 'Maxime Briand',
    message:        'Bonjour Alex, je suis joueur dans l\'équipe. Merci beaucoup !',
    status:         'accepted',
    created_at:     past(1),
  },
  {
    id:             'demo-req-002',
    ride_id:        'demo-ride-001',
    passenger_id:   'demo-user-005',
    passenger_name: 'Clément Hélas',
    message:        'Parfait pour moi, je serai au point de rendez-vous à l\'heure.',
    status:         'accepted',
    created_at:     past(1),
  },

  // ── Ride 002 (Romain J+4) — 3 accepted, complet ───────────────────────────
  {
    id:             'demo-req-003',
    ride_id:        'demo-ride-002',
    passenger_id:   'demo-user-009',
    passenger_name: 'Thomas Guyader',
    message:        'Super, je passe chez toi vers 13h40 si ça te va.',
    status:         'accepted',
    created_at:     past(2),
  },
  {
    id:             'demo-req-004',
    ride_id:        'demo-ride-002',
    passenger_id:   'demo-user-010',
    passenger_name: 'Pierre Jaouen',
    message:        'OK pour moi, merci Romain.',
    status:         'accepted',
    created_at:     past(2),
  },
  {
    id:             'demo-req-005',
    ride_id:        'demo-ride-002',
    passenger_id:   'demo-user-011',
    passenger_name: 'Lucas Morel',
    message:        'Je peux passer te récupérer avant si tu veux, j\'habite pas loin.',
    status:         'accepted',
    created_at:     past(1),
  },
  {
    id:             'demo-req-006',
    ride_id:        'demo-ride-002',
    passenger_id:   'demo-user-012',
    passenger_name: 'Nathan Kermarrec',
    message:        'Bonjour, encore une place disponible ?',
    status:         'declined',
    created_at:     past(0),
  },

  // ── Ride 003 (Sophie J+7) — 2 accepted, 1 pending ─────────────────────────
  {
    id:             'demo-req-007',
    ride_id:        'demo-ride-003',
    passenger_id:   'demo-user-013',
    passenger_name: 'Baptiste Seznec',
    message:        'Merci Sophie ! À samedi.',
    status:         'accepted',
    created_at:     past(1),
  },
  {
    id:             'demo-req-008',
    ride_id:        'demo-ride-003',
    passenger_id:   'demo-user-014',
    passenger_name: 'Florian Calvez',
    message:        'Ça m\'arrange vraiment, merci !',
    status:         'accepted',
    created_at:     past(1),
  },
  {
    id:             'demo-req-009',
    ride_id:        'demo-ride-003',
    passenger_id:   'demo-user-015',
    passenger_name: 'Julien Prigent',
    message:        'Bonjour, je confirme dès que j\'ai le feu vert du boulot.',
    status:         'pending',
    created_at:     past(0),
  },

  // ── Ride 004 (Patrick U17 J+6) — 3 accepted ───────────────────────────────
  {
    id:             'demo-req-010',
    ride_id:        'demo-ride-004',
    passenger_id:   'demo-user-016',
    passenger_name: 'Maman de Liam Creach',
    message:        'Merci Patrick, Liam sera prêt à 14h15 au complexe.',
    status:         'accepted',
    created_at:     past(1),
  },
  {
    id:             'demo-req-011',
    ride_id:        'demo-ride-004',
    passenger_id:   'demo-user-017',
    passenger_name: 'Papa de Théo Tanguy',
    message:        'Super, Théo sera là. On peut aussi prendre Titouan au passage si besoin.',
    status:         'accepted',
    created_at:     past(1),
  },

  // ── Ride 005 (Gaël Réserve J+5) — 1 accepted, 1 pending ──────────────────
  {
    id:             'demo-req-012',
    ride_id:        'demo-ride-005',
    passenger_id:   'demo-user-018',
    passenger_name: 'Arnaud Coat',
    message:        'Pas de souci, je suis toujours à l\'heure moi !',
    status:         'accepted',
    created_at:     past(0),
  },
  {
    id:             'demo-req-013',
    ride_id:        'demo-ride-005',
    passenger_id:   'demo-user-019',
    passenger_name: 'Loïc Brézulier',
    message:        'Je confirme dans la soirée, j\'attends une réponse de ma femme.',
    status:         'pending',
    created_at:     past(0),
  },
];
