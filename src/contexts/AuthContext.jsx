import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

// ── Mapping ──────────────────────────────────────────────────────────────────

function mapProfile(authUser, dbProfile) {
  if (!authUser) return null;
  const meta = authUser.user_metadata ?? {};
  return {
    id:             authUser.id,
    email:          authUser.email,
    name:           dbProfile?.name ?? meta.name ?? authUser.email?.split('@')[0] ?? '',
    role:           dbProfile?.role ?? 'user',
    avatar:         dbProfile?.avatar_url ?? null,
    favoriteSports: dbProfile?.favorite_sports ?? [],
    followedClubs:  dbProfile?.followed_clubs ?? [],
    clubId:         dbProfile?.club_id ?? null,
    onboardingDone: dbProfile?.onboarding_done ?? false,
    digestOptIn:    dbProfile?.digest_opt_in ?? false,
    authProvider:   dbProfile?.auth_provider ?? meta.authProvider ?? null,
    badges:         dbProfile?.badges ?? [],
    createdAt:      authUser.created_at,
  };
}

// ── Profile fetch with retry + fallback upsert ────────────────────────────────

async function fetchProfile(authUser) {
  const { id: userId } = authUser;

  // Retry: the DB trigger may take a moment to create the profile after signup
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // returns null (not error) when row doesn't exist

    if (data) return data;
    if (error) console.warn('[Auth] fetchProfile error:', error.message);
    if (attempt < 4) await new Promise(r => setTimeout(r, 500));
  }

  // Fallback: trigger didn't fire — create profile without overwriting existing data
  console.warn('[Auth] Profile not found after retries — creating fallback');
  const name = authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? '';
  await supabase
    .from('profiles')
    .insert({ id: userId, name })
    .then(() => {})
    .catch(() => {}); // Ignore conflict (profile may already exist)

  // Final fetch attempt after insert
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data ?? null;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  // follows = [{ clubId: string, teams: 'all' | string[], notif: { match: boolean, news: boolean } }]
  const [follows, setFollows] = useState([]);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    let resolved = false;
    let fetchSeq = 0; // guards against stale auth-event races

    const failsafe = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); }
    }, 8000);

    function done() {
      if (!resolved) { resolved = true; clearTimeout(failsafe); setLoading(false); }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // TOKEN_REFRESHED only rotates the JWT — profile hasn't changed and must NOT
        // increment fetchSeq or it would invalidate an in-flight INITIAL_SESSION fetch.
        if (event === 'TOKEN_REFRESHED') {
          if (session?.user) setAuthUser(session.user);
          done();
          return;
        }

        const seq = ++fetchSeq;

        if (session?.user) {
          setAuthUser(session.user);

          const prof = await Promise.race([
            fetchProfile(session.user),
            new Promise(resolve => setTimeout(() => resolve(null), 10000)),
          ]);
          if (seq === fetchSeq) {
            // Never overwrite a valid profile with a timeout null
            setProfile(prev => prof !== null ? prof : prev);
          }
        } else {
          setAuthUser(null);
          setProfile(null);
        }
        done();
      }
    );

    return () => { subscription.unsubscribe(); clearTimeout(failsafe); };
  }, []);

  // Retry profile fetch if auth loaded but profile is still null (cold-start recovery)
  useEffect(() => {
    if (!authUser?.id || profile) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const prof = await fetchProfile(authUser);
      if (!cancelled && prof) setProfile(prof);
    }, 4000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [authUser?.id, profile]);

  // Load follows : localStorage cache → club_follows table → empty
  useEffect(() => {
    if (!authUser?.id) { setFollows([]); return; }
    let cancelled = false;

    // 1. Try localStorage cache first (instant)
    try {
      const raw = localStorage.getItem(`sl-follows-${authUser.id}`);
      if (raw) { setFollows(JSON.parse(raw)); return; }
      // Migrate from legacy key
      const legacy = localStorage.getItem(`sl-clubs-${authUser.id}`);
      if (legacy) {
        const migrated = JSON.parse(legacy).map(id => ({
          clubId: String(id), teams: 'all', notif: { match: true, news: true },
        }));
        setFollows(migrated);
        localStorage.setItem(`sl-follows-${authUser.id}`, JSON.stringify(migrated));
        return;
      }
    } catch { /* ignore */ }

    // 2. Fallback : load from club_follows table (PERF-006)
    supabase
      .from('club_follows')
      .select('club_id, teams, notif')
      .eq('user_id', authUser.id)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const loaded = data.map(row => ({
          clubId: String(row.club_id),
          teams:  row.teams ?? 'all',
          notif:  row.notif ?? { match: true, news: true },
        }));
        setFollows(loaded);
        localStorage.setItem(`sl-follows-${authUser.id}`, JSON.stringify(loaded));
      });

    return () => { cancelled = true; };
  }, [authUser?.id]);

  // ── Auth actions ─────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Supabase ne répond pas — projet pausé ou connexion bloquée')), 12000)),
    ]);
    if (error) {
      if (error.message.includes('Invalid login credentials'))
        throw new Error('Email ou mot de passe incorrect');
      if (error.message.includes('Email not confirmed'))
        throw new Error('Confirmez votre email avant de vous connecter');
      throw new Error(error.message);
    }
    setAuthUser(data.user);
    const prof = await Promise.race([
      fetchProfile(data.user),
      new Promise(resolve => setTimeout(() => resolve(null), 12000)),
    ]);
    if (prof !== null) setProfile(prof);
    return data.user;
  }, []);

  // Returns { user, needsConfirmation }
  const register = useCallback(async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      if (error.message.includes('already registered'))
        throw new Error('Cet email est déjà utilisé');
      throw new Error(error.message);
    }
    // session is null when email confirmation is required
    return { user: data.user, needsConfirmation: !data.session };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (patch) => {
    if (!authUser) return;
    const map = {
      name:           'name',
      avatar:         'avatar_url',
      favoriteSports: 'favorite_sports',
      followedClubs:  'followed_clubs',
      onboardingDone: 'onboarding_done',
      digestOptIn:    'digest_opt_in',
      badges:         'badges',
      // role et clubId intentionnellement absents — modifiables uniquement via AdminPage
    };
    const dbPatch = {};
    for (const [key, col] of Object.entries(map)) {
      if (key in patch) dbPatch[col] = patch[key];
    }
    const { error } = await supabase.from('profiles').update(dbPatch).eq('id', authUser.id);
    if (error) console.error('[Auth] updateProfile error:', error.message);
    else setProfile(prev => prev ? { ...prev, ...dbPatch } : prev);
  }, [authUser]);

  // ── OAuth ─────────────────────────────────────────────────────────────────

  const loginWithGoogle = useCallback(() => new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, skipBrowserRedirect: true },
    });
    if (error) { reject(new Error(error.message)); return; }
    if (!data?.url) { reject(new Error('URL OAuth manquante')); return; }

    const popup = window.open(data.url, 'sl-google-oauth', 'width=520,height=620,scrollbars=yes');
    if (!popup) { reject(new Error('popup-blocked')); return; }

    const poll = setInterval(async () => {
      if (!popup.closed) return;
      clearInterval(poll);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) resolve(session);
      else reject(new Error('cancelled'));
    }, 400);
  }), []);

  // Mock OAuth for Instagram (Supabase doesn't support it natively)
  const loginWithProvider = useCallback(async (email, provider) => {
    const mockPwd = `mock_${btoa(email).slice(0, 16)}`;

    // Try sign-in first
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email, password: mockPwd,
    });
    if (!signInErr) return { user: signInData.user, needsConfirmation: false };

    // Auto-register if not found
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email, password: mockPwd,
      options: { data: { name, authProvider: provider } },
    });
    if (signUpErr) throw new Error(signUpErr.message);
    return { user: signUpData.user, needsConfirmation: !signUpData.session };
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(error.message);
    return { email };
  }, []);

  // ── Club follow ───────────────────────────────────────────────────────────

  function _saveFollows(userId, next) {
    localStorage.setItem(`sl-follows-${userId}`, JSON.stringify(next));
    // Write to dedicated club_follows table (PERF-006)
    supabase.from('club_follows').delete().eq('user_id', userId).then(() => {
      if (next.length > 0) {
        supabase.from('club_follows').insert(
          next.map(f => ({
            user_id: userId,
            club_id: f.clubId,
            teams: f.teams ?? 'all',
            notif:  f.notif  ?? { match: true, news: true },
          }))
        ).then(() => {});
      }
    });
    // Keep profiles.followed_clubs in sync for backward compat
    supabase.from('profiles').update({ followed_clubs: next.map(f => f.clubId) }).eq('id', userId).then(() => {});
  }

  const followClub = useCallback((clubId, options = {}) => {
    if (!authUser?.id || follows.some(f => String(f.clubId) === String(clubId))) return;
    const item = { clubId: String(clubId), teams: options.teams ?? 'all', notif: options.notif ?? { match: true, news: true } };
    const next = [...follows, item];
    setFollows(next);
    _saveFollows(authUser.id, next);
  }, [authUser?.id, follows]);

  const unfollowClub = useCallback((clubId) => {
    if (!authUser?.id) return;
    const next = follows.filter(f => String(f.clubId) !== String(clubId));
    setFollows(next);
    _saveFollows(authUser.id, next);
  }, [authUser?.id, follows]);

  const updateFollow = useCallback((clubId, patch) => {
    if (!authUser?.id) return;
    const next = follows.map(f => String(f.clubId) === String(clubId) ? { ...f, ...patch } : f);
    setFollows(next);
    _saveFollows(authUser.id, next);
  }, [authUser?.id, follows]);

  const isFollowingClub = useCallback((clubId) => follows.some(f => String(f.clubId) === String(clubId)), [follows]);
  const getFollow = useCallback((clubId) => follows.find(f => String(f.clubId) === String(clubId)) ?? null, [follows]);
  const followedClubs = useMemo(() => follows.map(f => f.clubId), [follows]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const currentUser = useMemo(() => mapProfile(authUser, profile), [authUser, profile]);
  const isAdmin     = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isClubAdmin = currentUser?.role === 'club_admin';
  const isLoggedIn  = !!currentUser;

  return (
    <AuthContext.Provider value={{
      currentUser, loading,
      login, register, logout, updateProfile,
      loginWithGoogle, loginWithProvider, requestPasswordReset,
      follows, followedClubs, followClub, unfollowClub, updateFollow, isFollowingClub, getFollow,
      isAdmin, isClubAdmin, isLoggedIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
