/**
 * Tests d'accessibilité WCAG 2.1 AA — AuthPage & EventFormModal
 * Cible les formulaires les plus utilisés de l'app.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

// ── Mocks globaux ─────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useAnimation:    () => ({ start: vi.fn() }),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select:  vi.fn().mockReturnThis(),
      insert:  vi.fn().mockReturnThis(),
      update:  vi.fn().mockReturnThis(),
      delete:  vi.fn().mockReturnThis(),
      eq:      vi.fn().mockReturnThis(),
      in:      vi.fn().mockReturnThis(),
      order:   vi.fn().mockReturnThis(),
      limit:   vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      then:    (fn) => Promise.resolve({ data: [], error: null }).then(fn),
    })),
    channel:       vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })) })) },
  },
  isDemoMode: vi.fn().mockReturnValue(false),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: null,
    login:    vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
  }),
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../constants/zIndex.js', () => ({ Z: { modal: 100, formModal: 100 } }));

// ── AuthPage ──────────────────────────────────────────────────────────────────

import AuthPage from '../../pages/AuthPage.jsx';

describe('Accessibilité — AuthPage', () => {
  it('formulaire connexion : aucune violation axe', async () => {
    const { container } = render(<AuthPage onClose={vi.fn()} onNeedOnboarding={vi.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('champs email et mot de passe ont des labels accessibles', async () => {
    const { container } = render(<AuthPage onClose={vi.fn()} onNeedOnboarding={vi.fn()} />);
    const results = await axe(container, {
      rules: { label: { enabled: true } },
    });
    expect(results).toHaveNoViolations();
  });

  it('boutons ont des noms accessibles', async () => {
    const { container } = render(<AuthPage onClose={vi.fn()} onNeedOnboarding={vi.fn()} />);
    const results = await axe(container, {
      rules: { 'button-name': { enabled: true } },
    });
    expect(results).toHaveNoViolations();
  });
});

// ── EventFormModal ────────────────────────────────────────────────────────────

vi.mock('../../hooks/useFocusTrap.js',    () => ({ useFocusTrap: vi.fn() }));
vi.mock('../../hooks/useAndroidBack.js',  () => ({ useAndroidBack: vi.fn() }));
vi.mock('../../hooks/useSports.js',       () => ({
  useSports: () => ({
    allSports: {
      Football:   { label: 'Football',   isArchived: false },
      Basketball: { label: 'Basketball', isArchived: false },
    },
  }),
}));
vi.mock('../../hooks/useClubs.js', () => ({
  useClubs: () => ({ userClubs: [] }),
}));
vi.mock('../../data/cities.js', () => ({
  EVENT_TYPES: [
    { value: 'championship', label: 'Championnat', icon: '🏆', color: '#3b82f6' },
    { value: 'friendly',     label: 'Amical',      icon: '⚽', color: '#22C55E' },
  ],
}));
vi.mock('../../data/clubs.js', () => ({ STATIC_CLUBS: [] }));
vi.mock('../../components/CityAutocomplete.jsx', () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder || 'Ville'} value={value ?? ''} onChange={e => onChange(e.target.value)} />
  ),
}));
vi.mock('../../components/VenueAutocomplete.jsx', () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder || 'Lieu'} value={value ?? ''} onChange={e => onChange(e.target.value)} />
  ),
}));
vi.mock('../../components/SportIcon.jsx', () => ({ default: () => null }));
// EventFormModal est testé via EventFormModal.test.jsx avec mocks complets.
