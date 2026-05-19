import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── vi.hoisted : mocks disponibles avant le hoist de vi.mock ─────────────────
const { mockOnAuthStateChange, mockSignIn, mockFrom } = vi.hoisted(() => ({
  // Par défaut : appelle immédiatement le callback avec session=null (non connecté)
  // → AuthContext appelle done() → loading passe à false sans attendre 8s
  mockOnAuthStateChange: vi.fn((cb) => {
    Promise.resolve().then(() => cb('INITIAL_SESSION', null));
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }),
  mockSignIn: vi.fn().mockResolvedValue({ data: null, error: null }),
  mockFrom:   vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    auth: {
      onAuthStateChange:     mockOnAuthStateChange,
      getSession:            vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword:    mockSignIn,
      signUp:                vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut:               vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
    from: mockFrom,
  },
}));

import { AuthProvider, useAuth } from '../../contexts/AuthContext.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProfileQuery(profile = null) {
  return {
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
    update:      vi.fn().mockReturnThis(),
    insert:      vi.fn().mockReturnThis(),
    then:        (fn) => Promise.resolve({ data: null, error: null }).then(fn),
  };
}

function AuthProbe() {
  const { currentUser, isAdmin, isClubAdmin, isLoggedIn, loading } = useAuth();
  if (loading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="logged-in">{String(isLoggedIn)}</span>
      <span data-testid="is-admin">{String(isAdmin)}</span>
      <span data-testid="is-club-admin">{String(isClubAdmin)}</span>
      <span data-testid="role">{currentUser?.role ?? 'none'}</span>
      <span data-testid="name">{currentUser?.name ?? 'none'}</span>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );
}

function simulateSession(role = 'user', name = 'DB Name') {
  mockOnAuthStateChange.mockImplementationOnce((cb) => {
    Promise.resolve().then(() =>
      cb('SIGNED_IN', {
        user: {
          id: 'user-42',
          email: 'test@sportlink.fr',
          created_at: '2026-01-01T00:00:00Z',
          user_metadata: { name: 'Meta Name' },
        },
      })
    );
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mockFrom.mockReturnValue(makeProfileQuery({
    name, role,
    favorite_sports: [], followed_clubs: [],
    onboarding_done: false, badges: [],
  }));
}

// ── Tests — état non connecté ─────────────────────────────────────────────────

describe('AuthContext — utilisateur non connecté', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue(makeProfileQuery(null));
  });

  it('isLoggedIn est false par défaut', async () => {
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('logged-in').textContent).toBe('false');
  });

  it('isAdmin est false par défaut', async () => {
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('is-admin').textContent).toBe('false');
  });

  it('isClubAdmin est false par défaut', async () => {
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('is-club-admin').textContent).toBe('false');
  });
});

// ── Tests — mapProfile avec session active ────────────────────────────────────

describe('AuthContext — mapProfile avec session active', () => {
  it('utilise le nom du profil DB en priorité', async () => {
    simulateSession('user', 'DB Name');
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('name').textContent).toBe('DB Name');
  });

  it('isLoggedIn est true quand la session est active', async () => {
    simulateSession('user');
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('logged-in').textContent).toBe('true');
  });
});

// ── Tests — dérivation des rôles ──────────────────────────────────────────────

describe('AuthContext — rôles', () => {
  it('role "admin" → isAdmin true, isClubAdmin false', async () => {
    simulateSession('admin');
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('is-admin').textContent).toBe('true');
    expect(screen.getByTestId('is-club-admin').textContent).toBe('false');
  });

  it('role "superadmin" → isAdmin true', async () => {
    simulateSession('superadmin');
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('is-admin').textContent).toBe('true');
  });

  it('role "club_admin" → isClubAdmin true, isAdmin false', async () => {
    simulateSession('club_admin');
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('is-club-admin').textContent).toBe('true');
    expect(screen.getByTestId('is-admin').textContent).toBe('false');
  });

  it('role "user" → isAdmin false, isClubAdmin false', async () => {
    simulateSession('user');
    renderAuth();
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByTestId('is-admin').textContent).toBe('false');
    expect(screen.getByTestId('is-club-admin').textContent).toBe('false');
  });
});

// ── Tests — messages d'erreur login ──────────────────────────────────────────

describe('AuthContext — login : messages d\'erreur traduits', () => {
  function LoginButton() {
    const { login } = useAuth();
    const [msg, setMsg] = React.useState('');
    return (
      <>
        <button onClick={async () => {
          try { await login('a@a.fr', 'wrong'); }
          catch (e) { setMsg(e.message); }
        }}>Login</button>
        <span data-testid="error">{msg}</span>
      </>
    );
  }

  it('traduit "Invalid login credentials"', async () => {
    mockFrom.mockReturnValue(makeProfileQuery(null));
    mockSignIn.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() =>
      expect(screen.getByTestId('error').textContent).toBe('Email ou mot de passe incorrect')
    );
  });

  it('traduit "Email not confirmed"', async () => {
    mockFrom.mockReturnValue(makeProfileQuery(null));
    mockSignIn.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email not confirmed' },
    });

    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() =>
      expect(screen.getByTestId('error').textContent).toContain('Confirmez votre email')
    );
  });
});

// ── Tests — useAuth hors contexte ─────────────────────────────────────────────

describe('AuthContext — useAuth hors provider', () => {
  it('lève une erreur si useAuth utilisé hors AuthProvider', () => {
    function Bad() { useAuth(); return null; }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});
