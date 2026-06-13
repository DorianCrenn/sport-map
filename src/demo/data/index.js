import { DEMO_CLUB_ID, DEMO_USER_ID, demoClubRow, demoBrandKit, demoClubPage } from './club.js';
import { demoEvents, demoAttendeesCounts } from './events.js';
import { demoAnnouncements } from './announcements.js';
import { demoRides, demoRideRequests } from './rides.js';
import { demoSponsors } from './sponsors.js';
import { demoPlayers } from './players.js';
import { demoStats, demoPageViews, demoPosterExports, demoClubFollows } from './stats.js';
import { demoConvocations } from './convocations.js';

export {
  DEMO_CLUB_ID, DEMO_USER_ID,
  demoClubRow, demoBrandKit, demoClubPage,
  demoEvents, demoAttendeesCounts,
  demoAnnouncements,
  demoRides, demoRideRequests,
  demoSponsors,
  demoPlayers,
  demoStats, demoPageViews, demoPosterExports, demoClubFollows,
  demoConvocations,
};

// ── Profil auth démo ─────────────────────────────────────────────────────────

export const DEMO_AUTH_USER = {
  id:              DEMO_USER_ID,
  email:           'demo@sportlink.app',
  user_metadata:   { name: 'Alexandre Martin' },
  created_at:      '2026-01-15T10:00:00Z',
};

export const DEMO_PROFILE_ROW = {
  id:              DEMO_USER_ID,
  name:            'Alexandre Martin',
  role:            'club_admin',
  club_id:         DEMO_CLUB_ID,
  avatar_url:      null,
  favorite_sports: ['Football'],
  followed_clubs:  [DEMO_CLUB_ID],
  onboarding_done: true,
  digest_opt_in:   false,
  auth_provider:   'email',
  badges:          ['first_step', 'explorer', 'loyal_fan'],
  plan:            'free',
  xp:              450,
  job_role:        'Président',
  created_at:      '2026-01-15T10:00:00Z',
};

export const DEMO_SESSION = {
  access_token:  'demo-access-token',
  refresh_token: 'demo-refresh-token',
  user:           DEMO_AUTH_USER,
};

// ── Entraînements (pour useClubTrainings) ────────────────────────────────────

export const demoTrainings = [
  { id: 'demo-tr-001', club_id: DEMO_CLUB_ID, day: 2, time: '18:30', location: 'Complexe de la Cavale Blanche', team_name: 'Équipe 1' },
  { id: 'demo-tr-002', club_id: DEMO_CLUB_ID, day: 4, time: '18:30', location: 'Complexe de la Cavale Blanche', team_name: 'Équipe 1' },
  { id: 'demo-tr-003', club_id: DEMO_CLUB_ID, day: 2, time: '17:00', location: 'Terrain annexe – Cavale Blanche', team_name: 'U17' },
  { id: 'demo-tr-004', club_id: DEMO_CLUB_ID, day: 5, time: '17:00', location: 'Terrain annexe – Cavale Blanche', team_name: 'U17' },
  { id: 'demo-tr-005', club_id: DEMO_CLUB_ID, day: 3, time: '19:00', location: 'Complexe de la Cavale Blanche', team_name: 'Équipe F' },
];

// ── club_follows : démo-user + 341 abonnés fictifs ────────────────────────────

const _demoFollowsWithUser = [
  { user_id: DEMO_USER_ID, club_id: DEMO_CLUB_ID, teams: 'all', notif: { match: true, news: true } },
  ...demoClubFollows.slice(0, 341),
];

// ── Table map : nom de table Supabase → tableau de lignes ───────────────────

export function buildDemoTables() {
  // Dates dynamiques — recalculées à chaque ouverture de démo
  const TODAY = new Date().toISOString().slice(0, 10);
  const NOW   = new Date().toISOString();

  // Helpers date
  function futureDate(days, hour = 15) {
    const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  // Mutable copies — modifiable during sandbox mode
  return {
    events:                [...demoEvents],
    clubs:                 [{ ...demoClubRow }],
    profiles:              [{ ...DEMO_PROFILE_ROW }],
    club_announcements:    [...demoAnnouncements],
    rides:                 [...demoRides],
    ride_requests:         [...demoRideRequests],
    ride_notifications:    [],
    club_sponsors:         [...demoSponsors],
    club_pages:            [{ ...demoClubPage }],
    club_brand_kits:       [{ ...demoBrandKit }],
    club_trainings:        [...demoTrainings],

    // ── Séances d'entraînement — aujourd'hui + 4 semaines ───────────────────
    training_sessions: [
      // Aujourd'hui
      { id: 'demo-ts-001', club_id: DEMO_CLUB_ID, team_id: null, date: TODAY,          time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-002', club_id: DEMO_CLUB_ID, team_id: null, date: TODAY,          time: '17h00', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      { id: 'demo-ts-003', club_id: DEMO_CLUB_ID, team_id: null, date: TODAY,          time: '19h30', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      // Semaine 1
      { id: 'demo-ts-004', club_id: DEMO_CLUB_ID, team_id: null, date: futureDate(2),  time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-005', club_id: DEMO_CLUB_ID, team_id: null, date: futureDate(2),  time: '17h00', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      { id: 'demo-ts-006', club_id: DEMO_CLUB_ID, team_id: null, date: futureDate(4),  time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-007', club_id: DEMO_CLUB_ID, team_id: null, date: futureDate(4),  time: '19h00', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      // Semaine 2
      { id: 'demo-ts-008', club_id: DEMO_CLUB_ID, team_id: null, date: futureDate(9),  time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-009', club_id: DEMO_CLUB_ID, team_id: null, date: futureDate(11), time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      // Semaine 3
      { id: 'demo-ts-010', club_id: DEMO_CLUB_ID, team_id: null, date: futureDate(16), time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-011', club_id: DEMO_CLUB_ID, team_id: null, date: futureDate(18), time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
    ],

    // ── Scores de matchs — état pré-match (J+4) + 4 matchs EN DIRECT ────────
    match_scores: [
      {
        // demo-event-001 (J+4) — état pre_filled (12 accepted, 3 pending)
        id: 'demo-ms-001', event_id: 'demo-event-001', sport: 'Football',
        score_home: null, score_away: null, status: 'pending',
        score_detail: {}, man_of_match: null, validated_by: null, validated_at: null,
        created_at: NOW, updated_at: NOW,
      },
      {
        // demo-event-016 (hier) — EN DIRECT (Équipe 1 gagne 2-1)
        id: 'demo-ms-016', event_id: 'demo-event-016', sport: 'Football',
        score_home: 2, score_away: 1, status: 'in_progress',
        score_detail: {}, man_of_match: null, validated_by: null, validated_at: null,
        created_at: NOW, updated_at: NOW,
      },
      {
        // demo-event-live-001 (Réserve, en ce moment) — CS Plabennec R mène 1-0
        id: 'demo-ms-live-001', event_id: 'demo-event-live-001', sport: 'Football',
        score_home: 0, score_away: 1, status: 'in_progress',
        score_detail: {}, man_of_match: null, validated_by: null, validated_at: null,
        created_at: NOW, updated_at: NOW,
      },
      {
        // demo-event-live-002 (U17, en ce moment) — FC SportLink U17 mène 2-0
        id: 'demo-ms-live-002', event_id: 'demo-event-live-002', sport: 'Football',
        score_home: 2, score_away: 0, status: 'in_progress',
        score_detail: {}, man_of_match: null, validated_by: null, validated_at: null,
        created_at: NOW, updated_at: NOW,
      },
      {
        // demo-event-live-003 (Féminines, en ce moment) — Match nul 1-1
        id: 'demo-ms-live-003', event_id: 'demo-event-live-003', sport: 'Football',
        score_home: 1, score_away: 1, status: 'in_progress',
        score_detail: {}, man_of_match: null, validated_by: null, validated_at: null,
        created_at: NOW, updated_at: NOW,
      },
    ],

    match_lineups:     [],
    match_encounters:  [],
    live_match_events: [],

    // ── Gestionnaires du club ─────────────────────────────────────────────────
    // Permet à useManagedClubs de reconnaître le demo user comme manager
    club_managers: [
      { id: 'demo-cm-001', club_id: DEMO_CLUB_ID, email: 'demo@sportlink.app',        role: 'owner',        name: 'Alexandre Martin' },
      { id: 'demo-cm-002', club_id: DEMO_CLUB_ID, email: 'coach@fc-sportlink.app',    role: 'coach',        name: 'Bastien Tilly' },
      { id: 'demo-cm-003', club_id: DEMO_CLUB_ID, email: 'comm@fc-sportlink.app',     role: 'communicant',  name: 'Sophie Kerboas' },
      { id: 'demo-cm-004', club_id: DEMO_CLUB_ID, email: 'entraineur@fc-sportlink.app', role: 'editor',     name: 'Marc Derrien' },
    ],

    club_follows: [..._demoFollowsWithUser],
    club_media_assets: [],
    attendees:         [],
    favorites:         [],
    event_comments:    [],
    event_reactions:   [],

    // ── Événements mis en avant (featured gallery dans ClubFeed) ─────────────
    featured_events: [
      {
        id: 'demo-fe-001', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID,
        plan: 'pro', sport: 'Football', club_name: 'FC SportLink Démo',
        poster_url: null, home_team: 'FC SportLink Démo', away_team: 'AS Plougastel',
        event_date: futureDate(4, 15), created_at: NOW,
      },
      {
        id: 'demo-fe-002', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID,
        plan: 'pro', sport: 'Football', club_name: 'FC SportLink Démo',
        poster_url: null, home_team: 'FC SportLink Démo', away_team: 'Stade Brestois B',
        event_date: futureDate(7, 14), created_at: NOW,
      },
      {
        id: 'demo-fe-003', event_id: 'demo-event-003', club_id: DEMO_CLUB_ID,
        plan: 'elite', sport: 'Football', club_name: 'FC SportLink Démo',
        poster_url: null, home_team: 'Tournoi de la Pentecôte', away_team: 'U17 – 8 équipes',
        event_date: futureDate(10, 9), created_at: NOW,
      },
    ],

    poster_exports:        [...demoPosterExports],
    posters:               [],
    club_ai_usage:         [{ club_id: DEMO_CLUB_ID, month: '2026-06-01', generate_count: 6 }],
    club_page_views:       [...demoPageViews],
    club_players:          [...demoPlayers],
    push_subscriptions:    [],
    event_attendee_counts: [...demoAttendeesCounts],
    event_reaction_counts: [],
    event_photos:          [],
    event_predictions:     [],
    app_feedback:          [],
    app_feedback_votes:    [],
    event_convocations:    [...demoConvocations],

    // ── Tuteurs légaux — lie le demo user à 2 joueurs (profil Parent) ─────────
    player_guardians: [
      { id: 'demo-pg-001', player_id: 'demo-player-038', user_id: DEMO_USER_ID, created_at: NOW },
      { id: 'demo-pg-002', player_id: 'demo-player-041', user_id: DEMO_USER_ID, created_at: NOW },
    ],

    club_challenges:         [],
    training_attendance:     [],
    match_player_attendance: [],
  };
}
