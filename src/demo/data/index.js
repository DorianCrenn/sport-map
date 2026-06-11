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
    club_managers:         [],
    club_follows:          [..._demoFollowsWithUser],
    club_media_assets:     [],
    attendees:             [],
    favorites:             [],
    event_comments:        [],
    event_reactions:       [],
    featured_events:       [],
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
    player_guardians:      [],
    club_challenges:       [],
  };
}
