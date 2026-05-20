import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import ClubPublicPage from '../../components/ClubPublicPage.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function dbClub(overrides = {}) {
  return {
    id: 'club-1', name: 'FC Brest', sport: 'Football', city: 'Brest',
    description: 'Un grand club breton.', logo_url: 'https://example.com/logo.png',
    website: 'https://fcbrest.fr',
    ...overrides,
  };
}

function q(terminal) {
  const obj = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(terminal),
  };
  return obj;
}

function setUrlId(id) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search: id ? `?id=${id}` : '' },
    writable: true, configurable: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setUrlId('club-1');
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClubPublicPage — chargement', () => {
  it('affiche l\'état de chargement initialement', () => {
    mockFrom.mockReturnValue(q(new Promise(() => {})));
    render(<ClubPublicPage />);
    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('affiche le nom du club après chargement', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub(), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(screen.getByText('FC Brest')).toBeInTheDocument());
  });

  it('affiche le sport et la ville', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub(), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(screen.getByText(/Football.*Brest/i)).toBeInTheDocument());
  });

  it('affiche la description', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub(), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(screen.getByText('Un grand club breton.')).toBeInTheDocument());
  });
});

describe('ClubPublicPage — logo', () => {
  it('affiche le logo si logo_url présent', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub(), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => {
      const img = screen.getByAltText('FC Brest');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
    });
  });

  it('affiche le placeholder si pas de logo', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub({ logo_url: null }), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(screen.queryByRole('img')).not.toBeInTheDocument());
  });
});

describe('ClubPublicPage — CTA', () => {
  it('lien "Voir le club sur SportLink" pointe vers #club/:id', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub(), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /voir le club sur sportlink/i });
      expect(link.href).toContain('#club/club-1');
    });
  });

  it('affiche le lien site officiel si website présent', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub(), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /site officiel/i })).toBeInTheDocument();
    });
  });

  it('n\'affiche pas le lien site officiel si website absent', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub({ website: null }), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(screen.getByText('FC Brest')).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /site officiel/i })).not.toBeInTheDocument();
  });
});

describe('ClubPublicPage — erreurs', () => {
  it('affiche une erreur si ID manquant', async () => {
    setUrlId(null);
    mockFrom.mockReturnValue(q({ data: null, error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(screen.getByText(/ID club manquant/i)).toBeInTheDocument());
  });

  it('affiche "Club introuvable" si Supabase retourne une erreur', async () => {
    mockFrom.mockReturnValue(q({ data: null, error: { message: 'Not found' } }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(screen.getByText(/club introuvable/i)).toBeInTheDocument());
  });

  it('affiche "Club introuvable" si data est null', async () => {
    mockFrom.mockReturnValue(q({ data: null, error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(screen.getByText(/club introuvable/i)).toBeInTheDocument());
  });

  it('affiche un lien retour à SportLink sur page d\'erreur', async () => {
    mockFrom.mockReturnValue(q({ data: null, error: { message: 'x' } }));
    render(<ClubPublicPage />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /retour à sportlink/i })).toBeInTheDocument();
    });
  });
});

describe('ClubPublicPage — meta OG', () => {
  it('met à jour document.title avec le nom du club', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub(), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => expect(document.title).toContain('FC Brest'));
  });

  it('injecte og:title dans le head', async () => {
    mockFrom.mockReturnValue(q({ data: dbClub(), error: null }));
    render(<ClubPublicPage />);
    await waitFor(() => {
      const el = document.querySelector('meta[property="og:title"]');
      expect(el?.getAttribute('content')).toContain('FC Brest');
    });
  });
});
