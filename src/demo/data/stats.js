import { DEMO_CLUB_ID } from './club.js';

export const demoStats = {
  clubId:   DEMO_CLUB_ID,
  followers: 342,
  viewsByWeek: [
    { week: 'S-7', count: 23 },
    { week: 'S-6', count: 31 },
    { week: 'S-5', count: 18 },
    { week: 'S-4', count: 42 },
    { week: 'S-3', count: 38 },
    { week: 'S-2', count: 29 },
    { week: 'S-1', count: 45 },
    { week: 'Cette semaine', count: 12 },
  ],
  topEvents: [
    { event_id: 'demo-event-012', count: 31 },
    { event_id: 'demo-event-001', count: 28 },
    { event_id: 'demo-event-013', count: 19 },
    { event_id: 'demo-event-003', count: 22 },
    { event_id: 'demo-event-004', count: 12 },
  ],
  posterExports:  6,
  socialShares:   18,
  newFollowersThisMonth: 24,
};

// Pour useClubPageViews — format attendu par le hook
export const demoPageViews = Array.from({ length: 8 }, (_, i) => ({
  id:       `demo-pv-${i}`,
  club_id:  DEMO_CLUB_ID,
  week_start: new Date(Date.now() - (7 - i) * 7 * 86400000).toISOString().slice(0, 10),
  count:    demoStats.viewsByWeek[i]?.count ?? 0,
}));

// Pour useClubDashboard — poster_exports du mois
export const demoPosterExports = Array.from({ length: 6 }, (_, i) => ({
  id:         `demo-pe-${i}`,
  club_id:    DEMO_CLUB_ID,
  event_id:   `demo-event-0${(i % 8) + 1}`,
  user_id:    'demo-user-001',
  format:     ['story', 'square', 'landscape'][i % 3],
  channel:    ['whatsapp', 'instagram', 'facebook'][i % 3],
  created_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}));

// Pour useClubFollows — abonnés du club
export const demoClubFollows = Array.from({ length: 342 }, (_, i) => ({
  user_id:  `demo-follower-${i}`,
  club_id:  DEMO_CLUB_ID,
  teams:    'all',
  notif:    { match: true, news: true },
}));
