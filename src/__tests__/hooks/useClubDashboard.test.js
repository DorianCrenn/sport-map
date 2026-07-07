import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useClubDashboard } from '../../hooks/useClubDashboard.js';

const NOW = new Date().toISOString();
const VIEWS = [
  { viewed_at: NOW, user_id: 'a' },
  { viewed_at: NOW, user_id: 'a' },
  { viewed_at: NOW, user_id: 'b' },
];
const ATT = [
  { event_id: 'e1', count: 5 },
  { event_id: 'e2', count: 3 },
];
const ANNS = [{ id: 'an-1', title: 'Match reporté', message: '...', type: 'info' }];

function followerQuery() {
  const q = { select: () => q, eq: () => q, maybeSingle: () => Promise.resolve({ data: { follower_count: 42 } }) };
  return q;
}
function thenQuery(data) {
  const q = { select: () => q, eq: () => q, in: () => q, not: () => q, gte: () => q, order: () => q, limit: () => q, then: (fn) => Promise.resolve({ data }).then(fn) };
  return q;
}
function exportsQuery() {
  let isShares = false;
  const q = {
    select: () => q, eq: () => q, gte: () => q,
    in: () => { isShares = true; return q; },
    then: (fn) => Promise.resolve({ count: isShares ? 4 : 10 }).then(fn),
  };
  return q;
}

function wire() {
  mockFrom.mockImplementation((table) => {
    if (table === 'club_follower_counts')  return followerQuery();
    if (table === 'club_page_views')       return thenQuery(VIEWS);
    if (table === 'event_attendee_counts') return thenQuery(ATT);
    if (table === 'poster_exports')        return exportsQuery();
    if (table === 'club_announcements')    return thenQuery(ANNS);
    return thenQuery([]);
  });
}

beforeEach(() => { mockFrom.mockReset(); });

describe('useClubDashboard', () => {
  it('agrège followers, vues, présences, exports et annonces programmées', async () => {
    wire();
    const { result } = renderHook(() => useClubDashboard('club-1', ['e1', 'e2']));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.followers).toBe(42);
    expect(result.current.pageViews.total).toBe(3);
    expect(result.current.pageViews.distinctViewers).toBe(2);
    expect(result.current.attendees.total).toBe(8);
    expect(result.current.attendees.topEvents[0]).toMatchObject({ event_id: 'e1', count: 5 });
    expect(result.current.posterExports).toBe(10);
    expect(result.current.posterShares).toBe(4);
    expect(result.current.scheduledAnnouncements).toHaveLength(1);
  });

  it('valeurs par défaut si le follower_count est absent', async () => {
    function followerNull() {
      const q = { select: () => q, eq: () => q, maybeSingle: () => Promise.resolve({ data: null }) };
      return q;
    }
    mockFrom.mockImplementation((table) => {
      if (table === 'club_follower_counts') return followerNull();
      if (table === 'club_page_views')       return thenQuery([]);
      if (table === 'poster_exports')        return exportsQuery();
      if (table === 'club_announcements')    return thenQuery([]);
      return thenQuery([]);
    });
    const { result } = renderHook(() => useClubDashboard('club-1', []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.followers).toBe(0);
    expect(result.current.attendees.total).toBe(0);
  });
});
