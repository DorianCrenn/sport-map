import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// ── Mock Supabase ─────────────────────────────────────────────────────────────

const mockOnAuthStateChange = vi.hoisted(() => vi.fn());
const mockFrom              = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: mockFrom,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProfileQuery(profile) {
  const p = Promise.resolve({ data: profile, error: null });
  return {
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(() => p),
    insert:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    is:          vi.fn().mockReturnThis(),
    then:        (fn, rej) => p.then(fn, rej),
    catch:       (fn)      => p.catch(fn),
  };
}

// Returns a query that rejects on maybeSingle() but resolves null on .then()
// (so club_follows / club_managers chains don't create unhandled rejections)
function makeRejectingQuery(msg) {
  const rejection = Promise.reject(new Error(msg));
  rejection.catch(() => {}); // suppress unhandled rejection
  const safe = Promise.resolve({ data: null, error: { message: msg } });
  return {
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(() => rejection),
    insert:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    is:          vi.fn().mockReturnThis(),
    then:        (fn, rej) => safe.then(fn, rej),
    catch:       (fn)      => safe.catch(fn),
  };
}

const MOCK_USER = {
  id: 'u1', email: 'test@test.fr',
  created_at: '2026-01-01', user_metadata: {},
};

const MOCK_PROFILE = {
  id: 'u1', name: 'Test User', role: 'user',
  favorite_sports: [], followed_clubs: [],
  onboarding_done: false, badges: [], plan: 'free', xp: 0,
};

// Renders AuthProvider and exposes a consumer that displays loading state
import { AuthProvider, useAuth } from '../../contexts/AuthContext.jsx';

function TestConsumer() {
  const { loading, currentUser } = useAuth();
  if (loading) return <span>loading</span>;
  return <span>{currentUser ? currentUser.email : 'no-user'}</span>;
}

function renderAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthContext — résilience réseau et failsafes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no pending manager, no club_players entry
    mockFrom.mockImplementation(() => makeProfileQuery(null));
  });

  it('failsafe 8s : loading false si onAuthStateChange ne fire jamais', async () => {
    mockOnAuthStateChange.mockImplementationOnce(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));

    vi.useFakeTimers();
    renderAuth();
    expect(screen.getByText('loading')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(8500); });
    expect(screen.queryByText('loading')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('profiles inaccessible → loading false, app ne crashe pas', async () => {
    mockOnAuthStateChange.mockImplementationOnce((cb) => {
      Promise.resolve().then(() => cb('SIGNED_IN', { user: MOCK_USER }));
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    mockFrom.mockImplementation(() => makeRejectingQuery('connection refused'));

    renderAuth();
    // With the finally fix, done() is always called — wait up to 10s for failsafe
    await waitFor(
      () => expect(screen.queryByText('loading')).not.toBeInTheDocument(),
      { timeout: 12000 }
    );
  });

  it('connexion normale → currentUser chargé, loading false', async () => {
    mockOnAuthStateChange.mockImplementationOnce((cb) => {
      Promise.resolve().then(() => cb('SIGNED_IN', { user: MOCK_USER }));
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    // club_follows needs array data; other tables (profiles, club_managers, club_players) get profile object or null
    mockFrom.mockImplementation((table) => {
      if (table === 'club_follows') {
        const p = Promise.resolve({ data: [], error: null });
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), then: (fn, rej) => p.then(fn, rej), catch: (fn) => p.catch(fn) };
      }
      return makeProfileQuery(table === 'profiles' ? MOCK_PROFILE : null);
    });

    renderAuth();
    await waitFor(
      () => expect(screen.queryByText('loading')).not.toBeInTheDocument(),
      { timeout: 5000 }
    );
    expect(screen.getByText(MOCK_USER.email)).toBeInTheDocument();
  });
});
