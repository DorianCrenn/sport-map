import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

function mapProfile(authUser, dbProfile) {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: dbProfile?.name ?? authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? '',
    role: dbProfile?.role ?? 'user',
    avatar: dbProfile?.avatar_url ?? null,
    favoriteSports: dbProfile?.favorite_sports ?? [],
    followedClubs: dbProfile?.followed_clubs ?? [],
    clubId: dbProfile?.club_id ?? null,
    onboardingDone: dbProfile?.onboarding_done ?? false,
    authProvider: dbProfile?.auth_provider ?? null,
    createdAt: authUser.created_at,
  };
}

async function fetchProfile(userId, retries = 4) {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) return data;
    if (i < retries - 1) await new Promise(r => setTimeout(r, 400));
  }
  return null;
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        setAuthUser(session.user);
        setProfile(prof);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        setAuthUser(session.user);
        setProfile(prof);
      } else {
        setAuthUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  }, []);

  const register = useCallback(async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (patch) => {
    if (!authUser) return;
    const dbPatch = {};
    if ('name' in patch) dbPatch.name = patch.name;
    if ('avatar' in patch) dbPatch.avatar_url = patch.avatar;
    if ('favoriteSports' in patch) dbPatch.favorite_sports = patch.favoriteSports;
    if ('followedClubs' in patch) dbPatch.followed_clubs = patch.followedClubs;
    if ('clubId' in patch) dbPatch.club_id = patch.clubId;
    if ('onboardingDone' in patch) dbPatch.onboarding_done = patch.onboardingDone;
    if ('role' in patch) dbPatch.role = patch.role;

    await supabase.from('profiles').update(dbPatch).eq('id', authUser.id);
    setProfile(prev => prev ? { ...prev, ...dbPatch } : prev);
  }, [authUser]);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  }, []);

  const loginWithProvider = useCallback(async (email, provider) => {
    const mockPassword = `mock_${btoa(email).slice(0, 16)}`;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: mockPassword,
    });
    if (!signInError) return signInData.user;

    const namePart = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: mockPassword,
      options: { data: { name: namePart, authProvider: provider } },
    });
    if (signUpError) throw new Error(signUpError.message);
    return signUpData.user;
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) throw new Error(error.message);
    return { email };
  }, []);

  const followClub = useCallback(async (clubId) => {
    if (!authUser || !profile) return;
    const followed = profile.followed_clubs ?? [];
    if (followed.includes(clubId)) return;
    await supabase.from('profiles').update({ followed_clubs: [...followed, clubId] }).eq('id', authUser.id);
    setProfile(prev => prev ? { ...prev, followed_clubs: [...(prev.followed_clubs ?? []), clubId] } : prev);
  }, [authUser, profile]);

  const unfollowClub = useCallback(async (clubId) => {
    if (!authUser || !profile) return;
    const followed = (profile.followed_clubs ?? []).filter(id => id !== clubId);
    await supabase.from('profiles').update({ followed_clubs: followed }).eq('id', authUser.id);
    setProfile(prev => prev ? { ...prev, followed_clubs: followed } : prev);
  }, [authUser, profile]);

  const isFollowingClub = useCallback((clubId) => {
    return !!(profile?.followed_clubs ?? []).includes(clubId);
  }, [profile]);

  const currentUser = mapProfile(authUser, profile);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isClubAdmin = currentUser?.role === 'club_admin';
  const isLoggedIn = !!currentUser;

  return (
    <AuthContext.Provider value={{
      currentUser,
      login, register, logout, updateProfile,
      loginWithGoogle, loginWithProvider, requestPasswordReset,
      followClub, unfollowClub, isFollowingClub,
      isAdmin, isClubAdmin, isLoggedIn, loading,
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
