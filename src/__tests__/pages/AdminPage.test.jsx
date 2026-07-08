import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const AUTH = { isAdmin: true, currentUser: { id: 'u-1', role: 'admin' } };
const CLUBS = {
  userClubs: [], loading: false,
  verifyClub: vi.fn(), rejectClub: vi.fn(), requestClubInfo: vi.fn(), suspendClub: vi.fn(),
  addClubAndNotify: vi.fn(), updateClub: vi.fn(), deleteClub: vi.fn(),
};
const SPORTS = {
  allSports: { Football: { label: 'Football', color: '#16a34a', iconId: 'Football' } },
  customSports: [], deletedDefaults: [],
  addSport: vi.fn(), updateSport: vi.fn(), deleteSport: vi.fn(), restoreSport: vi.fn(), toggleArchive: vi.fn(),
};

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: () => AUTH }));
vi.mock('../../contexts/ToastContext.jsx', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('../../hooks/useClubs.js', () => ({ useClubs: () => CLUBS }));
vi.mock('../../hooks/useSports.js', () => ({ useSports: () => SPORTS }));
vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ then: (fn) => Promise.resolve({ data: [] }).then(fn) }), then: (fn) => Promise.resolve({ data: [] }).then(fn) }) }),
    auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
  },
  isDemoMode: () => false, setDemoMode: () => {},
}));
vi.mock('../../components/SportIcon.jsx', () => ({ default: () => null }));

import AdminPage from '../../pages/AdminPage.jsx';

describe('AdminPage', () => {
  it('se monte sans crash (admin)', () => {
    expect(() => render(<AdminPage onNavigate={vi.fn()} />)).not.toThrow();
  });
  it('rend du contenu', () => {
    const { container } = render(<AdminPage onNavigate={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });
});
