/**
 * Tests d'accessibilité WCAG 2.1 AA — composants SportLink
 * Utilise jest-axe pour détecter les violations axe automatiquement.
 *
 * Critères testés :
 * - Contraste couleur (color-contrast)
 * - Boutons avec aria-label (button-name)
 * - Images avec alt (image-alt)
 * - Labels de formulaire (label)
 * - Attributs ARIA requis (aria-required-attr)
 * - Rôles ARIA valides (aria-roles)
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
  useAnimation: () => ({ start: vi.fn() }),
}));

// ── ConvocationsList ──────────────────────────────────────────────────────────

import ConvocationsList from '../../components/convocations/ConvocationsList.jsx';

const CONV = {
  id: 'c-1', status: 'pending', responded_by: null, note: null,
  event: { id: 'e-1', homeTeam: 'FC Brest', awayTeam: 'Quimper', date: '2026-07-10T18:00:00Z', city: 'Brest' },
  player: { id: 'p-1', name: 'Jean Dupont' },
};

describe('Accessibilité — ConvocationsList', () => {
  it('aucune violation axe critique sur la liste', async () => {
    const { container } = render(
      <ConvocationsList convocations={[CONV]} onRespond={vi.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('boutons de réponse ont un nom accessible', async () => {
    const { container } = render(
      <ConvocationsList convocations={[CONV]} onRespond={vi.fn()} />
    );
    const results = await axe(container, {
      rules: { 'button-name': { enabled: true } },
    });
    expect(results).toHaveNoViolations();
  });
});

// ── HelpFab ───────────────────────────────────────────────────────────────────

vi.mock('../../constants/zIndex.js', () => ({ Z: { helpFab: 900 } }));

import HelpFab from '../../components/HelpFab.jsx';

describe('Accessibilité — HelpFab', () => {
  it('bouton "?" a un aria-label accessible', async () => {
    const { container } = render(<HelpFab onClick={vi.fn()} />);
    const results = await axe(container, {
      rules: { 'button-name': { enabled: true } },
    });
    expect(results).toHaveNoViolations();
  });
});

// ── OfflineBanner ─────────────────────────────────────────────────────────────

import OfflineBanner from '../../components/OfflineBanner.jsx';

describe('Accessibilité — OfflineBanner', () => {
  it('bannière hors-ligne sans violations axe', async () => {
    // Simuler mode offline
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const { container } = render(<OfflineBanner />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
});

// ── ErrorBoundary ─────────────────────────────────────────────────────────────

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      then: (fn) => Promise.resolve({ data: null, error: null }).then(fn),
    })),
  },
}));

import ErrorBoundary from '../../components/ErrorBoundary.jsx';

describe('Accessibilité — ErrorBoundary', () => {
  it('rendu normal sans erreur — aucune violation', async () => {
    const { container } = render(
      <ErrorBoundary name="test">
        <div>Contenu sain</div>
      </ErrorBoundary>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ── AnnouncementsCenter ───────────────────────────────────────────────────────

vi.mock('../../hooks/useMyAnnouncements.js', () => ({
  useMyAnnouncements: () => ({
    announcements: [], readIds: new Set(), unreadCount: 0,
    loading: false, markRead: vi.fn(), markAllRead: vi.fn(),
  }),
}));
vi.mock('../../hooks/useAndroidBack.js', () => ({ useAndroidBack: vi.fn() }));
vi.mock('../../components/AnnouncementCard.jsx', () => ({
  default: ({ ann }) => <div>{ann?.title}</div>,
}));

import AnnouncementsCenter from '../../components/AnnouncementsCenter.jsx';

describe('Accessibilité — AnnouncementsCenter', () => {
  it('dialog a le bon rôle et aria-label', async () => {
    const { container } = render(<AnnouncementsCenter onClose={vi.fn()} />);
    const results = await axe(container, {
      rules: {
        'aria-dialog-name': { enabled: true },
        'button-name':      { enabled: true },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('bouton retour a un aria-label', async () => {
    const { container } = render(<AnnouncementsCenter onClose={vi.fn()} />);
    const backBtn = container.querySelector('button[aria-label]');
    expect(backBtn).not.toBeNull();
    expect(backBtn.getAttribute('aria-label')).toBeTruthy();
  });
});
