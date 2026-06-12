import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// jsdom ne fournit pas ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

function makeFullQuery(result = { data: [], error: null }) {
  const p = Promise.resolve(result);
  const q = {
    select:      vi.fn().mockReturnThis(),
    insert:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    delete:      vi.fn().mockReturnThis(),
    upsert:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    neq:         vi.fn().mockReturnThis(),
    in:          vi.fn().mockReturnThis(),
    or:          vi.fn().mockReturnThis(),
    order:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockReturnThis(),
    range:       vi.fn().mockReturnThis(),
    contains:    vi.fn().mockReturnThis(),
    single:      vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then:        (fn, rej) => p.then(fn, rej),
    catch:       (fn) => p.catch(fn),
  };
  return q;
}

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from:    mockFrom,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })) })) },
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: null, isAdmin: false }),
}));

vi.mock('../../contexts/SportsContext.jsx', () => ({
  useSports: () => ({ allSports: {} }),
  SportsProvider: ({ children }) => children,
}));

vi.mock('../../hooks/useSports.js', () => ({
  useSports: () => ({ allSports: {} }),
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div:     ({ children, ...p }) => <div {...p}>{children}</div>,
    button:  ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock PosterRenderer et PosterEditor — trop lourds à monter complets
vi.mock('../../components/poster/PosterRenderer.jsx', () => ({
  default: ({ templateId }) => <div data-testid="poster-renderer" data-template={templateId} />,
  POSTER_TEMPLATES: [
    { id: 'simple',     label: 'Classique',  isTournament: false },
    { id: 'impact',     label: 'Impact',     isTournament: false },
    { id: 'tr-premium', label: 'Premium',    isTournament: true  },
  ],
  BASE_DIMS: { story: { w: 360, h: 640 }, post: { w: 360, h: 450 } },
}));

vi.mock('../../components/poster/PosterEditor.jsx', () => ({
  default: () => <div data-testid="poster-editor" />,
}));

vi.mock('../../components/poster/PosterWizard.jsx', () => ({
  default:       ({ onClose }) => <div data-testid="poster-wizard"><button onClick={onClose}>Fermer wizard</button></div>,
  WizardStepBar: () => <div data-testid="wizard-step-bar" />,
  WizardContent: () => <div data-testid="wizard-content" />,
  WizardFooter:  () => <div data-testid="wizard-footer" />,
}));

vi.mock('../../components/poster/panels/ExportPanel.jsx', () => ({
  default: () => <div data-testid="export-panel" />,
}));
vi.mock('../../components/poster/panels/TemplatePanelTab.jsx', () => ({
  default: () => <div data-testid="template-panel" />,
}));
vi.mock('../../components/poster/panels/StylePanelTab.jsx', () => ({
  default: () => <div data-testid="style-panel" />,
}));
vi.mock('../../components/poster/panels/BackgroundPanelTab.jsx', () => ({
  default: () => <div data-testid="background-panel" />,
}));
vi.mock('../../components/poster/panels/PlayersPanelTab.jsx', () => ({
  default: () => <div data-testid="players-panel" />,
}));
vi.mock('../../components/poster/panels/TeamsPanelTab.jsx', () => ({
  default: () => <div data-testid="teams-panel" />,
}));

vi.mock('../../hooks/usePosterDraft.js', () => ({
  usePosterDraft:       () => ({ loadDraft: vi.fn(() => null), saveDraft: vi.fn(), clearDraft: vi.fn(), hasDraft: false }),
  usePosterLibrary:     () => ({ entries: [], save: vi.fn(), duplicate: vi.fn(), remove: vi.fn() }),
  useFavoriteTemplates: () => ({ getAll: vi.fn(() => []), toggle: vi.fn(), isFav: () => false, loadFromDB: vi.fn() }),
  useDefaultTemplate:   () => ({ get: vi.fn(() => null), set: vi.fn(), clear: vi.fn() }),
}));

vi.mock('../../hooks/useClubBrandKit.js', () => ({
  useClubBrandKit: () => ({ brandKit: null }),
}));

vi.mock('../../hooks/useClubMedia.js', () => ({
  useClubMedia: () => ({ assets: [], uploadAsset: vi.fn() }),
}));

import PosterStudio from '../../components/PosterStudio.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const EVENT = {
  id: 'evt-1',
  title: 'FC Brest vs Quimper FC',
  homeTeam: 'FC Brest',
  awayTeam: 'Quimper FC',
  date: '2026-07-10',
  sport: 'Football',
};

const CLUB = { id: 'club-1', name: 'FC Brest', logo: null };

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(makeFullQuery({ data: [], error: null }));
  localStorage.clear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PosterStudio — montage', () => {
  it('se monte sans crash avec event et club', () => {
    expect(() => render(
      <PosterStudio event={EVENT} club={CLUB} onClose={vi.fn()} />
    )).not.toThrow();
  });

  it('se monte sans crash sans club (club=null)', () => {
    expect(() => render(
      <PosterStudio event={EVENT} club={null} onClose={vi.fn()} />
    )).not.toThrow();
  });

  it('affiche au moins un bouton ou contenu après montage', () => {
    const { container } = render(<PosterStudio event={EVENT} club={CLUB} onClose={vi.fn()} />);
    expect(container.children.length).toBeGreaterThan(0);
  });

  it('appelle onClose au clic sur le bouton fermer', async () => {
    const onClose = vi.fn();
    render(<PosterStudio event={EVENT} club={CLUB} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /fermer|close|×/i });
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });
});

describe('PosterStudio — quickMode', () => {
  it('quickMode=true monte sans crash', () => {
    expect(() => render(
      <PosterStudio event={EVENT} club={CLUB} onClose={vi.fn()} quickMode={true} />
    )).not.toThrow();
  });
});

describe('PosterStudio — resultMode (AUTO-001)', () => {
  it('resultMode se monte sans crash', () => {
    expect(() => render(
      <PosterStudio
        event={EVENT}
        club={CLUB}
        onClose={vi.fn()}
        resultMode={{ home: 2, away: 1 }}
      />
    )).not.toThrow();
  });
});

describe('PosterStudio — accessibilité basique', () => {
  it('contient au moins un bouton accessible', async () => {
    render(<PosterStudio event={EVENT} club={CLUB} onClose={vi.fn()} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
