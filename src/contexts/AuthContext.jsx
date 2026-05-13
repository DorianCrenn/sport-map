import { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
    authProvider:   dbProfile?.auth_provider ?? meta.authProvider ?? null,
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

  // Fallback: trigger didn't fire — create profile client-side
  // Requires the "profiles_insert_own" RLS policy
  console.warn('[Auth] Profile not found after retries — creating fallback');
  const name = authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? '';
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name }, { onConflict: 'id' })
    .select()
    .single();

  if (error) console.error('[Auth] Fallback profile creation failed:', error.message);
  return data ?? null;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    let resolved = false;

    const failsafe = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); }
    }, 6000);

    function done() {
      if (!resolved) { resolved = true; clearTimeout(failsafe); setLoading(false); }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const prof = await fetchProfile(session.user);
          setAuthUser(session.user);
          setProfile(prof);
        } else {
          setAuthUser(null);
          setProfile(null);
        }
        done();
      }
    );

    return () => { subscription.unsubscribe(); clearTimeout(failsafe); };
  }, []);

  // ── Auth actions ─────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials'))
        throw new Error('Email ou mot de passe incorrect');
      if (error.message.includes('Email not confirmed'))
        throw new Error('Confirmez votre email avant de vous connecter');
      throw new Error(error.message);
    }
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
      clubId:         'club_id',
      onboardingDone: 'onboarding_done',
      role:           'role',
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

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  }, []);

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

  const followClub = useCallback(async (clubId) => {
    if (!authUser || !profile) return;
    const followed = profile.followed_clubs ?? [];
    if (followed.includes(clubId)) return;
    const next = [...followed, clubId];
    await supabase.from('profiles').update({ followed_clubs: next }).eq('id', authUser.id);
    setProfile(prev => prev ? { ...prev, followed_clubs: next } : prev);
  }, [authUser, profile]);

  const unfollowClub = useCallback(async (clubId) => {
    if (!authUser || !profile) return;
    const next = (profile.followed_clubs ?? []).filter(id => id !== clubId);
    await supabase.from('profiles').update({ followed_clubs: next }).eq('id', authUser.id);
    setProfile(prev => prev ? { ...prev, followed_clubs: next } : prev);
  }, [authUser, profile]);

  const isFollowingClub = useCallback((clubId) => {
    return !!(profile?.followed_clubs ?? []).includes(clubId);
  }, [profile]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const currentUser = mapProfile(authUser, profile);
  const isAdmin     = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isClubAdmin = currentUser?.role === 'club_admin';
  const isLoggedIn  = !!currentUser;

  return (
    <AuthContext.Provider value={{
      currentUser, loading,
      login, register, logout, updateProfile,
      loginWithGoogle, loginWithProvider, requestPasswordReset,
      followClub, unfollowClub, isFollowingClub,
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
