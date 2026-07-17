import { DEMO_CLUB_ID, DEMO_USER_ID, demoClubRow, demoBrandKit, demoClubPage } from './club.js';
import { demoEvents, demoAttendeesCounts } from './events.js';
import { demoAnnouncements } from './announcements.js';
import { demoRides, demoRideRequests } from './rides.js';
import { demoSponsors } from './sponsors.js';
import { demoPlayers } from './players.js';
import { demoStats, demoPageViews, demoPosterExports, demoClubFollows } from './stats.js';
import { demoConvocations } from './convocations.js';
import { extraClubs, extraPlayers, extraEvents, extraAnnouncements } from './extra-clubs.js';
import { franceClubs, francePlayers, franceEvents, franceAnnouncements } from './extra-clubs-france.js';

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

  // ── Profils pré-intégrés — le demoClient ne résout pas les FK joins ────────
  const PROFILE_MAP: Record<string, { name: string; avatar_url: string | null }> = {
    [DEMO_USER_ID]:       { name: 'Alexandre Martin',     avatar_url: null },
    'fake-user-p02':      { name: 'Romain Quéméner',      avatar_url: null },
    'fake-user-p03':      { name: 'Maxime Briand',         avatar_url: null },
    'fake-user-p04':      { name: 'Kevin Le Goff',         avatar_url: null },
    'fake-user-p05':      { name: 'Antonin Salaün',        avatar_url: null },
    'fake-user-p06':      { name: 'Thomas Guyader',        avatar_url: null },
    'fake-user-p07':      { name: 'Pierre Jaouen',         avatar_url: null },
    'fake-user-p08':      { name: 'Lucas Morel',           avatar_url: null },
    'fake-user-p09':      { name: 'Clément Hélas',         avatar_url: null },
    'fake-user-p10':      { name: 'Baptiste Seznec',       avatar_url: null },
    'fake-user-p11':      { name: 'Julien Prigent',        avatar_url: null },
    'fake-user-p12':      { name: 'Florian Calvez',        avatar_url: null },
    'fake-user-p13':      { name: 'Mathieu Dourdain',      avatar_url: null },
    'fake-user-p14':      { name: 'Hugo Kervarrec',        avatar_url: null },
    'fake-user-p15':      { name: 'Nathan Kermarrec',      avatar_url: null },
    'fake-user-p16':      { name: 'Yann Le Guével',        avatar_url: null },
    'fake-user-p17':      { name: 'Erwan Bodéré',          avatar_url: null },
    'fake-user-p18':      { name: 'Matthieu Briec',        avatar_url: null },
    'fake-user-p19':      { name: 'Gauthier Faou',         avatar_url: null },
    'fake-user-u17-01':   { name: 'Théo Tanguy',           avatar_url: null },
    'fake-user-u17-02':   { name: 'Liam Creach',           avatar_url: null },
    'fake-user-u17-03':   { name: 'Mael Rolland',          avatar_url: null },
    'fake-user-u17-04':   { name: 'Ewen Pors',             avatar_url: null },
    'fake-user-u17-05':   { name: 'Noa Kerguelen',         avatar_url: null },
    'fake-user-u17-06':   { name: 'Titouan Jézéquel',      avatar_url: null },
    'fake-user-u17-07':   { name: 'Mathis Keriven',        avatar_url: null },
    'fake-user-u17-08':   { name: 'Ilann Lefloch',         avatar_url: null },
    'fake-user-res-01':   { name: 'Gaël Kerboas',          avatar_url: null },
    'fake-user-res-02':   { name: 'Arnaud Coat',           avatar_url: null },
    'fake-user-res-03':   { name: 'Loïc Brézulier',        avatar_url: null },
    'fake-user-res-04':   { name: 'Simon Hélias',          avatar_url: null },
    'fake-user-res-05':   { name: 'Tristan Gall',          avatar_url: null },
    'fake-user-f-01':     { name: 'Camille Burel',         avatar_url: null },
    'fake-user-f-02':     { name: 'Laura Pors',            avatar_url: null },
    'fake-user-f-03':     { name: 'Enora Kervella',        avatar_url: null },
    'fake-user-f-04':     { name: 'Marie-Anne Dourdain',   avatar_url: null },
    'fake-parent-001':    { name: 'Catherine Creach',      avatar_url: null },
    'fake-parent-002':    { name: 'Marc Tanguy',           avatar_url: null },
    'fake-parent-003':    { name: 'Anne-Marie Kerguelen',  avatar_url: null },
    'fake-parent-004':    { name: 'Ronan Jézéquel',        avatar_url: null },
    'fake-parent-005':    { name: 'Isabelle Bodilis',      avatar_url: null },
    'fake-parent-006':    { name: 'Stéphane Mével',        avatar_url: null },
  };

  // Mutable copies — modifiable during sandbox mode
  const tables = {
    events:                [...demoEvents, ...extraEvents, ...franceEvents],
    clubs:                 [{ ...demoClubRow }, ...extraClubs, ...franceClubs],
    profiles: [
      { ...DEMO_PROFILE_ROW },
      // ── Parents fictifs — pour les lookups de profils directs ──────────────
      { id: 'fake-parent-001', name: 'Catherine Creach',     role: 'user', avatar_url: null, created_at: NOW },
      { id: 'fake-parent-002', name: 'Marc Tanguy',          role: 'user', avatar_url: null, created_at: NOW },
      { id: 'fake-parent-003', name: 'Anne-Marie Kerguelen', role: 'user', avatar_url: null, created_at: NOW },
      { id: 'fake-parent-004', name: 'Ronan Jézéquel',       role: 'user', avatar_url: null, created_at: NOW },
      { id: 'fake-parent-005', name: 'Isabelle Bodilis',     role: 'user', avatar_url: null, created_at: NOW },
      { id: 'fake-parent-006', name: 'Stéphane Mével',       role: 'user', avatar_url: null, created_at: NOW },
    ],
    club_announcements:    [...demoAnnouncements, ...extraAnnouncements, ...franceAnnouncements],
    rides:                 [...demoRides],
    ride_requests:         [...demoRideRequests],
    ride_notifications:    [],
    club_sponsors:         [...demoSponsors],
    club_pages:            [{ ...demoClubPage }],
    club_brand_kits:       [{ ...demoBrandKit }],
    club_trainings:        [...demoTrainings],

    // ── Séances d'entraînement — aujourd'hui + 4 semaines ───────────────────
    // team_id = team_name (identifiant textuel), doit correspondre à club_players.team_id
    training_sessions: [
      // Aujourd'hui — 3 équipes
      { id: 'demo-ts-001', club_id: DEMO_CLUB_ID, team_id: 'Équipe 1', date: TODAY,          time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-002', club_id: DEMO_CLUB_ID, team_id: 'U17',      date: TODAY,          time: '17h00', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      { id: 'demo-ts-003', club_id: DEMO_CLUB_ID, team_id: 'Réserve',  date: TODAY,          time: '19h30', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      // Semaine 1
      { id: 'demo-ts-004', club_id: DEMO_CLUB_ID, team_id: 'Équipe 1', date: futureDate(2),  time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-005', club_id: DEMO_CLUB_ID, team_id: 'U17',      date: futureDate(2),  time: '17h00', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      { id: 'demo-ts-006', club_id: DEMO_CLUB_ID, team_id: 'Équipe 1', date: futureDate(4),  time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-007', club_id: DEMO_CLUB_ID, team_id: 'Équipe F', date: futureDate(4),  time: '19h00', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      // Semaine 2
      { id: 'demo-ts-008', club_id: DEMO_CLUB_ID, team_id: 'Équipe 1', date: futureDate(9),  time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-009', club_id: DEMO_CLUB_ID, team_id: 'U17',      date: futureDate(11), time: '17h00', location: 'Terrain annexe – Cavale Blanche',    status: 'active', created_at: NOW },
      // Semaine 3
      { id: 'demo-ts-010', club_id: DEMO_CLUB_ID, team_id: 'Équipe 1', date: futureDate(16), time: '18h30', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
      { id: 'demo-ts-011', club_id: DEMO_CLUB_ID, team_id: 'Équipe F', date: futureDate(18), time: '19h00', location: 'Complexe de la Cavale Blanche',     status: 'active', created_at: NOW },
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
        // demo-event-016 (hier) — match en cours : 2-1 → pupitre de score visible pour le coach
        id: 'demo-ms-016', event_id: 'demo-event-016', sport: 'Football',
        score_home: 2, score_away: 1, status: 'in_progress',
        score_detail: {}, man_of_match: null, validated_by: null, validated_at: null,
        created_at: NOW, updated_at: NOW,
      },
      {
        // demo-event-012 (J-7) — victoire 3-1
        id: 'demo-ms-012', event_id: 'demo-event-012', sport: 'Football',
        score_home: 3, score_away: 1, status: 'final',
        score_detail: {}, man_of_match: 'Lucas Morel', validated_by: null, validated_at: null,
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
      { id: 'demo-cm-001', club_id: DEMO_CLUB_ID, email: 'demo@sportlink.app',          role: 'manager',     name: 'Alexandre Martin', status: 'active', user_id: DEMO_USER_ID, added_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
      { id: 'demo-cm-002', club_id: DEMO_CLUB_ID, email: 'coach@fc-sportlink.app',      role: 'editor',      name: 'Bastien Tilly',    status: 'active', user_id: null,         added_at: '2026-01-16T10:00:00Z', updated_at: '2026-01-16T10:00:00Z' },
      { id: 'demo-cm-003', club_id: DEMO_CLUB_ID, email: 'comm@fc-sportlink.app',       role: 'communicant', name: 'Sophie Kerboas',   status: 'active', user_id: null,         added_at: '2026-01-17T10:00:00Z', updated_at: '2026-01-17T10:00:00Z' },
      { id: 'demo-cm-004', club_id: DEMO_CLUB_ID, email: 'entraineur@fc-sportlink.app', role: 'editor',      name: 'Marc Derrien',     status: 'active', user_id: null,         added_at: '2026-01-18T10:00:00Z', updated_at: '2026-01-18T10:00:00Z' },
    ],

    club_follows: [..._demoFollowsWithUser],
    club_media_assets: [],

    // ── Favoris — demo user + spectateurs fictifs ─────────────────────────────
    favorites: [
      { user_id: DEMO_USER_ID,      event_id: 'demo-event-001', created_at: NOW },
      { user_id: DEMO_USER_ID,      event_id: 'demo-event-003', created_at: NOW },
      { user_id: DEMO_USER_ID,      event_id: 'demo-event-006', created_at: NOW },
      { user_id: 'fake-fan-001',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-002',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-003',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-004',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-005',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-001',    event_id: 'demo-event-003', created_at: NOW },
      { user_id: 'fake-fan-002',    event_id: 'demo-event-003', created_at: NOW },
      { user_id: 'fake-fan-006',    event_id: 'demo-event-004', created_at: NOW },
      { user_id: 'fake-fan-007',    event_id: 'demo-event-002', created_at: NOW },
    ],

    // ── Attendees ("J'y serai") — demo user + supporters ─────────────────────
    attendees: [
      { user_id: DEMO_USER_ID,      event_id: 'demo-event-001', created_at: NOW },
      { user_id: DEMO_USER_ID,      event_id: 'demo-event-003', created_at: NOW },
      { user_id: 'fake-fan-001',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-002',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-003',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-004',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-005',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-006',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-007',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-008',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-009',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-010',    event_id: 'demo-event-001', created_at: NOW },
      { user_id: 'fake-fan-001',    event_id: 'demo-event-003', created_at: NOW },
      { user_id: 'fake-fan-002',    event_id: 'demo-event-003', created_at: NOW },
      { user_id: 'fake-fan-003',    event_id: 'demo-event-003', created_at: NOW },
      { user_id: 'fake-fan-004',    event_id: 'demo-event-003', created_at: NOW },
      { user_id: 'fake-fan-001',    event_id: 'demo-event-006', created_at: NOW },
      { user_id: 'fake-fan-002',    event_id: 'demo-event-006', created_at: NOW },
      { user_id: 'fake-fan-001',    event_id: 'demo-event-004', created_at: NOW },
    ],

    // ── Commentaires — matchs récents / à venir ───────────────────────────────
    // profiles: { name } est pré-intégré car demoClient ne résout pas les joins
    event_comments: [
      // match J+4 vs AS Plougastel (demo-event-001)
      { id: 'demo-com-001', event_id: 'demo-event-001', user_id: 'fake-fan-001', content: 'Allez les gars ! On compte sur vous samedi 💪', created_at: new Date(Date.now() - 3 * 3600000).toISOString(), profiles: { name: 'Thomas Le Gall' } },
      { id: 'demo-com-002', event_id: 'demo-event-001', user_id: 'fake-fan-002', content: 'J\'y serai avec toute la famille ! Bonne chance à l\'équipe 🙌', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), profiles: { name: 'Marie Tanguy' } },
      { id: 'demo-com-003', event_id: 'demo-event-001', user_id: 'fake-fan-003', content: 'Plougastel est redoutable cette saison mais on a les ressources pour les battre', created_at: new Date(Date.now() - 90 * 60000).toISOString(), profiles: { name: 'Yannick Kervella' } },
      { id: 'demo-com-004', event_id: 'demo-event-001', user_id: DEMO_USER_ID,   content: 'L\'équipe est prête. La séance vidéo d\'hier a bien préparé les joueurs 🎯', created_at: new Date(Date.now() - 45 * 60000).toISOString(), profiles: { name: 'Alexandre Martin' } },
      { id: 'demo-com-005', event_id: 'demo-event-001', user_id: 'fake-fan-004', content: 'Coupe de Bretagne + championnat en même semaine... mangez des pâtes les gars 😄', created_at: new Date(Date.now() - 20 * 60000).toISOString(), profiles: { name: 'Gaël Prigent' } },
      { id: 'demo-com-006', event_id: 'demo-event-001', user_id: 'fake-fan-005', content: 'RDV samedi au stade à 14h30 ! Qui apporte des drapeaux ?', created_at: new Date(Date.now() - 8 * 60000).toISOString(), profiles: { name: 'Céline Morvant' } },

      // match passé victoire 3-1 (demo-event-012)
      { id: 'demo-com-007', event_id: 'demo-event-012', user_id: 'fake-fan-001', content: 'VICTOIRE 3-1 ! Quelle performance collective 🏆🔥', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), profiles: { name: 'Thomas Le Gall' } },
      { id: 'demo-com-008', event_id: 'demo-event-012', user_id: 'fake-fan-006', content: 'Lucas Morel, homme du match mérité. Quel match pour lui !', created_at: new Date(Date.now() - 7 * 86400000 + 3600000).toISOString(), profiles: { name: 'Florian Bodennec' } },
      { id: 'demo-com-009', event_id: 'demo-event-012', user_id: DEMO_USER_ID,   content: 'Bravo à tous. 3 points précieux en vue du top 3. On continue 💪', created_at: new Date(Date.now() - 7 * 86400000 + 7200000).toISOString(), profiles: { name: 'Alexandre Martin' } },
      { id: 'demo-com-010', event_id: 'demo-event-012', user_id: 'fake-fan-007', content: 'Ambiance de feu au stade ce soir, merci à tous les supporters présents !', created_at: new Date(Date.now() - 7 * 86400000 + 10800000).toISOString(), profiles: { name: 'Sonia Kerambrun' } },

      // tournoi U17 (demo-event-003)
      { id: 'demo-com-011', event_id: 'demo-event-003', user_id: 'fake-fan-008', content: 'Hâte de voir nos U17 en action ! Noa Kerguelen va régaler 🌟', created_at: new Date(Date.now() - 1 * 86400000).toISOString(), profiles: { name: 'Patrice Guégan' } },
      { id: 'demo-com-012', event_id: 'demo-event-003', user_id: 'fake-fan-009', content: '8 équipes, belle organisation. Bravo au club pour l\'initiative !', created_at: new Date(Date.now() - 18 * 3600000).toISOString(), profiles: { name: 'Isabelle Conan' } },
      { id: 'demo-com-013', event_id: 'demo-event-003', user_id: DEMO_USER_ID,   content: 'Restauration sur place dès 9h ! Bénévoles : merci de confirmer votre présence 🙏', created_at: new Date(Date.now() - 12 * 3600000).toISOString(), profiles: { name: 'Alexandre Martin' } },

      // match en direct (demo-event-016)
      { id: 'demo-com-014', event_id: 'demo-event-016', user_id: 'fake-fan-001', content: '2-1 !!! Superbe but de Julien Prigent en contre-attaque 🔥🔥🔥', created_at: new Date(Date.now() - 25 * 60000).toISOString(), profiles: { name: 'Thomas Le Gall' } },
      { id: 'demo-com-015', event_id: 'demo-event-016', user_id: 'fake-fan-010', content: 'Tenez bon, plus qu\'à tenir 20 min !!', created_at: new Date(Date.now() - 15 * 60000).toISOString(), profiles: { name: 'Loïc Nédélec' } },
      { id: 'demo-com-016', event_id: 'demo-event-016', user_id: 'fake-fan-002', content: 'ALLEZ FC SPORTLINK 💚💪 La ville est avec vous !', created_at: new Date(Date.now() - 5 * 60000).toISOString(), profiles: { name: 'Marie Tanguy' } },
    ],

    // ── Réactions emoji — uniquement les 3 emojis autorisés par le CHECK DB : 👏 🔥 💪
    event_reactions: [
      // match à venir J+4
      { event_id: 'demo-event-001', user_id: 'fake-fan-001', emoji: '💪' },
      { event_id: 'demo-event-001', user_id: 'fake-fan-002', emoji: '💪' },
      { event_id: 'demo-event-001', user_id: 'fake-fan-003', emoji: '💪' },
      { event_id: 'demo-event-001', user_id: 'fake-fan-004', emoji: '🔥' },
      { event_id: 'demo-event-001', user_id: 'fake-fan-005', emoji: '🔥' },
      { event_id: 'demo-event-001', user_id: 'fake-fan-006', emoji: '👏' },
      { event_id: 'demo-event-001', user_id: DEMO_USER_ID,   emoji: '💪' },
      // victoire 3-1
      { event_id: 'demo-event-012', user_id: 'fake-fan-001', emoji: '👏' },
      { event_id: 'demo-event-012', user_id: 'fake-fan-002', emoji: '👏' },
      { event_id: 'demo-event-012', user_id: 'fake-fan-003', emoji: '👏' },
      { event_id: 'demo-event-012', user_id: 'fake-fan-004', emoji: '🔥' },
      { event_id: 'demo-event-012', user_id: 'fake-fan-005', emoji: '🔥' },
      { event_id: 'demo-event-012', user_id: 'fake-fan-006', emoji: '💪' },
      { event_id: 'demo-event-012', user_id: 'fake-fan-007', emoji: '💪' },
      { event_id: 'demo-event-012', user_id: 'fake-fan-008', emoji: '👏' },
      { event_id: 'demo-event-012', user_id: DEMO_USER_ID,   emoji: '👏' },
      // match en direct
      { event_id: 'demo-event-016', user_id: 'fake-fan-001', emoji: '🔥' },
      { event_id: 'demo-event-016', user_id: 'fake-fan-009', emoji: '🔥' },
      { event_id: 'demo-event-016', user_id: 'fake-fan-010', emoji: '💪' },
      { event_id: 'demo-event-016', user_id: 'fake-fan-002', emoji: '👏' },
      // tournoi
      { event_id: 'demo-event-003', user_id: 'fake-fan-001', emoji: '💪' },
      { event_id: 'demo-event-003', user_id: 'fake-fan-002', emoji: '💪' },
      { event_id: 'demo-event-003', user_id: 'fake-fan-003', emoji: '👏' },
    ],

    // ── Événements mis en avant (featured gallery dans ClubFeed) ─────────────
    // Colonnes réelles : id, event_id, club_id, plan, priority, starts_at, ends_at
    // Les champs events:{...} et clubs:{...} sont pré-intégrés car demoClient ne résout pas les joins
    featured_events: [
      {
        id: 'demo-fe-001', event_id: 'demo-event-001', club_id: DEMO_CLUB_ID,
        plan: 'pro', priority: 10,
        starts_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        ends_at:   futureDate(5, 23),
        events: { id: 'demo-event-001', title: 'FC SportLink Démo vs AS Plougastel', date: futureDate(4, 15), sport: 'Football', venue: 'Stade Francis-Le Blé', city: 'Brest', team_name: 'FC SportLink Démo', adversaire: 'AS Plougastel', home_or_away: 'home' },
        clubs:  { name: 'FC SportLink Démo' },
      },
      {
        id: 'demo-fe-002', event_id: 'demo-event-002', club_id: DEMO_CLUB_ID,
        plan: 'pro', priority: 8,
        starts_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        ends_at:   futureDate(8, 23),
        events: { id: 'demo-event-002', title: 'Coupe : FC SportLink Démo @ Stade Brestois B', date: futureDate(7, 14), sport: 'Football', venue: "Stade de l'Elorn", city: 'Brest', team_name: 'Équipe 1', adversaire: 'Stade Brestois B', home_or_away: 'away' },
        clubs:  { name: 'FC SportLink Démo' },
      },
      {
        id: 'demo-fe-003', event_id: 'demo-event-003', club_id: DEMO_CLUB_ID,
        plan: 'elite', priority: 15,
        starts_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        ends_at:   futureDate(11, 23),
        events: { id: 'demo-event-003', title: 'Tournoi de la Pentecôte — Brest', date: futureDate(10, 9), sport: 'Football', venue: 'Complexe Sportif de la Cavale Blanche', city: 'Brest', team_name: 'U17', adversaire: '7 clubs bretons', home_or_away: 'home' },
        clubs:  { name: 'FC SportLink Démo' },
      },
    ],

    poster_exports:        [...demoPosterExports],
    posters:               [],
    club_ai_usage:         [{ club_id: DEMO_CLUB_ID, month: '2026-06-01', generate_count: 6 }],
    club_page_views:       [...demoPageViews],
    club_players:          [...demoPlayers, ...extraPlayers, ...francePlayers],
    push_subscriptions:    [],
    event_attendee_counts: [...demoAttendeesCounts],
    event_reaction_counts: [
      { event_id: 'demo-event-001', emoji: '💪', count: 3 },
      { event_id: 'demo-event-001', emoji: '🔥', count: 2 },
      { event_id: 'demo-event-001', emoji: '👏', count: 1 },
      { event_id: 'demo-event-012', emoji: '👏', count: 4 },
      { event_id: 'demo-event-012', emoji: '🔥', count: 2 },
      { event_id: 'demo-event-012', emoji: '💪', count: 2 },
      { event_id: 'demo-event-016', emoji: '🔥', count: 2 },
      { event_id: 'demo-event-016', emoji: '💪', count: 1 },
      { event_id: 'demo-event-016', emoji: '👏', count: 1 },
      { event_id: 'demo-event-003', emoji: '💪', count: 2 },
      { event_id: 'demo-event-003', emoji: '👏', count: 1 },
    ],
    event_photos:          [],
    event_predictions:     [],

    // ── Feedback communautaire — données pour le panel admin ─────────────────
    app_feedback: [
      { id: 'demo-fb-001', user_id: 'demo-follower-1',  type: 'idea',     title: 'Ajouter un calendrier partagé pour toute l\'équipe',              description: 'Permettre à tous les membres du club de voir le planning complet sur un seul écran, avec export Google Calendar/iCal.',     status: 'planned',    vote_count: 31, admin_note: 'Prévu pour la v2.5 — intégration Google Calendar en cours', created_at: new Date(Date.now() - 12 * 86400000).toISOString() },
      { id: 'demo-fb-002', user_id: 'demo-follower-2',  type: 'bug',      title: 'Les photos de l\'événement ne s\'affichent pas sur iOS 17',       description: 'Quand j\'ouvre la galerie photo d\'un match sur iPhone 14 iOS 17.4, les images ne chargent pas. Ça tourne indéfiniment.',           status: 'resolved',   vote_count: 18, admin_note: 'Corrigé en v1.8.2 — problème de cache CDN sur Safari', created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
      { id: 'demo-fb-003', user_id: 'demo-follower-3',  type: 'idea',     title: 'Intégrer les classements régionaux FFF en temps réel',            description: 'Afficher automatiquement le classement de notre ligue dans le tableau de bord du club. Plus besoin d\'aller sur fffoot.fr.',       status: 'in_dev',     vote_count: 47, admin_note: 'API FFF en cours d\'intégration — ETA fin juillet 2026', created_at: new Date(Date.now() - 18 * 86400000).toISOString() },
      { id: 'demo-fb-004', user_id: 'demo-follower-4',  type: 'question', title: 'Comment exporter les statistiques du club en PDF ?',             description: 'Je cherche comment générer un rapport mensuel avec les stats de présence et les résultats pour le présenter en AG.',               status: 'resolved',   vote_count: 12, admin_note: 'Guide ajouté dans la FAQ — bouton Export dans le dashboard', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: 'demo-fb-005', user_id: 'demo-follower-5',  type: 'idea',     title: 'Notification push pour les scores en direct',                    description: 'Recevoir une notif dès qu\'un but est marqué lors d\'un match en direct. Comme les apps de sport pro.',                          status: 'planned',    vote_count: 63, admin_note: 'Priorité haute — intégration Realtime + push prévue v2.6', created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
      { id: 'demo-fb-006', user_id: 'demo-follower-6',  type: 'bug',      title: 'Le bouton "Suivre" disparaît parfois sur la page club',          description: 'En rechargement rapide de la page club, le bouton Suivre n\'apparaît pas. Il faut scroller pour le voir apparaître.',              status: 'analyzing',  vote_count:  9, admin_note: null, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'demo-fb-007', user_id: 'demo-follower-7',  type: 'idea',     title: 'Partager les convocations directement sur WhatsApp',             description: 'Un bouton partage rapide depuis la liste de convocation pour envoyer la liste confirmée au groupe WhatsApp de l\'équipe.',       status: 'new',        vote_count: 29, admin_note: null, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      { id: 'demo-fb-008', user_id: 'demo-follower-8',  type: 'idea',     title: 'Mode sombre amélioré avec thème personnalisable par club',       description: 'Permettre aux clubs de choisir une couleur principale qui se répercute dans toute l\'interface. Immersion et identité visuelle.',   status: 'new',        vote_count: 22, admin_note: null, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    ],
    app_feedback_votes:    [],
    feedback_notifications: [
      {
        id: 'demo-fn-001', user_id: DEMO_USER_ID,
        feedback_id: 'demo-fb-001', feedback_type: 'idea',
        feedback_title: 'Ajouter un calendrier partagé pour toute l\'équipe',
        old_status: 'new', new_status: 'planned',
        read: false, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-fn-002', user_id: DEMO_USER_ID,
        feedback_id: 'demo-fb-002', feedback_type: 'bug',
        feedback_title: 'Les photos de l\'événement ne s\'affichent pas sur iOS',
        old_status: 'analyzing', new_status: 'resolved',
        read: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-fn-003', user_id: DEMO_USER_ID,
        feedback_id: 'demo-fb-003', feedback_type: 'idea',
        feedback_title: 'Intégrer les classements régionaux en temps réel',
        old_status: 'planned', new_status: 'in_dev',
        read: false, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    event_convocations:    [...demoConvocations],

    // ── Tuteurs légaux — demo user + 6 parents fictifs ───────────────────────
    player_guardians: [
      { id: 'demo-pg-001', player_id: 'demo-player-038', user_id: DEMO_USER_ID,     created_at: NOW },
      { id: 'demo-pg-002', player_id: 'demo-player-041', user_id: DEMO_USER_ID,     created_at: NOW },
      { id: 'demo-pg-003', player_id: 'demo-player-038', user_id: 'fake-parent-001', created_at: NOW }, // Catherine Creach / Liam
      { id: 'demo-pg-004', player_id: 'demo-player-037', user_id: 'fake-parent-002', created_at: NOW }, // Marc Tanguy / Théo
      { id: 'demo-pg-005', player_id: 'demo-player-041', user_id: 'fake-parent-003', created_at: NOW }, // Anne-Marie / Noa
      { id: 'demo-pg-006', player_id: 'demo-player-042', user_id: 'fake-parent-004', created_at: NOW }, // Ronan Jézéquel / Titouan
      { id: 'demo-pg-007', player_id: 'demo-player-054', user_id: 'fake-parent-005', created_at: NOW }, // Isabelle Bodilis / Maël U15
      { id: 'demo-pg-008', player_id: 'demo-player-057', user_id: 'fake-parent-006', created_at: NOW }, // Stéphane Mével / Luc U15
    ],

    club_challenges: [
      {
        id: 'demo-ch-001', challenger_id: DEMO_CLUB_ID, challenged_id: 'demo-club-002',
        type: 'match', message: 'Un match amical avant la fin de saison ? On vous propose un Football vs Rugby 6-a-side !',
        status: 'pending', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), responded_at: null,
        challenger: { id: DEMO_CLUB_ID, name: 'FC SportLink Démo', logo_url: null, sport: 'Football' },
        challenged: { id: 'demo-club-002', name: 'Stade Rennais Rugby', logo_url: null, sport: 'Rugby' },
      },
      {
        id: 'demo-ch-002', challenger_id: 'demo-club-003', challenged_id: DEMO_CLUB_ID,
        type: 'match', message: 'Challenge inter-clubs ! Basket vs Football — qui est le plus athlétique ?',
        status: 'accepted', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), responded_at: new Date(Date.now() - 6 * 86400000).toISOString(),
        challenger: { id: 'demo-club-003', name: 'Brest Basket Armorique', logo_url: null, sport: 'Basketball' },
        challenged: { id: DEMO_CLUB_ID, name: 'FC SportLink Démo', logo_url: null, sport: 'Football' },
      },
    ],

    // ── Présences entraînements ────────────────────────────────────────────────
    // Demo user + joueurs fictifs pour alimenter AttendanceListSheet
    training_attendance: [
      // demo-ts-001 (Équipe 1, aujourd'hui) — 14 présents, 3 absents, 2 incertains
      { id: 'demo-ta-001', session_id: 'demo-ts-001', user_id: DEMO_USER_ID,     status: 'present', updated_at: NOW },
      { id: 'demo-ta-002', session_id: 'demo-ts-001', user_id: 'fake-user-p02',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-003', session_id: 'demo-ts-001', user_id: 'fake-user-p03',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-004', session_id: 'demo-ts-001', user_id: 'fake-user-p04',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-005', session_id: 'demo-ts-001', user_id: 'fake-user-p06',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-006', session_id: 'demo-ts-001', user_id: 'fake-user-p07',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-007', session_id: 'demo-ts-001', user_id: 'fake-user-p08',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-008', session_id: 'demo-ts-001', user_id: 'fake-user-p09',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-009', session_id: 'demo-ts-001', user_id: 'fake-user-p10',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-010', session_id: 'demo-ts-001', user_id: 'fake-user-p11',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-011', session_id: 'demo-ts-001', user_id: 'fake-user-p12',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-012', session_id: 'demo-ts-001', user_id: 'fake-user-p14',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-013', session_id: 'demo-ts-001', user_id: 'fake-user-p15',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-014', session_id: 'demo-ts-001', user_id: 'fake-user-p17',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-015', session_id: 'demo-ts-001', user_id: 'fake-user-p05',  status: 'absent',  updated_at: NOW },
      { id: 'demo-ta-016', session_id: 'demo-ts-001', user_id: 'fake-user-p13',  status: 'absent',  updated_at: NOW },
      { id: 'demo-ta-017', session_id: 'demo-ts-001', user_id: 'fake-user-p16',  status: 'absent',  updated_at: NOW },
      { id: 'demo-ta-018', session_id: 'demo-ts-001', user_id: 'fake-user-p18',  status: 'unsure',  updated_at: NOW },
      { id: 'demo-ta-019', session_id: 'demo-ts-001', user_id: 'fake-user-p19',  status: 'unsure',  updated_at: NOW },
      // demo-ts-002 (U17, aujourd'hui) — demo user absent
      { id: 'demo-ta-020', session_id: 'demo-ts-002', user_id: DEMO_USER_ID,     status: 'absent',  updated_at: NOW },
      { id: 'demo-ta-021', session_id: 'demo-ts-002', user_id: 'fake-user-u17-01', status: 'present', updated_at: NOW },
      { id: 'demo-ta-022', session_id: 'demo-ts-002', user_id: 'fake-user-u17-02', status: 'present', updated_at: NOW },
      { id: 'demo-ta-023', session_id: 'demo-ts-002', user_id: 'fake-user-u17-03', status: 'present', updated_at: NOW },
      { id: 'demo-ta-024', session_id: 'demo-ts-002', user_id: 'fake-user-u17-04', status: 'present', updated_at: NOW },
      { id: 'demo-ta-025', session_id: 'demo-ts-002', user_id: 'fake-user-u17-05', status: 'present', updated_at: NOW },
      { id: 'demo-ta-026', session_id: 'demo-ts-002', user_id: 'fake-user-u17-06', status: 'present', updated_at: NOW },
      { id: 'demo-ta-027', session_id: 'demo-ts-002', user_id: 'fake-user-u17-07', status: 'present', updated_at: NOW },
      { id: 'demo-ta-028', session_id: 'demo-ts-002', user_id: 'fake-user-u17-08', status: 'unsure',  updated_at: NOW },
      // demo-ts-003 (Réserve, aujourd'hui) — demo user incertain
      { id: 'demo-ta-029', session_id: 'demo-ts-003', user_id: DEMO_USER_ID,     status: 'unsure',  updated_at: NOW },
      { id: 'demo-ta-030', session_id: 'demo-ts-003', user_id: 'fake-user-res-01', status: 'present', updated_at: NOW },
      { id: 'demo-ta-031', session_id: 'demo-ts-003', user_id: 'fake-user-res-02', status: 'present', updated_at: NOW },
      { id: 'demo-ta-032', session_id: 'demo-ts-003', user_id: 'fake-user-res-03', status: 'present', updated_at: NOW },
      { id: 'demo-ta-033', session_id: 'demo-ts-003', user_id: 'fake-user-res-04', status: 'present', updated_at: NOW },
      { id: 'demo-ta-034', session_id: 'demo-ts-003', user_id: 'fake-user-res-05', status: 'absent',  updated_at: NOW },
      // demo-ts-004 (Équipe 1, J+2) — demo user présent
      { id: 'demo-ta-035', session_id: 'demo-ts-004', user_id: DEMO_USER_ID,     status: 'present',  updated_at: NOW },
      { id: 'demo-ta-036', session_id: 'demo-ts-004', user_id: 'fake-user-p02',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-037', session_id: 'demo-ts-004', user_id: 'fake-user-p03',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-038', session_id: 'demo-ts-004', user_id: 'fake-user-p04',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-039', session_id: 'demo-ts-004', user_id: 'fake-user-p06',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-040', session_id: 'demo-ts-004', user_id: 'fake-user-p07',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-041', session_id: 'demo-ts-004', user_id: 'fake-user-p08',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-042', session_id: 'demo-ts-004', user_id: 'fake-user-p09',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-043', session_id: 'demo-ts-004', user_id: 'fake-user-p10',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-044', session_id: 'demo-ts-004', user_id: 'fake-user-p11',   status: 'present',  updated_at: NOW },
      { id: 'demo-ta-045', session_id: 'demo-ts-004', user_id: 'fake-user-p05',   status: 'absent',   updated_at: NOW },
      { id: 'demo-ta-046', session_id: 'demo-ts-004', user_id: 'fake-user-p12',   status: 'absent',   updated_at: NOW },
      { id: 'demo-ta-047', session_id: 'demo-ts-004', user_id: 'fake-user-p13',   status: 'unsure',   updated_at: NOW },

      // ── demo-ts-005 (U17, J+2) — joueurs + parents répondent ─────────────────
      { id: 'demo-ta-048', session_id: 'demo-ts-005', user_id: 'fake-user-u17-03', status: 'present', updated_at: NOW },
      { id: 'demo-ta-049', session_id: 'demo-ts-005', user_id: 'fake-user-u17-04', status: 'present', updated_at: NOW },
      { id: 'demo-ta-050', session_id: 'demo-ts-005', user_id: 'fake-user-u17-07', status: 'present', updated_at: NOW },
      { id: 'demo-ta-051', session_id: 'demo-ts-005', user_id: 'fake-user-u17-08', status: 'absent',  updated_at: NOW },
      // Parents répondant pour leurs enfants U17
      { id: 'demo-ta-052', session_id: 'demo-ts-005', user_id: 'fake-parent-001', player_id: 'demo-player-038', responded_by: 'fake-parent-001', status: 'present', updated_at: NOW },
      { id: 'demo-ta-053', session_id: 'demo-ts-005', user_id: 'fake-parent-002', player_id: 'demo-player-037', responded_by: 'fake-parent-002', status: 'present', updated_at: NOW },
      { id: 'demo-ta-054', session_id: 'demo-ts-005', user_id: 'fake-parent-003', player_id: 'demo-player-041', responded_by: 'fake-parent-003', status: 'unsure',  updated_at: NOW },
      { id: 'demo-ta-055', session_id: 'demo-ts-005', user_id: 'fake-parent-004', player_id: 'demo-player-042', responded_by: 'fake-parent-004', status: 'present', updated_at: NOW },

      // ── demo-ts-006 (Équipe 1, J+4) ─────────────────────────────────────────
      { id: 'demo-ta-056', session_id: 'demo-ts-006', user_id: 'fake-user-p02',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-057', session_id: 'demo-ts-006', user_id: 'fake-user-p03',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-058', session_id: 'demo-ts-006', user_id: 'fake-user-p04',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-059', session_id: 'demo-ts-006', user_id: 'fake-user-p05',  status: 'absent',  updated_at: NOW },
      { id: 'demo-ta-060', session_id: 'demo-ts-006', user_id: 'fake-user-p06',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-061', session_id: 'demo-ts-006', user_id: 'fake-user-p07',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-062', session_id: 'demo-ts-006', user_id: 'fake-user-p09',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-063', session_id: 'demo-ts-006', user_id: 'fake-user-p11',  status: 'absent',  updated_at: NOW },
      { id: 'demo-ta-064', session_id: 'demo-ts-006', user_id: 'fake-user-p13',  status: 'unsure',  updated_at: NOW },
      { id: 'demo-ta-065', session_id: 'demo-ts-006', user_id: 'fake-user-p14',  status: 'present', updated_at: NOW },

      // ── demo-ts-007 (Équipe F, J+4) ─────────────────────────────────────────
      { id: 'demo-ta-066', session_id: 'demo-ts-007', user_id: 'fake-user-f-01', status: 'present', updated_at: NOW },
      { id: 'demo-ta-067', session_id: 'demo-ts-007', user_id: 'fake-user-f-02', status: 'present', updated_at: NOW },
      { id: 'demo-ta-068', session_id: 'demo-ts-007', user_id: 'fake-user-f-03', status: 'present', updated_at: NOW },
      { id: 'demo-ta-069', session_id: 'demo-ts-007', user_id: 'fake-user-f-04', status: 'absent',  updated_at: NOW },

      // ── demo-ts-008 (Équipe 1, J+9) — quelques réponses anticipées ───────────
      { id: 'demo-ta-070', session_id: 'demo-ts-008', user_id: 'fake-user-p02',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-071', session_id: 'demo-ts-008', user_id: 'fake-user-p04',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-072', session_id: 'demo-ts-008', user_id: 'fake-user-p07',  status: 'present', updated_at: NOW },
      { id: 'demo-ta-073', session_id: 'demo-ts-008', user_id: 'fake-user-p09',  status: 'present', updated_at: NOW },

      // ── demo-ts-009 (U17, J+11) — joueurs + parents pour blessure/prévision ──
      { id: 'demo-ta-074', session_id: 'demo-ts-009', user_id: 'fake-user-u17-01', status: 'present', updated_at: NOW },
      { id: 'demo-ta-075', session_id: 'demo-ts-009', user_id: 'fake-user-u17-03', status: 'present', updated_at: NOW },
      { id: 'demo-ta-076', session_id: 'demo-ts-009', user_id: 'fake-user-u17-05', status: 'present', updated_at: NOW },
      { id: 'demo-ta-077', session_id: 'demo-ts-009', user_id: 'fake-user-u17-08', status: 'absent',  updated_at: NOW },
      { id: 'demo-ta-078', session_id: 'demo-ts-009', user_id: 'fake-parent-001', player_id: 'demo-player-038', responded_by: 'fake-parent-001', status: 'present', updated_at: NOW },
      { id: 'demo-ta-079', session_id: 'demo-ts-009', user_id: 'fake-parent-004', player_id: 'demo-player-042', responded_by: 'fake-parent-004', status: 'absent',  updated_at: NOW },
    ],

    // ── Présences matchs ────────────────────────────────────────────────────────
    match_player_attendance: [
      { id: 'demo-mpa-001', event_id: 'demo-event-001', user_id: DEMO_USER_ID,    status: 'present', updated_at: NOW },
      { id: 'demo-mpa-002', event_id: 'demo-event-001', user_id: 'fake-user-p02', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-003', event_id: 'demo-event-001', user_id: 'fake-user-p03', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-004', event_id: 'demo-event-001', user_id: 'fake-user-p04', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-005', event_id: 'demo-event-001', user_id: 'fake-user-p06', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-006', event_id: 'demo-event-001', user_id: 'fake-user-p07', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-007', event_id: 'demo-event-001', user_id: 'fake-user-p08', status: 'absent',  updated_at: NOW },
      { id: 'demo-mpa-008', event_id: 'demo-event-001', user_id: 'fake-user-p09', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-009', event_id: 'demo-event-001', user_id: 'fake-user-p10', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-010', event_id: 'demo-event-001', user_id: 'fake-user-p11', status: 'absent',  updated_at: NOW },
      { id: 'demo-mpa-011', event_id: 'demo-event-001', user_id: 'fake-user-p12', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-012', event_id: 'demo-event-001', user_id: 'fake-user-p13', status: 'unsure',  updated_at: NOW },
      { id: 'demo-mpa-013', event_id: 'demo-event-006', user_id: DEMO_USER_ID,    status: 'present', updated_at: NOW },
      { id: 'demo-mpa-014', event_id: 'demo-event-006', user_id: 'fake-user-u17-01', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-015', event_id: 'demo-event-006', user_id: 'fake-user-u17-02', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-016', event_id: 'demo-event-006', user_id: 'fake-user-u17-03', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-017', event_id: 'demo-event-006', user_id: 'fake-user-u17-04', status: 'absent',  updated_at: NOW },
      { id: 'demo-mpa-018', event_id: 'demo-event-007', user_id: DEMO_USER_ID,    status: 'unsure',  updated_at: NOW },
      { id: 'demo-mpa-019', event_id: 'demo-event-007', user_id: 'fake-user-f-01', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-020', event_id: 'demo-event-007', user_id: 'fake-user-f-02', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-021', event_id: 'demo-event-007', user_id: 'fake-user-f-03', status: 'present', updated_at: NOW },
      { id: 'demo-mpa-022', event_id: 'demo-event-007', user_id: 'fake-user-f-04', status: 'absent',  updated_at: NOW },
    ],

    // ── Vues agrégées simulées (SECURITY DEFINER dans la vraie DB) ────────────
    // Calculées à partir des tableaux ci-dessus pour rester cohérentes
    training_attendance_counts: [],
    match_attendance_counts:    [],

    // ── Abonnements club (plan actif) ──────────────────────────────────────────
    club_subscriptions: [
      {
        id: 'demo-sub-001', club_id: DEMO_CLUB_ID, plan: 'pro',
        stripe_customer_id: null, stripe_subscription_id: null,
        status: 'active', current_period_start: '2026-06-01T00:00:00Z',
        current_period_end: '2027-06-01T00:00:00Z', cancel_at_period_end: false,
        created_at: '2026-06-01T00:00:00Z', updated_at: NOW,
      },
    ],
  };

  // ── Post-processing : embed FK joins (demoClient ne les résout pas) ──────────

  // Profiles dans les présences
  tables.training_attendance = tables.training_attendance.map(e => ({
    ...e,
    profiles: PROFILE_MAP[e.user_id] ?? null,
  }));
  tables.match_player_attendance = tables.match_player_attendance.map(e => ({
    ...e,
    profiles: PROFILE_MAP[e.user_id] ?? null,
  }));

  // Nom du club dans tous les événements
  const clubNameById: Record<string, string> = {};
  for (const c of tables.clubs) clubNameById[String(c.id)] = c.name;
  tables.events = tables.events.map(e => ({
    ...e,
    clubs: { name: clubNameById[String(e.club_id)] ?? '' },
  }));

  // Passagers complets dans chaque ride (noms, statuts, messages…)
  // Le demoClient re-joint dynamiquement à chaque requête — ceci sert uniquement
  // au premier rendu synchrone avant le premier fetch.
  const rideReqsByRide: Record<string, any[]> = {};
  for (const req of tables.ride_requests) {
    if (!rideReqsByRide[req.ride_id]) rideReqsByRide[req.ride_id] = [];
    rideReqsByRide[req.ride_id].push(req);
  }
  tables.rides = tables.rides.map(r => ({
    ...r,
    ride_requests: rideReqsByRide[r.id] ?? [],
  }));

  // Calcul des compteurs agrégés à partir des données brutes
  const taAgg = {};
  tables.training_attendance.forEach(a => {
    if (!taAgg[a.session_id]) taAgg[a.session_id] = { session_id: a.session_id, present_count: 0, absent_count: 0, unsure_count: 0, total_count: 0 };
    taAgg[a.session_id][a.status + '_count']++;
    taAgg[a.session_id].total_count++;
  });
  tables.training_attendance_counts = Object.values(taAgg);

  const maAgg = {};
  tables.match_player_attendance.forEach(a => {
    if (!maAgg[a.event_id]) maAgg[a.event_id] = { event_id: a.event_id, present_count: 0, absent_count: 0, unsure_count: 0, total_count: 0 };
    maAgg[a.event_id][a.status + '_count']++;
    maAgg[a.event_id].total_count++;
  });
  tables.match_attendance_counts = Object.values(maAgg);

  return tables;
}
