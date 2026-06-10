/**
 * demoDataGenerator — Génère et supprime des données de démonstration pour un club.
 *
 * Les données sont taguées is_demo:true pour pouvoir être supprimées proprement.
 * Génère : 5 events (3 matchs + 2 entraînements) + 1 annonce + 1 ride
 */
import { supabase } from './supabase.js';

// Coordonnées par défaut (Brest, Finistère)
const DEFAULT_LAT = 48.3904;
const DEFAULT_LNG = -4.4861;

function futureDate(daysFromNow, hour = 15) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export async function generateDemoData(clubId, userId, clubName, sport = 'Football') {
  const name = clubName ?? 'Mon Club';

  // 5 événements
  const events = [
    {
      title: `${name} — Match de démonstration`,
      sport,
      date: futureDate(7, 15),
      lat: DEFAULT_LAT, lng: DEFAULT_LNG,
      city: 'Brest', venue: 'Stade exemple',
      event_type: 'championship',
      home_or_away: 'home',
      adversaire: 'Club Adversaire FC',
      team_name: 'Équipe A',
      club_id: clubId, user_id: userId,
      source: 'user', is_demo: true,
    },
    {
      title: `${name} — Coupe régionale`,
      sport,
      date: futureDate(14, 14),
      lat: DEFAULT_LAT + 0.05, lng: DEFAULT_LNG + 0.05,
      city: 'Brest', venue: 'Stade municipal',
      event_type: 'cup',
      home_or_away: 'away',
      adversaire: 'AS Exemple',
      team_name: 'Équipe A',
      club_id: clubId, user_id: userId,
      source: 'user', is_demo: true,
    },
    {
      title: `${name} — Match amical`,
      sport,
      date: futureDate(21, 10),
      lat: DEFAULT_LAT, lng: DEFAULT_LNG,
      city: 'Brest', venue: 'Terrain annexe',
      event_type: 'friendly',
      home_or_away: 'home',
      adversaire: 'Club Amical',
      team_name: 'Équipe B',
      club_id: clubId, user_id: userId,
      source: 'user', is_demo: true,
    },
    {
      title: `Entraînement ${name}`,
      sport,
      date: futureDate(3, 18),
      lat: DEFAULT_LAT, lng: DEFAULT_LNG,
      city: 'Brest', venue: 'Terrain d\'entraînement',
      event_type: 'friendly',
      team_name: 'Seniors',
      club_id: clubId, user_id: userId,
      source: 'user', is_demo: true,
    },
    {
      title: `Entraînement jeunes ${name}`,
      sport,
      date: futureDate(5, 17),
      lat: DEFAULT_LAT + 0.01, lng: DEFAULT_LNG,
      city: 'Brest', venue: 'Complexe sportif',
      event_type: 'friendly',
      team_name: 'U13',
      club_id: clubId, user_id: userId,
      source: 'user', is_demo: true,
    },
  ];

  const { data: createdEvents, error: evErr } = await supabase
    .from('events')
    .insert(events)
    .select('id');

  if (evErr) throw evErr;

  // 1 annonce
  const { error: annErr } = await supabase
    .from('club_announcements')
    .insert({
      club_id: clubId,
      author_id: userId,
      type: 'info',
      title: `Bienvenue sur la page de ${name} !`,
      message: `Retrouvez ici toutes nos actualités : matchs, entraînements, résultats et annonces. Bienvenue dans notre communauté ! 🏆`,
      target_teams: [],
      is_demo: true,
    });

  if (annErr) console.warn('[Demo] annonce failed:', annErr.message);

  // 1 ride lié au premier événement
  if (createdEvents?.[0]?.id) {
    const { error: rideErr } = await supabase
      .from('rides')
      .insert({
        event_id: createdEvents[0].id,
        driver_id: userId,
        driver_name: 'Exemple Conducteur',
        departure_location: 'Place de la Liberté, Brest',
        departure_lat: DEFAULT_LAT,
        departure_lng: DEFAULT_LNG,
        departure_time: futureDate(7, 14),
        available_seats: 3,
        notes: 'Covoiturage de démonstration — prenez contact pour les vrais trajets.',
        status: 'active',
        is_demo: true,
      });
    if (rideErr) console.warn('[Demo] ride failed:', rideErr.message);
  }

  return { ok: true, count: (createdEvents?.length ?? 0) + 1 };
}

export async function deleteDemoData(clubId) {
  // Supprimer dans l'ordre pour respecter les FK (rides avant events)
  const eventIds = await supabase
    .from('events')
    .select('id')
    .eq('club_id', clubId)
    .eq('is_demo', true);

  if (eventIds.data?.length) {
    await supabase.from('rides').delete()
      .in('event_id', eventIds.data.map(e => e.id))
      .eq('is_demo', true);
  }

  await supabase.from('events').delete().eq('club_id', clubId).eq('is_demo', true);
  await supabase.from('club_announcements').delete().eq('club_id', clubId).eq('is_demo', true);
}

export async function hasDemoData(clubId) {
  const { count } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .eq('is_demo', true);
  return (count ?? 0) > 0;
}
