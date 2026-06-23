import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
    h1:     ({ children, ...p }: any) => <h1 {...p}>{children}</h1>,
    p:      ({ children, ...p }: any) => <p {...p}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: { id: 'u1', name: 'Jean Coach', email: 'coach@club.fr' },
    updateProfile: vi.fn().mockResolvedValue({}),
    isClubAdmin: false,
  }),
}));

vi.mock('../../hooks/useSports.js', () => ({
  useSports: () => ({
    allSports: {
      football:   { id: 'football',   label: 'Football',   color: '#22c55e' },
      basketball: { id: 'basketball', label: 'Basketball', color: '#ef4444' },
      rugby:      { id: 'rugby',      label: 'Rugby',      color: '#f97316' },
    },
  }),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in:    () => ({ order: () => ({ limit: () => Promise.resolve({ data: [] }) }) }),
        order: () => ({ limit: () => Promise.resolve({ data: [] }) }),
      }),
    }),
  },
}));

// OnboardingRoleStep exposed avec boutons testables
vi.mock('../../components/OnboardingRoleStep.jsx', () => ({
  default: ({ onChange, onNext }: any) => (
    <div data-testid="role-step">
      <button data-testid="role-president" onClick={() => onChange('president')}>Président</button>
      <button data-testid="role-coach"     onClick={() => onChange('coach')}>Coach</button>
      <button data-testid="role-communicant" onClick={() => onChange('communicant')}>Communication</button>
      <button data-testid="role-joueur"    onClick={() => onChange('joueur')}>Joueur</button>
      <button data-testid="role-parent"    onClick={() => onChange('parent')}>Parent</button>
      <button data-testid="btn-next"       onClick={onNext}>Continuer</button>
    </div>
  ),
}));

vi.mock('../../components/OnboardingFirstSteps.jsx', () => ({
  default: ({ onDone }: any) => (
    <div data-testid="first-steps">
      <button onClick={() => onDone(null)}>Terminer</button>
    </div>
  ),
}));

vi.mock('../../components/CityAutocomplete.jsx', () => ({
  default: ({ onSelect }: any) => (
    <input data-testid="city-input" placeholder="Ville" onChange={e => onSelect({ nom: e.target.value })} />
  ),
}));

vi.mock('../../components/SportIcon.jsx', () => ({
  default: ({ sport }: any) => <span data-testid={`icon-${sport}`}>{sport}</span>,
}));

vi.mock('../../contexts/ThemeContext.jsx', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn(), toggleTheme: vi.fn() }),
  ThemeProvider: ({ children }: any) => <>{children}</>,
}));

// Navigation mock (utilisé dans OnboardingFirstSteps)
Object.defineProperty(window, 'sessionStorage', { value: { getItem: vi.fn(), setItem: vi.fn() }, writable: true });
Object.defineProperty(window, 'localStorage',   { value: { getItem: vi.fn(), setItem: vi.fn() }, writable: true });

import OnboardingPage from '../../pages/OnboardingPage.jsx';

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderOnboarding() {
  return render(<OnboardingPage onDone={vi.fn()} />);
}

// ── Tests — logique court-circuit (extractée, pure) ───────────────────────────

describe('Onboarding — logique étape court-circuit (pure)', () => {
  const CLUB_ROLES = ['president', 'coach', 'communicant'];
  const REGULAR_ROLES = ['joueur', 'parent', 'supporter'];

  function getNextStep(jobRole: string | null) {
    if (jobRole && CLUB_ROLES.includes(jobRole)) return 4;
    return 2;
  }

  function getBackStepFromStep4(jobRole: string | null) {
    if (jobRole && CLUB_ROLES.includes(jobRole)) return 1;
    return 3;
  }

  it.each(CLUB_ROLES)('%s → next step = 4 (clubs, pas sports)', (role) => {
    expect(getNextStep(role)).toBe(4);
  });

  it.each(REGULAR_ROLES)('%s → next step = 2 (sports)', (role) => {
    expect(getNextStep(role)).toBe(2);
  });

  it('null (aucun rôle) → next step = 2', () => {
    expect(getNextStep(null)).toBe(2);
  });

  it.each(CLUB_ROLES)('%s → retour depuis step 4 = step 1 (role)', (role) => {
    expect(getBackStepFromStep4(role)).toBe(1);
  });

  it.each(REGULAR_ROLES)('%s → retour depuis step 4 = step 3 (ville)', (role) => {
    expect(getBackStepFromStep4(role)).toBe(3);
  });
});

// ── Tests — render (intégration composant) ────────────────────────────────────

describe('Onboarding — navigation président/coach → step 4 direct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('monte sans crash', () => {
    expect(() => renderOnboarding()).not.toThrow();
  });

  it('affiche le step 1 (rôle) au démarrage', () => {
    renderOnboarding();
    expect(screen.getByTestId('role-step')).toBeInTheDocument();
  });

  it('rôle président → passe au step 4 (clubs) sans afficher les sports', async () => {
    renderOnboarding();

    fireEvent.click(screen.getByTestId('role-president'));
    fireEvent.click(screen.getByTestId('btn-next'));

    // Step 2 (sports) ne doit PAS s'afficher — step 4 (clubs) oui
    await waitFor(() => {
      expect(screen.queryByTestId('role-step')).not.toBeInTheDocument();
    });
    // La suggestion de clubs (ClubSuggestionsStep) apparaît — elle a un bouton Retour
    await waitFor(() => {
      const backBtn = screen.queryByRole('button', { name: /retour|précédent/i });
      expect(backBtn).toBeTruthy();
    });
  });

  it('rôle coach → passe au step 4 (clubs) sans afficher les sports', async () => {
    renderOnboarding();

    fireEvent.click(screen.getByTestId('role-coach'));
    fireEvent.click(screen.getByTestId('btn-next'));

    await waitFor(() => {
      expect(screen.queryByTestId('role-step')).not.toBeInTheDocument();
    });
  });

  it('rôle joueur → affiche le step 2 (sélection sports)', async () => {
    renderOnboarding();

    fireEvent.click(screen.getByTestId('role-joueur'));
    fireEvent.click(screen.getByTestId('btn-next'));

    await waitFor(() => {
      // Un des sports doit être visible dans le step 2
      expect(screen.getByText('Football')).toBeInTheDocument();
    });
  });

  it('rôle parent → affiche le step 2 (sélection sports)', async () => {
    renderOnboarding();

    fireEvent.click(screen.getByTestId('role-parent'));
    fireEvent.click(screen.getByTestId('btn-next'));

    await waitFor(() => {
      expect(screen.getByText('Basketball')).toBeInTheDocument();
    });
  });
});
