import { DEMO_USER_ID } from './club.js';

function future(days, hour = 14) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function past(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const demoRides = [
  {
    id:                   'demo-ride-001',
    event_id:             'demo-event-001',
    driver_id:            DEMO_USER_ID,
    driver_name:          'Alexandre Martin',
    departure_location:   'Place de la Liberté, Brest',
    departure_lat:        48.3904,
    departure_lng:        -4.4861,
    departure_time:       future(4, 14),
    available_seats:      3,
    status:               'active',
    notes:                'Départ pile à 14h00. 1 place disponible. Retour prévu vers 18h30.',
    created_at:           past(2),
  },
  {
    id:                   'demo-ride-002',
    event_id:             'demo-event-002',
    driver_id:            'demo-user-002',
    driver_name:          'Sophie Kerboas',
    departure_location:   'Gare de Brest, Brest',
    departure_lat:        48.3920,
    departure_lng:        -4.4773,
    departure_time:       future(7, 13),
    available_seats:      4,
    status:               'active',
    notes:                'Grand monospace. Retour après le match. N\'hésitez pas à me contacter !',
    created_at:           past(3),
  },
  {
    id:                   'demo-ride-003',
    event_id:             'demo-event-003',
    driver_id:            'demo-user-003',
    driver_name:          'Yann Le Guével',
    departure_location:   'Parking Leclerc Guipavas',
    departure_lat:        48.4380,
    departure_lng:        -4.4150,
    departure_time:       future(10, 8, 30),
    available_seats:      2,
    status:               'active',
    notes:                'Tournoi de la journée. Prévoir pique-nique. On rentre vers 18h.',
    created_at:           past(1),
  },
];

export const demoRideRequests = [
  {
    id:             'demo-req-001',
    ride_id:        'demo-ride-001',
    passenger_id:   'demo-user-004',
    passenger_name: 'Maxime Briand',
    message:        'Bonjour, je suis joueur dans l\'équipe. Merci !',
    status:         'accepted',
    created_at:     past(1),
  },
  {
    id:             'demo-req-002',
    ride_id:        'demo-ride-002',
    passenger_id:   'demo-user-005',
    passenger_name: 'Clément Hélas',
    message:        'Parfait pour moi, merci beaucoup.',
    status:         'pending',
    created_at:     past(0),
  },
];
