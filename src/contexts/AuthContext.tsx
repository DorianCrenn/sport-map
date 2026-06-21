import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { translateSupabaseError } from '../lib/translateSupabaseError.js';
import type { CurrentUser, ClubFollow, PlanId, UserRole } from '../types/sportlink.js';

// ── DB profile row type ───────────────────────────────────────────────────────

interface DBProfile {
  id: string;
  name?: string;
  role?: UserRole;
  avatar_url?: string | null;
  favorite_sports?: string[];
  followed_clubs?: string[];
  club_id?: string | null;
  onboarding_done?: boolean;
  digest_opt_in?: boolean;
  auth_provider?: string | null;
  badges?: string[];
  plan?: PlanId;
  xp?: number;
  job_role?: string | null;
  analytics_consent?: boolean | null;
}

// ── Auth context value ────────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (opts: { email: string; password: string; name: string }) => Promise<{ user: User | null; needsConfirmation: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<CurrentUser>) => Promise<{ error: Error | null }>;
  refetchProfile: () => Promise<void>;
  loginWithGoogle: () => Promise<unknown>;
  loginWithProvider: (email: string, provider: string) => Promise<{ user: User | null; needsConfirmation: boolean; isNewUser: boolean }>;
  requestPasswordReset: (email: string) => Promise<{ email: string }>;
  follows: ClubFollow[];
  followedClubs: string[];
  followClub: (clubId: string, options?: Partial<Omit<ClubFollow, 'clubId'>>) => void;
  unfollowClub: (clubId: string) => void;
  updateFollow: (clubId: string, patch: Partial<ClubFollow>) => void;
  isFollowingClub: (clubId: string) => boolean;
  getFollow: (clubId: string) => ClubFollow | null;
  isAdmin: boolean;
  isClubAdmin: boolean;
  isLoggedIn: boolean;
  // DEV only
  devRole?: UserRole | null;
  setDevRole?: (role: UserRole | null) => void;
  devClubId?: string | null;
  setDevClubId?: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapProfile(authUser: User | null, dbProfile: DBProfile | null): CurrentUser | null {
  if (!authUser) return null;
  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id:             authUser.id,
    email:          authUser.email,
    name:           dbProfile?.name ?? (meta.name as string) ?? authUser.email?.split('@')[0] ?? '',
    role:           (dbProfile?.role ?? 'user') as UserRole,
    avatar:         dbProfile?.avatar_url ?? null,
    favoriteSports: dbProfile?.favorite_sports ?? [],
    followedClubs:  dbProfile?.followed_clubs ?? [],
    clubId:         dbProfile?.club_id ?? null,
    onboardingDone: dbProfile ? (dbProfile.onboarding_done ?? false) : null,
    digestOptIn:    dbProfile?.digest_opt_in ?? false,
    authProvider:   dbProfile?.auth_provider ?? (meta.authProvider as string) ?? null,
    badges:         dbProfile?.badges ?? [],
    plan:           (dbProfile?.plan ?? 'free') as PlanId,
    xp:             dbProfile?.xp ?? 0,
    jobRole:        dbProfile?.job_role ?? null,
    createdAt:      authUser.created_at,
  };
}

async function fetchProfile(authUser: User): Promise<DBProfile | null> {
  const { id: userId } = authUser;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (data) return data as DBProfile;
    if (error) console.warn('[Auth] fetchProfile error:', error.message);
    if (attempt < 4) await new Promise(r => setTimeout(r, 500));
  }
  console.warn('[Auth] Profile not found after retries — creating fallback');
  const name = (authUser.user_metadata?.name as string) ?? authUser.email?.split('@')[0] ?? '';
  await supabase.from('profiles').insert({ id: userId, name }).then(() => {}, () => {});
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return (data as DBProfile | null) ?? null;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile]   = useState<DBProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [follows, setFollows]   = useState<ClubFollow[]>([]);

  const refetchProfile = useCallback(async () => {
    if (!authUser) return;
    const prof = await fetchProfile(authUser);
    if (prof) setProfile(prof);
  }, [authUser]);

  useEffect(() => {
    let resolved = false;
    let fetchSeq = 0;

    const failsafe = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); }
    }, 8000);

    function done() {
      if (!resolved) { resolved = true; clearTimeout(failsafe); setLoading(false); }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          if (session?.user) setAuthUser(session.user);
          return;
        }
        const seq = ++fetchSeq;

        if (session?.user) {
          setAuthUser(session.user);
          try {
            const prof = await Promise.race([
              fetchProfile(session.user),
              new Promise<null>(resolve => setTimeout(() => resolve(null), 6000)),
            ]);
            if (seq === fetchSeq) {
              setProfile(prev => prof !== null ? prof : prev);
            }

            const withTimeout = <T,>(p: PromiseLike<T>): Promise<T | { data: null; error: null }> =>
              Promise.race([Promise.resolve(p), new Promise<{ data: null; error: null }>(r => setTimeout(() => r({ data: null, error: null }), 5000))]);

            if (session.user.email) {
              try {
                const { data: pendingManager } = await withTimeout(
                  supabase.from('club_managers').select('club_id, role')
                    .eq('email', session.user.email.toLowerCase())
                    .eq('status', 'pending').maybeSingle(),
                ) as { data: { club_id: string; role: string } | null };

                if (pendingManager) {
                  await withTimeout(supabase.from('club_managers').update({ status: 'active' }).eq('email', session.user.email.toLowerCase()));
                  const currentProf = prof ?? (await fetchProfile(session.user));
                  if (currentProf && !(currentProf as DBProfile).club_id) {
                    await withTimeout(supabase.from('profiles').update({ club_id: pendingManager.club_id, role: 'club_admin' }).eq('id', session.user.id));
                    const updatedProf = await fetchProfile(session.user);
                    if (seq === fetchSeq && updatedProf) setProfile(updatedProf);
                  }
                }
              } catch (e) { console.warn('[Auth] MANAGER-001 non-blocking error:', (e as Error).message); }

              try {
                const { data: playerEntry } = await withTimeout(
                  supabase.from('club_players').select('id').eq('email', session.user.email.toLowerCase()).is('user_id', null).maybeSingle(),
                ) as { data: { id: string } | null };
                if (playerEntry) {
                  await withTimeout(supabase.from('club_players').update({ user_id: session.user.id }).eq('id', playerEntry.id));
                }
              } catch (e) { console.warn('[Auth] ROSTER-001 non-blocking error:', (e as Error).message); }
            }
          } catch (err) {
            console.error('[Auth] onAuthStateChange: unexpected error:', (err as Error).message);
          } finally {
            done();
          }
        } else {
          setAuthUser(null);
          setProfile(null);
          done();
        }
      },
    );
    return () => { subscription.unsubscribe(); clearTimeout(failsafe); };
  }, []);

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

  useEffect(() => {
    if (!authUser?.id) return;
    const channel = supabase
      .channel(`profile-${authUser.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${authUser.id}` },
        ({ new: row }) => { setProfile(row as DBProfile); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser?.id) { setFollows([]); return; }
    let cancelled = false;

    let loadedFromCache = false;
    try {
      const raw = localStorage.getItem(`sl-follows-${authUser.id}`);
      if (raw) { setFollows(JSON.parse(raw) as ClubFollow[]); loadedFromCache = true; }
      else {
        const legacy = localStorage.getItem(`sl-clubs-${authUser.id}`);
        if (legacy) {
          const migrated: ClubFollow[] = (JSON.parse(legacy) as string[]).map(id => ({
            clubId: String(id), teams: 'all', notif: { match: true, news: true },
          }));
          setFollows(migrated);
          localStorage.setItem(`sl-follows-${authUser.id}`, JSON.stringify(migrated));
          loadedFromCache = true;
        }
      }
    } catch { /* ignore */ }

    // Toujours re-sync depuis DB en background (même si cache présent)
    supabase.from('club_follows').select('club_id, teams, notif').eq('user_id', authUser.id)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const loaded: ClubFollow[] = data.map(row => ({
          clubId: String(row.club_id),
          teams:  (row.teams as 'all' | string[]) ?? 'all',
          notif:  (row.notif as { match: boolean; news: boolean }) ?? { match: true, news: true },
        }));
        setFollows(loaded);
        localStorage.setItem(`sl-follows-${authUser.id}`, JSON.stringify(loaded));
      });
    return () => { cancelled = true; };
  }, [authUser?.id]);

  // ── Auth actions ─────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Supabase ne répond pas — projet pausé ou connexion bloquée')), 12000)),
    ]);
    if (error) throw new Error(translateSupabaseError(error));
    setAuthUser(data.user);
    const prof = await Promise.race([fetchProfile(data.user), new Promise<null>(resolve => setTimeout(() => resolve(null), 12000))]);
    if (prof !== null) setProfile(prof);
    return data.user;
  }, []);

  const register = useCallback(async ({ email, password, name }: { email: string; password: string; name: string }) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw new Error(translateSupabaseError(error));
    return { user: data.user, needsConfirmation: !data.session };
  }, []);

  const logout = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const updateProfile = useCallback(async (patch: Partial<CurrentUser>): Promise<{ error: Error | null }> => {
    if (!authUser) return { error: new Error('Non connecté') };
    const map: Record<string, string> = {
      name: 'name', avatar: 'avatar_url', favoriteSports: 'favorite_sports',
      followedClubs: 'followed_clubs', onboardingDone: 'onboarding_done',
      digestOptIn: 'digest_opt_in', badges: 'badges', jobRole: 'job_role',
      homeCity: 'home_city',
    };
    const dbPatch: Record<string, unknown> = {};
    const camelPatch: Record<string, unknown> = {};
    for (const [key, col] of Object.entries(map)) {
      if (key in patch) { dbPatch[col] = (patch as Record<string, unknown>)[key]; camelPatch[key] = (patch as Record<string, unknown>)[key]; }
    }
    const { error } = await supabase.from('profiles').update(dbPatch).eq('id', authUser.id);
    if (error) { console.error('[Auth] updateProfile error:', error.message); return { error: new Error(error.message) }; }
    setProfile(prev => prev ? { ...prev, ...camelPatch } as DBProfile : prev);
    return { error: null };
  }, [authUser]);

  const loginWithGoogle = useCallback(() => new Promise((resolve, reject) => {
    (async () => {
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
        if (session) resolve(session); else reject(new Error('cancelled'));
      }, 400);
    })().catch(reject);
  }), []);

  const loginWithProvider = useCallback(async (email: string, provider: string) => {
    if (import.meta.env.PROD) throw new Error('La simulation OAuth est désactivée en production.');
    const lsKey = `sl-mock-${email.toLowerCase().replace(/\W/g, '')}`;
    let pwd = localStorage.getItem(lsKey);
    if (pwd) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (!error) return { user: data.user, needsConfirmation: false, isNewUser: false };
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    pwd = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(lsKey, pwd);
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const { data, error } = await supabase.auth.signUp({ email, password: pwd, options: { data: { name, authProvider: provider } } });
    if (error) throw new Error(error.message);
    return { user: data.user, needsConfirmation: !data.session, isNewUser: true };
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw new Error(error.message);
    return { email };
  }, []);

  // ── Club follow ───────────────────────────────────────────────────────────

  function _saveFollows(userId: string, next: ClubFollow[], prev: ClubFollow[] = []) {
    localStorage.setItem(`sl-follows-${userId}`, JSON.stringify(next));
    if (next.length > 0) {
      supabase.from('club_follows').upsert(
        next.map(f => ({ user_id: userId, club_id: f.clubId, teams: f.teams ?? 'all', notif: f.notif ?? { match: true, news: true } })),
        { onConflict: 'user_id,club_id' },
      ).then(() => {});
    }
    const nextIds = new Set(next.map(f => f.clubId));
    const removed = prev.filter(f => !nextIds.has(f.clubId)).map(f => f.clubId);
    if (removed.length > 0) {
      supabase.from('club_follows').delete().eq('user_id', userId).in('club_id', removed).then(() => {});
    }
    supabase.from('profiles').update({ followed_clubs: next.map(f => f.clubId) }).eq('id', userId).then(() => {});
  }

  const followClub = useCallback((clubId: string, options: Partial<Omit<ClubFollow, 'clubId'>> = {}) => {
    if (!authUser?.id || follows.some(f => String(f.clubId) === String(clubId))) return;
    const item: ClubFollow = { clubId: String(clubId), teams: options.teams ?? 'all', notif: options.notif ?? { match: true, news: true } };
    const next = [...follows, item];
    setFollows(next);
    if (isDemoMode()) window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'club-followed', clubId } }));
    _saveFollows(authUser.id, next, follows);
  }, [authUser?.id, follows]); // eslint-disable-line react-hooks/exhaustive-deps

  const unfollowClub = useCallback((clubId: string) => {
    if (!authUser?.id) return;
    const next = follows.filter(f => String(f.clubId) !== String(clubId));
    setFollows(next);
    _saveFollows(authUser.id, next, follows);
  }, [authUser?.id, follows]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFollow = useCallback((clubId: string, patch: Partial<ClubFollow>) => {
    if (!authUser?.id) return;
    const next = follows.map(f => String(f.clubId) === String(clubId) ? { ...f, ...patch } : f);
    setFollows(next);
    _saveFollows(authUser.id, next, follows);
  }, [authUser?.id, follows]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFollowingClub = useCallback((clubId: string) => follows.some(f => String(f.clubId) === String(clubId)), [follows]);
  const getFollow = useCallback((clubId: string) => follows.find(f => String(f.clubId) === String(clubId)) ?? null, [follows]);
  const followedClubs = useMemo(() => follows.map(f => f.clubId), [follows]);

  const currentUser = useMemo(() => mapProfile(authUser, profile), [authUser, profile]);

  const [devRole,   setDevRole]   = useState<UserRole | null>(null);
  const [devClubId, setDevClubId] = useState<string | null>(null);
  const [demoProfileType, setDemoProfileType] = useState<string | null>(() =>
    isDemoMode() ? sessionStorage.getItem('sl-demo-profile') : null,
  );
  useEffect(() => {
    if (!isDemoMode()) return;
    function onProfileSelected(e: Event) { setDemoProfileType((e as CustomEvent<{ profile: string }>).detail.profile); }
    window.addEventListener('sl-demo-profile-selected', onProfileSelected);
    return () => window.removeEventListener('sl-demo-profile-selected', onProfileSelected);
  }, []);

  const _baseRole = (devRole && !import.meta.env.PROD) ? devRole : currentUser?.role;
  const NON_ADMIN_DEMO_PROFILES = ['parent', 'player', 'supporter'];
  const effectiveRole = (isDemoMode() && demoProfileType && NON_ADMIN_DEMO_PROFILES.includes(demoProfileType))
    ? 'user' as UserRole : _baseRole;
  const effectiveUser = (devRole && !import.meta.env.PROD && currentUser)
    ? { ...currentUser, role: devRole, clubId: devClubId ?? currentUser.clubId }
    : currentUser;

  const isAdmin     = effectiveRole === 'admin' || effectiveRole === 'superadmin';
  const isClubAdmin = effectiveRole === 'club_admin';
  const isLoggedIn  = !!currentUser;

  return (
    <AuthContext.Provider value={{
      currentUser: effectiveUser, loading,
      login, register, logout, updateProfile, refetchProfile,
      loginWithGoogle, loginWithProvider, requestPasswordReset,
      follows, followedClubs, followClub, unfollowClub, updateFollow, isFollowingClub, getFollow,
      isAdmin, isClubAdmin, isLoggedIn,
      ...(import.meta.env.PROD ? {} : { devRole, setDevRole, devClubId, setDevClubId }),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthSafe(): AuthContextValue | null {
  return useContext(AuthContext);
}
