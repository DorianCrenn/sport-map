/**
 * Tests d'accessibilité WCAG 2.1 AA — formulaires & pages d'auth SportLink
 * Cible les composants avec le plus d'interactions utilisateur.
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
    article:({ children, ...p }) => <article {...p}>{children}</article>,
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
    storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })) })) },
  },
  isDemoMode: vi.fn().mockReturnValue(false),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: { id: 'u1', name: 'Test User' }, isAdmin: false }),
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// ── BottomNav ─────────────────────────────────────────────────────────────────

vi.mock('../../hooks/useRideNotifications.js', () => ({ useRideNotifications: () => ({ unreadCount: 0 }) }));
vi.mock('../../hooks/useMyAnnouncements.js',    () => ({ useMyAnnouncements:   () => ({ unreadCount: 0 }) }));
vi.mock('../../hooks/useMyConvocations.js',     () => ({ useMyConvocations:    () => ({ pendingCount: 0 }) }));
vi.mock('../../hooks/useManagedClubs.js',       () => ({ useManagedClubs: () => ({ managedClubs: [], isCoachOrManager: false, isCommunicant: false }) }));

import BottomNav from '../../components/BottomNav.jsx';

describe('Accessibilité — BottomNav', () => {
  it('nav a le bon rôle et tous les boutons ont un label', async () => {
    const { container } = render(
      <BottomNav
        activeTab="home"
        onTabChange={vi.fn()}
        isAdmin={false}
        rideNotifCount={0}
        announcementsUnreadCount={0}
        badges={{}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('badge numérique a un aria-label accessible', async () => {
    const { container } = render(
      <BottomNav
        activeTab="favoris"
        onTabChange={vi.fn()}
        isAdmin={false}
        rideNotifCount={0}
        announcementsUnreadCount={0}
        badges={{ favoris: 3 }}
      />
    );
    const results = await axe(container, {
      rules: { 'button-name': { enabled: true } },
    });
    expect(results).toHaveNoViolations();
  });
});

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

import ConfirmDialog from '../../components/ConfirmDialog.jsx';

describe('Accessibilité — ConfirmDialog', () => {
  it('dialog a role, aria-modal et aria-label', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Supprimer cet événement ?"
        message="Cette action est irréversible."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('boutons Confirmer et Annuler ont des noms accessibles', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Supprimer ?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const results = await axe(container, {
      rules: { 'button-name': { enabled: true } },
    });
    expect(results).toHaveNoViolations();
  });
});

// ── ClubCreationWizard ────────────────────────────────────────────────────────

vi.mock('../../hooks/useFocusTrap.js',        () => ({ useFocusTrap:        vi.fn() }));
vi.mock('../../hooks/useAndroidBack.js',       () => ({ useAndroidBack:       vi.fn() }));
vi.mock('../../hooks/useScrollInputIntoView.js',() => ({ useScrollInputIntoView: vi.fn() }));
vi.mock('../../hooks/useSports.js',            () => ({
  useSports: () => ({ allSports: { Football: 'Football', Basketball: 'Basketball' } }),
}));
vi.mock('../../components/CityAutocomplete.jsx', () => ({
  default: ({ value, onChange }) => (
    <input aria-label="Ville" value={value ?? ''} onChange={e => onChange(e.target.value)} />
  ),
}));
vi.mock('../../components/SportIcon.jsx', () => ({
  default: ({ sport }) => <span aria-label={sport} />,
}));
vi.mock('../../constants/zIndex.js', () => ({ Z: { modal: 100 } }));

import ClubCreationWizard from '../../components/club/ClubCreationWizard.jsx';

describe('Accessibilité — ClubCreationWizard', () => {
  it('étape 1 : aucune violation axe', async () => {
    const { container } = render(
      <ClubCreationWizard onSave={vi.fn()} onClose={vi.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('tous les inputs de l\'étape 1 ont un label', async () => {
    const { container } = render(
      <ClubCreationWizard onSave={vi.fn()} onClose={vi.fn()} />
    );
    const results = await axe(container, {
      rules: { label: { enabled: true } },
    });
    expect(results).toHaveNoViolations();
  });
});
