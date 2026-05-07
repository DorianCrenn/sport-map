import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'auth-users';
const SESSION_KEY = 'auth-session';

const SEED_ADMIN = {
  id: 'superadmin-1',
  email: 'admin@sportlink.fr',
  password: 'admin123',
  name: 'Super Admin',
  role: 'superadmin',
  avatar: null,
  favoriteSports: [],
  followedClubs: [],
  clubId: null,
  onboardingDone: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const users = raw ? JSON.parse(raw) : [];
    if (!users.find(u => u.id === SEED_ADMIN.id)) {
      const next = [SEED_ADMIN, ...users];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }
    return users;
  } catch { return [SEED_ADMIN]; }
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      return id ? loadUsers().find(u => u.id === id) ?? null : null;
    } catch { return null; }
  });

  function persist(next) {
    setUsers(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const login = useCallback((email, password) => {
    const all = loadUsers();
    const user = all.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) throw new Error('Email ou mot de passe incorrect');
    setUsers(all);
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  }, []);

  const register = useCallback((data) => {
    const all = loadUsers();
    if (all.find(u => u.email.toLowerCase() === data.email.toLowerCase()))
      throw new Error('Cet email est déjà utilisé');
    const newUser = {
      id: `user_${Date.now()}`,
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'user',
      avatar: null,
      favoriteSports: [],
      followedClubs: [],
      clubId: null,
      onboardingDone: false,
      createdAt: new Date().toISOString(),
    };
    const next = [...all, newUser];
    persist(next);
    setCurrentUser(newUser);
    localStorage.setItem(SESSION_KEY, newUser.id);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const updateProfile = useCallback((patch) => {
    setUsers(prev => {
      const next = prev.map(u => u.id === currentUser?.id ? { ...u, ...patch } : u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setCurrentUser(prev => prev ? { ...prev, ...patch } : prev);
  }, [currentUser?.id]);

  const updateUser = useCallback((id, patch) => {
    setUsers(prev => {
      const next = prev.map(u => u.id === id ? { ...u, ...patch } : u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (currentUser?.id === id) setCurrentUser(prev => ({ ...prev, ...patch }));
  }, [currentUser?.id]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isClubAdmin = currentUser?.role === 'club_admin';
  const isLoggedIn = !!currentUser;

  return (
    <AuthContext.Provider value={{
      currentUser, users,
      login, register, logout, updateProfile, updateUser,
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
