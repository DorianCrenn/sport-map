import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Retours stables ───────────────────────────────────────────────────────────
const AUTH = {
  currentUser: { id: 'u-1', name: 'Test User', email: 't@test.fr', xp: 120, favoriteSports: [], role: 'user', avatar_url: null, clubId: null },
  logout: vi.fn(), isAdmin: false, isClubAdmin: false, updateProfile: vi.fn(),
  unfollowClub: vi.fn(), followedClubs: [], requestPasswordReset: vi.fn(),
};
const PLAN = { planId: 'free', plan: { id: 'free', name: 'Gratuit', label: 'Gratuit' }, isUpgradeable: true };
const FAVS = { favorites: new Set() };
const SPORTS = { allSports: { Football: { label: 'Football', color: '#16a34a' } } };
const CLUBS = { userClubs: [] };
const CONSENT = { consent: true, accept: vi.fn(), refuse: vi.fn() };
const THEME = { theme: 'dark', toggleTheme: vi.fn() };
const PLAYER_STATS = { stats: null };

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
    p:      ({ children, ...p }) => <p {...p}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
// appInfo lit __APP_VERSION__ (define Vite, absent en test) → on le mocke
vi.mock('../../lib/appInfo.js', () => ({ APP_VERSION: '1.0.0-test', APP_NAME: 'SportLink' }));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: () => AUTH }));
vi.mock('../../contexts/ToastContext.jsx', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('../../contexts/ThemeContext.jsx', () => ({ useTheme: () => THEME }));
vi.mock('../../contexts/FavoritesContext.jsx', () => ({ useFavoritesContext: () => FAVS }));
vi.mock('../../hooks/useSports.js', () => ({ useSports: () => SPORTS }));
vi.mock('../../hooks/useClubs.js', () => ({ useClubs: () => CLUBS }));
vi.mock('../../hooks/usePlan.js', () => ({ usePlan: () => PLAN }));
vi.mock('../../hooks/useAnalyticsConsent.js', () => ({ useAnalyticsConsent: () => CONSENT }));
vi.mock('../../hooks/usePlayerStats.js', () => ({ useMyPlayerStats: () => PLAYER_STATS }));
vi.mock('../../components/home/StreakWidget.jsx', () => ({ default: () => null }));
vi.mock('../../components/RgpdExportButton.jsx', () => ({ default: () => null }));
vi.mock('../../components/SportLinkLogo.jsx', () => ({ default: () => null }));
vi.mock('../../components/SportIcon.jsx', () => ({ default: () => null }));
vi.mock('../../components/ClubLeaderboard.jsx', () => ({ default: () => null }));
vi.mock('../../components/UserLeaderboard.jsx', () => ({ default: () => null }));
vi.mock('../../components/BadgeUnlockModal.jsx', () => ({ default: () => null }));

import ProfilPage from '../../pages/ProfilPage.jsx';

const PROPS = {
  userEvents: [], earnedBadges: [], onNavigate: vi.fn(), onShowAuth: vi.fn(),
  onMyRides: vi.fn(), rideNotifCount: 0, onShowLegal: vi.fn(),
  onMyConvocations: vi.fn(), convocationsPendingCount: 0,
};

describe('ProfilPage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<ProfilPage {...PROPS} />)).not.toThrow();
  });

  it('affiche le nom de l\'utilisateur', () => {
    render(<ProfilPage {...PROPS} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('affiche l\'onglet Paramètres', () => {
    render(<ProfilPage {...PROPS} />);
    expect(screen.getByText('Paramètres')).toBeInTheDocument();
  });
});
